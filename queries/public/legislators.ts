"use server";

import { LegislatorCard } from "@/interfaces/legislator";
import { LegislatorVersusCard } from "@/interfaces/legislator-metrics";
import { ChamberType } from "@/interfaces/politics";
import { Database } from "@/interfaces/supabase";
import { createClient } from "@/lib/supabase/server";

interface GetLegislatorsParams {
  active_only?: boolean;
  chamber?: ChamberType;
  groups?: string[];
  districts?: string[];
  search?: string;
  ids?: string[];
  page?: number;
  pageSize?: number;
  limit?: number;
}

export async function getLegisladoresCards({
  active_only = true,
  chamber,
  groups,
  districts,
  search,
  ids,
  page = 1,
  pageSize = 30,
}: GetLegislatorsParams): Promise<LegislatorCard[]> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Nota: 'current_parliamentary_group'
  // ahora se pide como si fuera una columna
  // ya que es una funcion SQL en db
  let query = supabase
    .from("legislator")
    .select(
      `
      id,
      chamber,
      condition,
      active,
      start_date,
      end_date,
      person:person_id!inner ( id, fullname, image_url, profession ),
      electoral_district:electoral_district_id ( id, name, code ),
      elected_by_party:elected_by_party_id ( id, name, acronym ),
      current_parliamentary_group
    `,
    )
    .range(from, to);

  if (active_only) query = query.eq("active", true);
  if (chamber) query = query.eq("chamber", chamber);
  if (ids && ids.length > 0) query = query.in("id", ids);

  if (search) {
    query = query.ilike("person.fullname", `%${search}%`);
  }

  if (districts && districts.length > 0) {
    query = query.in("electoral_district.name", districts);
  }

  if (groups && groups.length > 0) {
    query = query
      .not("parliamentarymembership.id", "is", null)
      .is("parliamentarymembership.end_date", null)
      .or(
        `name.in.(${groups.map((g) => `"${g}"`).join(",")}),acronym.in.(${groups.map((g) => `"${g}"`).join(",")})`,
        {
          foreignTable: "parliamentarymembership.parliamentarygroup",
        },
      );
  }

  query = query.order("lastname", { foreignTable: "person", ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching legislators:", error);
    throw new Error("Error al obtener legisladores");
  }
  const rawLegislators = data as unknown as LegislatorCard[];
  if (!rawLegislators || rawLegislators.length === 0) return [];

  const legislatorIds = rawLegislators.map((l) => l.id);
  const { data: metricsData } = await supabase
    .from("legislatormetrics")
    .select("legislator_id")
    .in("legislator_id", legislatorIds);

  const metricsSet = new Set(metricsData?.map((m) => m.legislator_id));

  const results: LegislatorCard[] = rawLegislators.map((leg) => {
    return {
      id: leg.id,
      chamber: leg.chamber,
      condition: leg.condition,
      active: leg.active,
      start_date: leg.start_date,
      end_date: leg.end_date,
      person: {
        id: leg.person.id,
        fullname: leg.person.fullname,
        image_url: leg.person.image_url,
        image_candidate_url: leg.person.image_url,
        profession: leg.person.profession,
      },
      elected_by_party: {
        id: leg.elected_by_party.id,
        name: leg.elected_by_party.name,
        acronym: leg.elected_by_party.acronym,
        logo_url: leg.elected_by_party.logo_url ?? null,
        color_hex: leg.elected_by_party.color_hex,
        active: leg.elected_by_party.active,
        foundation_date: leg.elected_by_party.foundation_date ?? null,
      },
      electoral_district: {
        id: leg.electoral_district.id,
        name: leg.electoral_district.name,
        code: leg.electoral_district.code,
        is_national: leg.electoral_district.is_national,
        active: leg.electoral_district.active,
      },
      current_parliamentary_group: leg.current_parliamentary_group,

      has_metrics: metricsSet.has(leg.id),
    };
  });

  return results;
}

type PersonRow = Database["public"]["Tables"]["person"]["Row"];
type MetricsRow = Database["public"]["Tables"]["legislatormetrics"]["Row"];

type LegislatorFromDB = {
  id: string;
  chamber: "CONGRESO" | "SENADO";
  condition: string;
  start_date: string;
  active: boolean;
  person: Pick<
    PersonRow,
    "id" | "fullname" | "name" | "lastname" | "image_url" | "profession"
  >;
  electoral_district: {
    id: string;
    name: string;
  } | null;
  elected_by_party: {
    id: string;
    name: string;
    acronym: string | null;
    logo_url: string | null;
    color_hex: string | null;
    active: boolean;
    foundation_date: string | null;
  } | null;
  current_parliamentary_group: {
    id: string;
    name: string;
    acronym: string;
    color_hex: string;
    logo_url: string | null;
  } | null;
  metrics: MetricsRow | MetricsRow[] | null;
};

export async function getVersusLegislators({
  limit = 40,
  activeOnly = true,
}: {
  limit?: number;
  activeOnly?: boolean;
}): Promise<LegislatorVersusCard[]> {
  const supabase = await createClient();

  let query = supabase
    .from("legislator")
    .select(
      `
      id, chamber, condition, start_date, active,
      person:person_id!inner (id, fullname, name, lastname, image_url, profession),
      electoral_district:electoral_district_id (id, name),
      elected_by_party:elected_by_party_id (id, name, acronym, logo_url, color_hex, active, foundation_date),
      current_parliamentary_group,
      metrics:legislatormetrics (attendance_rate, total_sessions, total_bills, bills_aprobado, total_party_changes, is_defector, penal_records, ethical_records, total_legal_records)
    `,
    )
    .limit(limit);

  if (activeOnly) {
    query = query.eq("active", true);
  }

  query = query.order("lastname", {
    referencedTable: "person",
    ascending: true,
  });

  const { data, error } = await query;

  if (error) {
    console.error("Error:", error);
    throw new Error(`Error al obtener legisladores: ${error.message}`);
  }

  if (!data) return [];

  return (data as unknown as LegislatorFromDB[]).map((leg) => {
    const metrics = Array.isArray(leg.metrics) ? leg.metrics[0] : leg.metrics;

    return {
      id: leg.id,
      person_id: leg.person.id,
      fullname: leg.person.fullname,
      name: leg.person.name,
      lastname: leg.person.lastname,
      image_url: leg.person.image_url,
      profession: leg.person.profession,
      chamber: leg.chamber,
      condition: leg.condition,
      start_date: leg.start_date,
      days_in_office: calculateDaysInOffice(leg.start_date),
      current_parliamentary_group: leg.current_parliamentary_group,
      electoral_district: leg.electoral_district,
      elected_by_party: leg.elected_by_party,
      stats: buildStats(metrics),
    };
  });
}

function calculateDaysInOffice(startDate: string): number {
  return Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000);
}

function buildStats(metrics: MetricsRow | null): LegislatorVersusCard["stats"] {
  return {
    attendance_percentage: metrics?.attendance_rate ?? 0,
    total_sessions: metrics?.total_sessions ?? 0,
    total_bills: metrics?.total_bills ?? 0,
    bills_approved: metrics?.bills_aprobado ?? 0,
    total_party_changes: metrics?.total_party_changes ?? 0,
    is_defector: metrics?.is_defector ?? false,
    active_legal_cases:
      (metrics?.penal_records ?? 0) + (metrics?.ethical_records ?? 0),
    total_legal_records: metrics?.total_legal_records ?? 0,
  };
}
