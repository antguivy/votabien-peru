"use server";

import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { type Tables } from "@/interfaces/supabase";
import { GetCandidateSchema } from "./validation";
import {
  PaginatedCandidatesResponse,
  PartyCounts,
  StatusCounts,
  TypeCounts,
} from "./types";
import {
  AdminCandidate,
  CandidacyStatus,
  CandidacyType,
} from "@/interfaces/candidate";

type PersonRow = Tables<"person">;
type PartyRow = Tables<"politicalparty">;
type DistrictRow = Tables<"electoraldistrict">;
type ProcessRow = Tables<"electoralprocess">;

interface CandidateQueryResult extends Tables<"candidate"> {
  person: PersonRow | null;
  political_party: PartyRow | null;
  electoral_district: DistrictRow | null;
  electoral_process: ProcessRow | null;
}

function mapCandidateToResponse(row: CandidateQueryResult): AdminCandidate {
  const personName = row.person?.fullname || "Sin nombre";

  return {
    id: row.id,
    person_id: row.person_id,
    fullname: personName,
    political_party_id: row.political_party_id,
    electoral_district_id: row.electoral_district_id,
    type: row.type as CandidacyType,
    status: row.status as CandidacyStatus,
    electoral_process_id: row.electoral_process_id,
    list_number: row.list_number,
    active: row.active,
    created_at: row.created_at,

    // Datos computados
    person: row.person,
    electoral_process: row.electoral_process,
    political_party: row.political_party,
    electoral_district: row.electoral_district,
  };
}

export async function getCandidates(
  input: GetCandidateSchema,
): Promise<PaginatedCandidatesResponse> {
  noStore();
  const supabase = await createClient();

  try {
    let query = supabase.from("candidate").select(
      `
        *,
        person:person_id!inner(
          fullname,
          image_url,
          image_candidate_url,
          profession,
          dni
        ), 
        political_party:political_party_id!inner(
          id,
          name,
          logo_url,
          color_hex
        ),
        electoral_district:electoral_district_id!inner(*),
        electoral_process:electoral_process_id!inner(*)
      `,
      { count: "exact" },
    );

    if (input.fullname) {
      query = query.ilike("person.fullname", `%${input.fullname}%`);
    }

    if (input.type && input.type.length > 0) {
      query = query.in("type", input.type);
    }

    if (input.status && input.status.length > 0) {
      query = query.in("status", input.status);
    }

    if (input.parties && input.parties.length > 0) {
      query = query.in("political_party.name", input.parties);
    }

    // Orden
    if (input.sort && input.sort.length > 0) {
      const sortItem = input.sort[0];

      if (sortItem.id === "fullname") {
        // Orden por columna computada en SQL
        query = query.order("candidate_fullname", {
          ascending: !sortItem.desc,
        });
      } else {
        query = query.order(sortItem.id, { ascending: !sortItem.desc });
      }
    } else {
      query = query.order("start_date", { ascending: false });
    }

    const page = input.page || 1;
    const pageSize = input.perPage || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const typedData = (data || []) as unknown as CandidateQueryResult[];

    return {
      data: typedData.map(mapCandidateToResponse),
      total: count || 0,
      page: page,
      page_size: pageSize,
    };
  } catch (error) {
    console.error("Error fetching candidates:", error);
    throw new Error("Failed to fetch candidates");
  }
}

async function fetchAllForCounting<K extends keyof Tables<"candidate">>(
  column: K,
) {
  const supabase = await createClient();
  const { data } = await supabase.from("candidate").select(column);
  return (data || []) as unknown as Pick<Tables<"candidate">, K>[];
}

export async function getCandidacyTypeCounts(): Promise<TypeCounts> {
  try {
    const data = await fetchAllForCounting("type");

    return data.reduce<TypeCounts>((acc, curr) => {
      const key = curr.type;
      // Validamos que key no sea null (por si acaso)
      if (key) {
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error("Error candidacy type counts:", error);
    return {};
  }
}

export async function getCandidacyStatusCounts(): Promise<StatusCounts> {
  try {
    const data = await fetchAllForCounting("status");

    return data.reduce<StatusCounts>((acc, curr) => {
      const key = curr.status;
      if (key) {
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error("Error candidacy status counts:", error);
    return {};
  }
}

export async function getPartiesCounts(): Promise<PartyCounts> {
  noStore();
  const supabase = await createClient();

  try {
    // 1. Obtener proceso activo y ocultar partidos que son parte de una alianza activa
    const { data: activeProcess } = await supabase
      .from("electoralprocess")
      .select("id")
      .eq("active", true)
      .single();

    let hiddenPartyIds: string[] = [];

    if (activeProcess) {
      const { data: allianceMembers } = await supabase
        .from("alliancecomposition")
        .select("child_org_id")
        .eq("process_id", activeProcess.id);

      if (allianceMembers && allianceMembers.length > 0) {
        hiddenPartyIds = allianceMembers
          .map((m) => m.child_org_id)
          .filter((id): id is string => id !== null);
      }
    }

    // 2. Query a politicalparty con conteo de candidatos agregado
    let query = supabase
      .from("politicalparty")
      .select(
        `
        id,
        name,
        active,
        candidates:candidate(count)
      `,
      )
      .order("name", { ascending: true })
      .eq("active", true);

    if (hiddenPartyIds.length > 0) {
      const idsString = `("${hiddenPartyIds.join('","')}")`;
      query = query.filter("id", "not.in", idsString);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return {};

    const counts: PartyCounts = {};
    data.forEach((party) => {
      counts[party.id] = {
        name: party.name,
        count:
          (party.candidates as unknown as { count: number }[])[0]?.count ?? 0,
      };
    });

    return counts;
  } catch (error) {
    console.error("Error parties counts:", error);
    return {};
  }
}
