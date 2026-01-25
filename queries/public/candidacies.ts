"use server";

import { CandidateCard } from "@/interfaces/candidate";
import { CandidacyType } from "@/interfaces/politics";
import { createClient } from "@/lib/supabase/server";

interface GetCandidatesParams {
  electoral_process_id?: string;
  type?: CandidacyType | string;
  districts?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getCandidatesCards({
  electoral_process_id,
  type,
  districts,
  search,
  page = 1,
  pageSize = 20,
}: GetCandidatesParams): Promise<CandidateCard[]> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("candidate")
    .select(
      `
      id,
      electoral_process_id,
      political_party_id,
      type,
      list_number,
      status,
      person:person_id!inner (
        id,
        fullname,
        name,
        lastname,
        image_url,
        image_candidate_url,
        profession
      ),
      political_party:political_party_id (
        id,
        name,
        acronym,
        logo_url,
        color_hex,
        active,
        foundation_date
      ),
      electoral_district:electoral_district_id (
        id,
        name,
        code,
        is_national,
        active
      )
    `,
    )
    .range(from, to)
    .order("created_at", { ascending: false });

  if (electoral_process_id) {
    query = query.eq("electoral_process_id", electoral_process_id);
  }

  if (type) {
    query = query.eq("type", type as CandidacyType);
  }

  if (districts && districts.length > 0) {
    query = query.in("electoral_district.name", districts);
  }

  if (search) {
    const searchTerm = `%${search}%`;
    query = query.or(
      `person.fullname.ilike.${searchTerm},person.name.ilike.${searchTerm},person.lastname.ilike.${searchTerm}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching candidates:", error);
    throw new Error("Error al obtener candidatos");
  }

  const rawCandidates = data as unknown as CandidateCard[];
  if (!rawCandidates || rawCandidates.length === 0) return [];

  const candidateIds = rawCandidates.map((c) => c.id);
  const { data: metricsData } = await supabase
    .from("candidatemetrics")
    .select("candidate_id")
    .in("candidate_id", candidateIds);

  const metricsSet = new Set(metricsData?.map((m) => m.candidate_id));

  const results: CandidateCard[] = rawCandidates.map((candidate) => {
    return {
      id: candidate.id,
      active: candidate.active,
      electoral_process_id: candidate.electoral_process_id,
      political_party_id: candidate.political_party_id,
      type: candidate.type,
      list_number: candidate.list_number,
      status: candidate.status,
      person: {
        id: candidate.person.id,
        fullname: candidate.person.fullname,
        image_url: candidate.person.image_url,
        image_candidate_url: candidate.person.image_candidate_url,
        profession: candidate.person.profession,
      },
      political_party: {
        id: candidate.political_party.id,
        name: candidate.political_party.name,
        acronym: candidate.political_party.acronym,
        logo_url: candidate.political_party.logo_url ?? null,
        color_hex: candidate.political_party.color_hex,
        active: candidate.political_party.active,
        foundation_date: candidate.political_party.foundation_date ?? null,
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
      has_metrics: metricsSet.has(candidate.id),
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
