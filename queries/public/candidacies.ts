"use server";

import { BackgroundStatus } from "@/interfaces/background";
import {
  CandidacyStatus,
  CandidacyType,
  CandidateCard,
  CandidateDetail,
  CandidatePresidentials,
} from "@/interfaces/candidate";
import { createClient } from "@/lib/supabase/server";
import { QueryData } from "@supabase/supabase-js";

interface GetCandidatesParams {
  ids?: string[];
  electoral_process_id?: string;
  /**
   * Valores posibles: PRESIDENTE | SENADOR_NACIONAL | SENADOR_REGIONAL
   *                   | DIPUTADO | PARLAMENTO_ANDINO
   */
  type?: string;
  districts?: string[];
  parties?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
  alerts?: string[];
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
  pageSize = 40,
  alerts,
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
      id, name, lastname, fullname, image_url, image_candidate_url,
      profession,
      is_incumbent,
      education_level,
      secondary_school,
      incomes,
      assets,
      work_experience,
      has_penal_sentence,
      is_under_investigation,
      has_sanction,
      backgrounds: background(status)
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

  const from = isPresidente || hasSearch ? 0 : (page - 1) * pageSize;
  const to = isPresidente || hasSearch ? 99 : from + pageSize - 1;

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

  // ── Filtros de tipo → mapeo UI → DB ──
  if (!hasSearch && type) {
    switch (type) {
      case "PRESIDENTE":
        query = query
          .eq("type", "PRESIDENTE")
          .eq("electoral_district.is_national", true);
        break;

      case "SENADOR_NACIONAL":
        query = query
          .eq("type", "SENADOR")
          .eq("electoral_district.is_national", true);
        break;

      case "SENADOR_REGIONAL":
        query = query
          .eq("type", "SENADOR")
          .eq("electoral_district.is_national", false);
        if (districts && districts.length > 0) {
          query = query.in("electoral_district.name", districts);
        }
        break;

      case "DIPUTADO":
        query = query.eq("type", "DIPUTADO");
        if (districts && districts.length > 0) {
          query = query.in("electoral_district.name", districts);
        }
        break;

      case "PARLAMENTO_ANDINO":
        query = query
          .eq("type", "PARLAMENTO_ANDINO")
          .eq("electoral_district.is_national", true);
        break;

      default:
        // fallback: filtrar por el valor directo
        query = query.eq("type", "PRESIDENTE");
        break;
    }
  }

  // Filtro de partido — siempre activo
  if (parties && parties.length > 0) {
    query = query.in("political_party.id", parties);
  }

  // ── Búsqueda multi-palabra ──
  if (hasSearch) {
    // Query separada sobre person — sin foreignTable
    let personQuery = supabase.from("person").select("id");

    for (const word of searchWords) {
      const normalized = normalizeSearchTerm(word);
      // Múltiples .or() en la misma tabla = AND entre palabras
      personQuery = personQuery.or(
        `name.ilike.%${normalized}%,lastname.ilike.%${normalized}%`,
      );
    }

    const { data: persons, error: personError } = await personQuery;

    if (personError || !persons?.length) return [];

    // Filtrar candidates por los IDs resueltos
    query = query.in(
      "person_id",
      persons.map((p) => p.id),
    );
  }

  if (alerts && alerts.length > 0) {
    const conditions: string[] = [];

    if (alerts.includes("HAS_PENAL_SENTENCE"))
      conditions.push("has_penal_sentence.eq.true");
    if (alerts.includes("HAS_SANCTION"))
      conditions.push("has_sanction.eq.true");
    if (alerts.includes("EN_INVESTIGACION"))
      conditions.push("is_under_investigation.eq.true");
    if (alerts.includes("IS_INCUMBENT"))
      conditions.push("is_incumbent.eq.true");

    if (conditions.length > 0) {
      const { data: excludedPersons } = await supabase
        .from("person")
        .select("id")
        .or(conditions.join(","));

      if (excludedPersons && excludedPersons.length > 0) {
        query = query.not(
          "person_id",
          "in",
          `(${excludedPersons.map((p) => p.id).join(",")})`,
        );
      }
    }
  }

  query = query.eq("active", true);
  const { data, error } = await query;

  if (error) {
    // Supabase lanza este error cuando el offset supera el total de resultados
    // No es un error real — significa que no hay más páginas
    if (
      error.message?.includes("PGRST103") ||
      error.code === "PGRST103" ||
      error.message?.startsWith('{"')
    ) {
      return [];
    }
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
        id: p.id,
        fullname: p.fullname,
        image_url: p.image_url,
        image_candidate_url: p.image_candidate_url,
        profession: p.profession,

        // ── Nuevo ──
        is_incumbent: (p.is_incumbent as boolean) ?? false,
        education_level: (p.education_level as number | null) ?? null,
        secondary_school: (p.secondary_school as boolean | null) ?? null,
        incomes: (p.incomes as Record<string, unknown> | null) ?? null,
        assets: (p.assets as Record<string, unknown> | null) ?? null,
        work_experience: (p.work_experience as unknown[] | null) ?? null,
        has_penal_sentence: (p.has_penal_sentence as boolean) ?? false,
        is_under_investigation: (p.is_under_investigation as boolean) ?? false,
        has_sanction: (p.has_sanction as boolean) ?? false,
        backgrounds: (p.backgrounds as { status: BackgroundStatus }[]) ?? null,
      },

      political_party: {
        id: candidate.political_party?.id,
        name: candidate.political_party?.name,
        acronym: candidate.political_party?.acronym ?? null,
        logo_url: candidate.political_party?.logo_url ?? null,
        color_hex: candidate.political_party?.color_hex ?? null,
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

export async function getCandidateById(
  candidateId: string,
): Promise<CandidateDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("candidate")
    .select(
      `
      *,
      person:person_id!inner(
        *,
        backgrounds:background(*)
      ),
      political_party:political_party_id!inner(
        id, name, acronym, logo_url, color_hex, active, foundation_date
      ),
      electoral_district:electoral_district_id(
        id, name, code, is_national, active
      ),
      electoral_process:electoral_process_id(*)
      `,
    )
    .eq("id", candidateId)
    .eq("active", true)
    .single();

  if (error) {
    console.error("Error fetching candidate detail:", error);
    return null;
  }

  if (!data) return null;

  return data as unknown as CandidateDetail;
}
