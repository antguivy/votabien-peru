"use server";

import { unstable_noStore as noStore } from "next/cache";
import type { GetLegislatorSchema } from "./validation";
import type {
  PaginatedLegislatorsResponse,
  ChamberCounts,
  DistrictCounts,
  ConditionCounts,
} from "./types";
import { createClient } from "@/lib/supabase/server";
import { AdminLegislator } from "@/interfaces/legislator";
import { type Tables } from "@/interfaces/supabase";
import {
  ChamberType,
  GroupChangeReason,
  LegislatorCondition,
} from "@/interfaces/politics";

type PersonRow = Tables<"person">;
type PartyRow = Tables<"politicalparty">;
type DistrictRow = Tables<"electoraldistrict">;
type GroupRow = Tables<"parliamentarygroup">;

type MembershipWithGroupRow = Tables<"parliamentarymembership"> & {
  parliamentary_group: GroupRow | null;
};

interface LegislatorQueryResult extends Tables<"legislator"> {
  person: PersonRow | null;
  political_party: PartyRow | null;
  electoral_district: DistrictRow | null;
  current_parliamentary_group: GroupRow | null; // Columna computada
  parliamentarymembership: MembershipWithGroupRow[];
}

function mapLegislatorToResponse(row: LegislatorQueryResult): AdminLegislator {
  const personName = row.person?.fullname || "Sin nombre";

  return {
    id: row.id,
    person_id: row.person_id,
    fullname: personName,
    elected_by_party_id: row.elected_by_party_id,
    electoral_district_id: row.electoral_district_id,
    chamber: row.chamber as ChamberType,
    condition: row.condition as LegislatorCondition,
    start_date: row.start_date,
    end_date: row.end_date,
    active: row.active,
    institutional_email: row.institutional_email,
    created_at: row.created_at,

    // Datos computados
    person: row.person,
    current_parliamentary_group: row.current_parliamentary_group,
    elected_by_party: row.political_party,
    electoral_district: row.electoral_district,

    // Lista histórica mapeada
    parliamentary_memberships: (row.parliamentarymembership || []).map(
      (pm) => ({
        ...pm,
        change_reason: pm.change_reason as GroupChangeReason,
        parliamentary_group: pm.parliamentary_group || undefined,
      }),
    ),
  };
}

export async function getLegislators(
  input: GetLegislatorSchema,
): Promise<PaginatedLegislatorsResponse> {
  noStore();
  const supabase = await createClient();

  try {
    let query = supabase.from("legislator").select(
      `
        *,
        person:person_id!inner(*), 
        political_party:elected_by_party_id(*),
        electoral_district:electoral_district_id!inner(*),
        current_parliamentary_group,
        parliamentarymembership(
          *,
          parliamentary_group:parliamentary_group_id(*)
        )
      `,
      { count: "exact" },
    );

    if (input.fullname) {
      query = query.ilike("person.fullname", `%${input.fullname}%`);
    }

    if (input.chamber && input.chamber.length > 0) {
      query = query.in("chamber", input.chamber);
    }

    if (input.condition && input.condition.length > 0) {
      query = query.in("condition", input.condition);
    }

    if (input.electoral_district && input.electoral_district.length > 0) {
      query = query.in("electoral_district.name", input.electoral_district);
    }

    // Orden
    if (input.sort && input.sort.length > 0) {
      const sortItem = input.sort[0];

      if (sortItem.id === "fullname") {
        // Orden por columna computada en SQL
        query = query.order("legislator_fullname", {
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

    const typedData = (data || []) as unknown as LegislatorQueryResult[];

    return {
      data: typedData.map(mapLegislatorToResponse),
      total: count || 0,
      page: page,
      page_size: pageSize,
    };
  } catch (error) {
    console.error("Error fetching legislators:", error);
    throw new Error("Failed to fetch legislators");
  }
}

async function fetchAllForCounting<K extends keyof Tables<"legislator">>(
  column: K,
) {
  const supabase = await createClient();
  const { data } = await supabase.from("legislator").select(column);
  return (data || []) as unknown as Pick<Tables<"legislator">, K>[];
}

export async function getChamberTypeCounts(): Promise<ChamberCounts> {
  try {
    const data = await fetchAllForCounting("chamber");

    return data.reduce<ChamberCounts>((acc, curr) => {
      const key = curr.chamber;
      // Validamos que key no sea null (por si acaso)
      if (key) {
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error("Error chamber type counts:", error);
    return {};
  }
}

export async function getLegislatorConditionCounts(): Promise<ConditionCounts> {
  try {
    const data = await fetchAllForCounting("condition");

    return data.reduce<ConditionCounts>((acc, curr) => {
      const key = curr.condition;
      if (key) {
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error("Error condition counts:", error);
    return {};
  }
}

interface DistrictCountQueryRow {
  electoral_district_id: string;
  electoral_district: {
    id: string;
    name: string;
  } | null;
}

export async function getDistrictsCounts(): Promise<DistrictCounts> {
  noStore();
  const supabase = await createClient();
  try {
    const { data } = await supabase.from("legislator").select(`
        electoral_district_id,
        electoral_district:electoral_district_id(id, name)
      `);

    if (!data) return {};

    const typedData = data as unknown as DistrictCountQueryRow[];
    const counts: DistrictCounts = {};

    typedData.forEach((item) => {
      const dist = item.electoral_district;
      if (dist && dist.id) {
        if (!counts[dist.id]) {
          counts[dist.id] = { name: dist.name, count: 0 };
        }
        counts[dist.id].count += 1;
      }
    });

    return counts;
  } catch (error) {
    console.error("Error district counts:", error);
    return {};
  }
}
