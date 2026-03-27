"use server";

import { createClient } from "@/lib/supabase/server";
import {
  ElectedLegislatorBasic,
  PartyHistory,
  PartyLegalCase,
  GovernmentPlanSummary,
  OrganizationType,
} from "@/interfaces/politics";
import {
  FinancingCategory,
  FinancingReport,
  FinancingStatus,
  FlowType,
  PartyFinancingBasic,
} from "@/interfaces/party-financing";
import { Database } from "@/interfaces/supabase";
import {
  PoliticalPartyBase,
  PoliticalPartyDetail,
  PoliticalPartyListPaginated,
} from "@/interfaces/political-party";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export const getPartidosListSimple = unstable_cache(
  async ({ active }: { active: boolean }): Promise<PoliticalPartyBase[]> => {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from("politicalparty")
      .select("id, name, acronym, logo_url, color_hex, active, foundation_date")
      .eq("active", active)
      .order("name", { ascending: true });

    if (error) throw new Error(`Error al obtener partidos: ${error.message}`);
    return data as unknown as PoliticalPartyBase[];
  },
  ["partidos-list-simple"],
  { revalidate: 86400, tags: ["partidos-list"] },
);

interface GetPartidosParams {
  active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export const getPartidosList = unstable_cache(
  async (
    params: GetPartidosParams = {},
  ): Promise<PoliticalPartyListPaginated> => {
    const supabase = await createPublicClient();
    const { active, search, limit = 30, offset = 0 } = params;

    try {
      // 1. Lógica para ocultar partidos que son parte de una alianza activa
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

      // 2. Construcción de la Query
      let query = supabase
        .from("politicalparty")
        .select("*", { count: "exact" })
        .order("name", { ascending: true });

      // Filtro de Estado
      if (active !== undefined) {
        query = query.eq("active", active);
      }

      // Filtro para ocultar partidos (CORREGIDO: Formato ("id1","id2"))
      if (hiddenPartyIds.length > 0) {
        // Importante: Agregar comillas a cada ID para que PostgREST lo entienda
        const idsString = `("${hiddenPartyIds.join('","')}")`;
        query = query.filter("id", "not.in", idsString);
      }

      // Búsqueda por texto (Nombre o Acrónimo)
      if (search && search.trim() !== "") {
        const searchTerm = search.trim();
        query = query.or(
          `name.ilike.%${searchTerm}%,acronym.ilike.%${searchTerm}%`,
        );
      }

      // Paginación
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Error al obtener partidos: ${error.message}`);
      }

      return {
        items: data || [],
        total: count || 0,
        limit,
        offset,
      };
    } catch (error) {
      console.error("Error en getPartidosList:", error);
      throw error;
    }
  },
  ["partidos-list"],
  { revalidate: 86400, tags: ["partidos-list"] },
);

type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

// Interfaces internas para mapeo
interface LegislatorQueryResponse {
  id: string;
  person_id: string;
  condition: string;
  person: {
    fullname: string;
    image_url: string | null;
  };
  electoraldistrict: {
    name: string;
  } | null;
}

type FinancingReportRow = Tables<"financingreports">;
type FinancingTransactionRow = Tables<"partyfinancing">;
type SeatsViewRow = Views<"party_seats_by_district">;

interface FinancingReportQueryResponse extends FinancingReportRow {
  transactions: FinancingTransactionRow[];
}

// Interfaz auxiliar para el join de composición de alianza
interface AllianceMemberJoin {
  child_party: {
    id: string; // Ajusta según tu DB (int o uuid)
    name: string;
    logo_url: string | null;
    active: boolean;
  };
}

export async function getPartidoById(
  partidoId: string,
): Promise<PoliticalPartyDetail> {
  const supabase = await createClient();

  const [partidoRes, seatsRes, electosRes, financingRes] = await Promise.all([
    supabase
      .from("politicalparty")
      .select(
        `
        *,
        alliancecomposition!parent_org_id (
          child_party:child_org_id (*)
        ),
        parent_alliance_membership:alliancecomposition!child_org_id (
           alliance:parent_org_id (
              id,
              name,
              logo_url,
              government_plan_summary,
              government_plan_url,
              government_audio_url
           )
        )
      `,
      )
      .eq("id", partidoId)
      .maybeSingle(),

    supabase
      .from("party_seats_by_district")
      .select("district_name, district_code, seats")
      .eq("elected_by_party_id", partidoId)
      .then((res) => ({ ...res, data: res.data as SeatsViewRow[] })),

    supabase
      .from("legislator")
      .select(
        `
        id, person_id, condition,
        person!inner(fullname, image_url),
        electoraldistrict(name)
      `,
      )
      .eq("elected_by_party_id", partidoId)
      .eq("active", true)
      .eq("condition", "EN_EJERCICIO")
      .order("person(fullname)", { ascending: true }),

    supabase
      .from("financingreports")
      .select(
        `
        *,
        transactions:partyfinancing(*)
      `,
      )
      .eq("party_id", partidoId)
      .order("report_date", { ascending: false }),
  ]);

  if (!partidoRes.data) throw new Error("Partido no encontrado");

  const partido = partidoRes.data;

  const rawComposition = partido.alliancecomposition as unknown as
    | AllianceMemberJoin[]
    | null;

  const parentAllianceRaw = partido.parent_alliance_membership?.[0]?.alliance;
  const parentAlliance = parentAllianceRaw;

  return {
    ...partido,
    composition:
      rawComposition?.map((item) => ({
        party: item.child_party,
      })) || [],
    parent_alliance:
      (parentAlliance as unknown as PoliticalPartyDetail["parent_alliance"]) ||
      null,
    party_timeline: (partido.party_timeline as unknown as PartyHistory[]) || [],
    legal_cases: (partido.legal_cases as unknown as PartyLegalCase[]) || [],
    type: partido.type as OrganizationType,
    government_plan_summary:
      (partido.government_plan_summary as unknown as GovernmentPlanSummary[]) ||
      [],
    government_plan_url: partido.government_plan_url || null,
    government_audio_url: partido.government_audio_url || null,
    seats_by_district: seatsRes.data || [],
    elected_legislators: electosRes.data?.map(mapLegislator) || [],
    financing_reports: financingRes.data?.map(mapFinancingReport) || [],
  };
}

// MAPPER
const mapFinancingReport = (
  report: FinancingReportQueryResponse,
): FinancingReport => ({
  id: report.id,
  party_id: report.party_id,
  report_name: report.report_name,
  filing_status: report.filing_status as FinancingStatus,
  source_name: report.source_name,
  source_url: report.source_url,
  report_date: report.report_date,
  period_start: report.period_start,
  period_end: report.period_end,
  transactions: (report.transactions || []).map(mapTransaction),
  created_at: report.created_at,
});

const mapTransaction = (t: FinancingTransactionRow): PartyFinancingBasic => ({
  id: t.id,
  financing_report_id: t.financing_report_id,
  category: t.category as FinancingCategory,
  flow_type: t.flow_type as FlowType,
  amount: t.amount,
  currency: t.currency,
  notes: t.notes,
});

const mapLegislator = (
  leg: LegislatorQueryResponse,
): ElectedLegislatorBasic => ({
  id: leg.id,
  person_id: leg.person_id,
  full_name: leg.person?.fullname || "Desconocido",
  photo_url: leg.person?.image_url || null,
  district_name: leg.electoraldistrict?.name || null,
  condition: leg.condition,
});

interface GetPartidosParams {
  active?: boolean;
}

export async function getPartidosSelectorList(
  params: GetPartidosParams = {},
): Promise<PoliticalPartyBase> {
  const supabase = await createClient();
  const { active } = params;

  try {
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

    let query = supabase
      .from("politicalparty")
      .select(
        "id, name, acronym, logo_url, color_hex, active, foundation_date",
        { count: "exact" },
      )
      .order("name", { ascending: true });

    // Filtro original
    if (active !== undefined) {
      query = query.eq("active", active);
    }

    if (hiddenPartyIds.length > 0) {
      const idsString = `(${hiddenPartyIds.join(",")})`;
      query = query.filter("id", "not.in", idsString);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`Error al obtener partidos: ${error.message}`);
    }

    return data as unknown as PoliticalPartyBase;
  } catch (error) {
    console.error("Error en getPartidosList:", error);
    throw error;
  }
}
