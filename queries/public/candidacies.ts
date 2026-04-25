import {
  CandidacyStatus,
  CandidacyType,
  CandidateCard,
  CandidateDetail,
  CandidatePresidentials,
} from "@/interfaces/candidate";
import { RnasSanction } from "@/interfaces/person";
import { TAGS, TTL } from "@/lib/cache-tags";
import { createPublicClient } from "@/lib/supabase/public";
import { QueryData } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { cache } from "react";

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
// Normaliza tildes para búsqueda
// ─────────────────────────────────────────────
function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u0302\u0304-\u036f]/g, "")
    .normalize("NFC")
    .trim();
}

function parseSearchWords(search: string): string[] {
  return normalizeSearchTerm(search)
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

export const getCandidatesCards = cache(
  unstable_cache(
    async ({
      electoral_process_id,
      type,
      districts,
      parties,
      search,
      ids,
      page = 1,
      pageSize = 40,
      alerts,
    }: GetCandidatesParams): Promise<CandidateCard[]> => {
      const supabase = createPublicClient();

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
          has_criminal_record,
          has_penal_sentence,
          is_under_investigation,
          has_sanction,
          reinfo_status,
          rnas_sanctions,
          has_income,
          has_assets,
          work_experience_count
        ),
        political_party:political_party_id!inner (
          id, name, acronym, logo_url, color_hex, active, foundation_date
        ),
        electoral_district:electoral_district_id!inner (
          id, name, code, is_national, active
        )
      `;

      const queryBuilder = supabase.from("candidate").select(selectQuery);
      type CandidatesWithRelations = QueryData<typeof queryBuilder>;

      const searchWords = search?.trim() ? parseSearchWords(search) : [];
      const hasSearch = searchWords.length > 0;

      const PRESIDENTE_MAX = 40;
      const isPresidente = !hasSearch && type === "PRESIDENTE";

      const from = isPresidente || hasSearch ? 0 : (page - 1) * pageSize;
      const to = isPresidente || hasSearch ? 99 : from + pageSize - 1;

      let query = queryBuilder.range(from, to);

      if (!isPresidente) {
        query = query.order("list_number", { ascending: true });
      }

      if (electoral_process_id)
        query = query.eq("electoral_process_id", electoral_process_id);
      if (ids && ids.length > 0) query = query.in("id", ids);

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
            if (districts && districts.length > 0)
              query = query.in("electoral_district.name", districts);
            break;
          case "DIPUTADO":
            query = query.eq("type", "DIPUTADO");
            if (districts && districts.length > 0)
              query = query.in("electoral_district.name", districts);
            break;
          case "PARLAMENTO_ANDINO":
            query = query
              .eq("type", "PARLAMENTO_ANDINO")
              .eq("electoral_district.is_national", true);
            break;
          default:
            query = query.eq("type", "PRESIDENTE");
            break;
        }
      }

      if (parties && parties.length > 0)
        query = query.in("political_party.id", parties);

      if (hasSearch) {
        for (const word of searchWords) {
          query = query.or(`name.ilike.%${word}%,lastname.ilike.%${word}%`, {
            referencedTable: "person",
          });
        }
      }

      if (alerts && alerts.length > 0) {
        if (alerts.includes("HAS_PENAL_SENTENCE"))
          query = query.eq("person.has_penal_sentence", false);
        if (alerts.includes("HAS_SANCTION"))
          query = query.eq("person.has_sanction", false);
        if (alerts.includes("EN_INVESTIGACION"))
          query = query.eq("person.is_under_investigation", false);
        if (alerts.includes("IS_INCUMBENT"))
          query = query.eq("person.is_incumbent", false);
      }

      query = query.eq("active", true);
      const { data, error } = await query;

      if (error) {
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

      return rawCandidates.map((candidate) => {
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
            is_incumbent: (p.is_incumbent as boolean) ?? false,
            education_level: (p.education_level as number | null) ?? null,
            secondary_school: (p.secondary_school as boolean | null) ?? null,
            has_criminal_record: (p.has_criminal_record as boolean) ?? false,
            has_penal_sentence: (p.has_penal_sentence as boolean) ?? false,
            is_under_investigation:
              (p.is_under_investigation as boolean) ?? false,
            has_sanction: (p.has_sanction as boolean) ?? false,
            reinfo_status: (p.reinfo_status as string | null) ?? null,
            rnas_sanctions:
              (p.rnas_sanctions as unknown as RnasSanction[] | null) ?? null,
            has_income: (p.has_income as boolean) ?? false,
            has_assets: (p.has_assets as boolean) ?? false,
            work_experience_count: p.work_experience_count as number,
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
    },
    ["candidates-cards-list"], // Next.js agrega automáticamente los parámetros a la key internamente
    { tags: [TAGS.candidates], revalidate: TTL.static },
  ),
);

export const getPrincipalCandidates = cache(
  unstable_cache(
    async (partidoId: string): Promise<CandidatePresidentials[]> => {
      const supabase = createPublicClient();

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
    },
    ["principal-candidates"],
    { tags: [TAGS.candidates, TAGS.electoral_process], revalidate: TTL.static },
  ),
);

export const getFormulaPorPartido = cache(
  unstable_cache(
    async (
      partidoId: string,
      processId: string,
    ): Promise<CandidatePresidentials[]> => {
      const supabase = createPublicClient();

      const { data, error } = await supabase
        .from("candidate")
        .select(
          `id, type, list_number,
           person:person_id!inner (
             id, fullname, image_candidate_url, profession
           )`,
        )
        .eq("electoral_process_id", processId)
        .eq("political_party_id", partidoId)
        .in("type", ["VICEPRESIDENTE_1", "VICEPRESIDENTE_2"])
        .order("list_number", { ascending: true });

      if (error || !data) return [];
      return data as unknown as CandidatePresidentials[];
    },
    ["formula-por-partido"],
    { tags: [TAGS.candidates], revalidate: TTL.static },
  ),
);

export const getActiveLegislatorId = cache(
  unstable_cache(
    async (personId: string): Promise<string | null> => {
      const supabase = createPublicClient();

      const { data, error } = await supabase
        .from("legislator")
        .select("id")
        .eq("person_id", personId)
        .eq("active", true)
        .single();

      if (error || !data) return null;
      return data.id;
    },
    ["active-legislator"],
    { tags: [TAGS.candidates], revalidate: TTL.static },
  ),
);

export const getCandidateById = cache(
  unstable_cache(
    async (candidateId: string): Promise<CandidateDetail | null> => {
      const supabase = createPublicClient();

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
        .maybeSingle();

      if (error) {
        console.error("Error fetching candidate detail:", error);
        return null;
      }

      if (!data) return null;
      return data as unknown as CandidateDetail;
    },
    ["candidate-detail"],
    { tags: [TAGS.candidates], revalidate: TTL.static },
  ),
);
