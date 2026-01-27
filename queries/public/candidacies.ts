"use server";

import { AdminCandidate, CandidateCard } from "@/interfaces/candidate";
import { CandidacyStatus, CandidacyType } from "@/interfaces/politics";
import { Database } from "@/interfaces/supabase";
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
      profession, incomes, work_experience, university_education
    ),
    political_party:political_party_id (
      id, name, acronym, logo_url, color_hex, active, foundation_date
    ),
    electoral_district:electoral_district_id (
      id, name, code, is_national, active
    )
  `;
  const queryBuilder = supabase
    .from("candidate")
    .select(selectQuery, { count: "exact" });
  type CandidatesWithRelations = QueryData<typeof queryBuilder>;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = queryBuilder
    .range(from, to)
    .order("created_at", { ascending: false });

  if (electoral_process_id) {
    query = query.eq("electoral_process_id", electoral_process_id);
  }

  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  }

  if (type) {
    if (type === "VICEPRESIDENTE") {
      query = query.in("type", ["VICEPRESIDENTE_1", "VICEPRESIDENTE_2"]);
    } else {
      query = query.eq("type", type as CandidacyType);
    }
  }

  if (districts && districts.length > 0) {
    query = query.in("electoral_district.name", districts);
  }
  if (parties && parties.length > 0) {
    query = query.in("political_party.name", parties);
  }

  if (search) {
    const term = search.trim();
    query = query.or(
      `fullname.ilike.%${term}%,name.ilike.%${term}%,lastname.ilike.%${term}%,dni.ilike.%${term}%`,
      { foreignTable: "person" },
    );
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

    const hasData = Boolean(
      (Array.isArray(p.incomes) && p.incomes.length > 0) ||
        (Array.isArray(p.work_experience) && p.work_experience.length > 0) ||
        (Array.isArray(p.university_education) &&
          p.university_education.length > 0),
    );

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

      has_metrics: hasData,
    };
  });

  return results;
}
export async function getAllCandidates(limit: number = 100) {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from("candidate")
    .select(
      `
      id,
      electoral_process_id,
      political_party_id,
      type,
      list_number,
      status,
      created_at,
      person:person_id (
        id,
        fullname,
        image_url
      ),
      political_party:political_party_id (
        id,
        name,
        acronym
      ),
      electoral_district:electoral_district_id (
        id,
        name
      )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error verificando tabla candidate:", error);
    return {
      success: false,
      error: error.message,
      total: 0,
      data: [],
    };
  }

  return {
    success: true,
    error: null,
    total: count || 0,
    data: data || [],
    message: `Se encontraron ${count || 0} candidatos en total. Mostrando ${data?.length || 0}.`,
  };
}
