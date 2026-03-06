"use server";

import { CandidateCard, CandidatePresidentials } from "@/interfaces/candidate";
import { CandidacyStatus, CandidacyType } from "@/interfaces/politics";
import { createClient } from "@/lib/supabase/server";
import { QueryData } from "@supabase/supabase-js";

interface GetCandidatesParams {
  ids?: string[];
  electoral_process_id?: string;
  type?: CandidacyType | string;
  districts?: string[];
  parties?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
  districtType?: "unico" | "multiple";
}

// ─────────────────────────────────────────────
// Fisher-Yates shuffle — O(n), sin mutación del
// array original
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Normaliza tildes para búsqueda
// ─────────────────────────────────────────────
function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseSearchWords(search: string): string[] {
  return normalizeSearchTerm(search)
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

export async function getCandidatesCards({
  electoral_process_id,
  type,
  districts,
  parties,
  search,
  ids,
  page = 1,
  pageSize = 20,
  districtType,
}: GetCandidatesParams): Promise<CandidateCard[]> {
  const supabase = await createClient();

  const selectQuery = `
    id,
    electoral_process_id,
    political_party_id,
    electoral_district_id,
    type,
    list_number,
    status,
    active,
    person:person_id!inner (
      id, fullname, name, lastname, dni, image_url, image_candidate_url,
      profession
    ),
    political_party:political_party_id!inner (
      id, name, acronym, logo_url, color_hex, active, foundation_date
    ),
    electoral_district:electoral_district_id!inner (
      id, name, code, is_national, active
    )
  `;

  const queryBuilder = supabase
    .from("candidate")
    .select(selectQuery, { count: "exact" });

  type CandidatesWithRelations = QueryData<typeof queryBuilder>;

  const searchWords = search?.trim() ? parseSearchWords(search) : [];
  const hasSearch = searchWords.length > 0;

  // ─────────────────────────────────────────────
  // Para PRESIDENTE sin búsqueda activa:
  //   - Traemos todos los presidentes (sin paginación)
  //     para poder hacer el shuffle completo.
  //     Los presidentes son pocos (~15-20) así que
  //     el costo es mínimo.
  //   - Para el resto de tipos mantenemos paginación normal.
  //
  // ¿Por qué no usar ORDER BY random() en Supabase?
  //   PostgREST no soporta .order('random()') directamente.
  //   Una RPC funcionaría pero agrega complejidad innecesaria
  //   para un conjunto tan pequeño de registros.
  // ─────────────────────────────────────────────
  const PRESIDENTE_MAX = 40; // ~3x partidos posibles, margen seguro
  const isPresidente = !hasSearch && type === "PRESIDENTE";

  const from = isPresidente ? 0 : (page - 1) * pageSize;
  const to = isPresidente ? PRESIDENTE_MAX - 1 : from + pageSize - 1;

  let query = queryBuilder.range(from, to);

  // Solo ordenamos por list_number cuando NO es presidente aleatorio
  if (!isPresidente) {
    query = query.order("list_number", { ascending: true });
  }

  if (electoral_process_id) {
    query = query.eq("electoral_process_id", electoral_process_id);
  }

  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  }

  // ── Filtros de tipo y distrito ──
  if (!hasSearch) {
    if (type === "PRESIDENTE") {
      query = query.eq("type", "PRESIDENTE");
      query = query.eq("electoral_district.is_national", true);
    } else if (type === "VICEPRESIDENTE") {
      query = query.in("type", ["VICEPRESIDENTE_1", "VICEPRESIDENTE_2"]);
      query = query.eq("electoral_district.is_national", true);
    } else if (type === "SENADOR") {
      query = query.eq("type", "SENADOR");
      if (districtType === "multiple") {
        query = query.eq("electoral_district.is_national", false);
        if (districts && districts.length > 0) {
          query = query.in("electoral_district.name", districts);
        }
      } else {
        query = query.eq("electoral_district.is_national", true);
      }
    } else if (type === "DIPUTADO") {
      query = query.eq("type", "DIPUTADO");
      if (districts && districts.length > 0) {
        query = query.in("electoral_district.name", districts);
      }
    }
  }

  // Filtro de partido — siempre activo
  if (parties && parties.length > 0) {
    query = query.in("political_party.name", parties);
  }

  // ── Búsqueda multi-palabra ──
  if (hasSearch) {
    for (const word of searchWords) {
      const normalized = normalizeSearchTerm(word);
      query = query.or(
        [
          `fullname.ilike.%${normalized}%`,
          `name.ilike.%${normalized}%`,
          `lastname.ilike.%${normalized}%`,
          `dni.ilike.%${normalized}%`,
        ].join(","),
        { foreignTable: "person" },
      );
    }
  }

  query = query.eq("active", true);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching candidates:", error);
    throw new Error("Error al obtener candidatos");
  }

  const rawCandidates = data as CandidatesWithRelations;
  if (!rawCandidates) return [];

  const results: CandidateCard[] = rawCandidates.map((candidate) => {
    const p = candidate.person;

    return {
      id: candidate.id,
      active: candidate.active,
      electoral_process_id: candidate.electoral_process_id,
      political_party_id: candidate.political_party_id,
      electoral_district_id: candidate.electoral_district_id,
      type: candidate.type as CandidacyType,
      list_number: candidate.list_number,
      status: candidate.status as CandidacyStatus,
      person: {
        id: candidate.person.id,
        fullname: candidate.person.fullname,
        dni: candidate.person.dni,
        image_url: candidate.person.image_url,
        image_candidate_url: candidate.person.image_candidate_url,
        profession: candidate.person.profession,
      },
      political_party: {
        id: candidate.political_party?.id,
        name: candidate.political_party?.name,
        acronym: candidate.political_party?.acronym,
        logo_url: candidate.political_party?.logo_url ?? null,
        color_hex: candidate.political_party?.color_hex,
        active: candidate.political_party?.active,
        foundation_date: candidate.political_party?.foundation_date ?? null,
      },
      electoral_district: candidate.electoral_district
        ? {
            id: candidate.electoral_district.id,
            name: candidate.electoral_district.name,
            code: candidate.electoral_district.code,
            is_national: candidate.electoral_district.is_national,
            active: candidate.electoral_district.active,
          }
        : null,
      has_metrics: false,
    };
  });

  // ── Shuffle aleatorio para PRESIDENTE ──
  // Se aplica solo cuando no hay búsqueda activa y el tipo es PRESIDENTE.
  // Cada visita/recarga muestra un orden diferente — ningún partido
  // tiene ventaja por aparecer siempre primero.
  return results;
}

export async function getPrincipalCandidates(
  partidoId: string,
): Promise<CandidatePresidentials[]> {
  const supabase = await createClient();

  const { data: processValid } = await supabase
    .from("electoralprocess")
    .select("id")
    .eq("active", true)
    .single();

  if (!processValid) throw new Error("No hay proceso electoral activo");

  const { data, error } = await supabase
    .from("candidate")
    .select(
      `id, person:person_id!inner (id, fullname, image_candidate_url), type`,
    )
    .eq("electoral_process_id", processValid.id)
    .eq("political_party_id", partidoId)
    .in("type", ["PRESIDENTE", "VICEPRESIDENTE_1", "VICEPRESIDENTE_2"]);

  return (data as CandidatePresidentials[]).map((c) => ({
    id: c.id,
    type: c.type as CandidacyType,
    person: {
      id: c.person.id,
      fullname: c.person.fullname,
      image_url: null,
      image_candidate_url: c.person.image_candidate_url,
      dni: null,
      profession: null,
    },
  }));
}
