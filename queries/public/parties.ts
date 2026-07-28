import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";
import { Prisma, partyfinancing } from "@/prisma/generated/client";

import prisma from "@/lib/prisma";

import {
  PoliticalPartyBase,
  PoliticalPartyDetail,
  PoliticalPartyListPaginated,
} from "@/interfaces/political-party";
import {
  ElectedLegislatorBasic,
  GovernmentPlanSummary,
  OrganizationType,
  PartyHistory,
  PartyLegalCase,
} from "@/interfaces/politics";
import {
  FinancingCategory,
  FinancingReport,
  FinancingStatus,
  FlowType,
  PartyFinancingBasic,
} from "@/interfaces/party-financing";

export const getPartidosListSimple = cache(
  unstable_cache(
    async ({ active }: { active: boolean }): Promise<PoliticalPartyBase[]> => {
      try {
        const data = await prisma.politicalparty.findMany({
          where: { active },
          select: {
            id: true,
            name: true,
            acronym: true,
            logo_url: true,
            color_hex: true,
            active: true,
            foundation_date: true,
          },
          orderBy: { name: "asc" },
        });
        return data as unknown as PoliticalPartyBase[];
      } catch (error) {
        throw new Error(
          `Error al obtener partidos: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
    ["partidos-list-simple"],
    { tags: [TAGS.parties] },
  ),
);

interface GetPartidosListParams {
  active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export const getPartidosList = cache(
  unstable_cache(
    async (
      params: GetPartidosListParams = {},
    ): Promise<PoliticalPartyListPaginated> => {
      const { active, search, limit = 30, offset = 0 } = params;

      try {
        const activeProcess = await prisma.electoralprocess.findFirst({
          where: { active: true },
          select: { id: true },
        });

        let hiddenPartyIds: string[] = [];

        if (activeProcess) {
          const allianceMembers = await prisma.alliancecomposition.findMany({
            where: { process_id: activeProcess.id },
            select: { child_org_id: true },
          });

          if (allianceMembers && allianceMembers.length > 0) {
            hiddenPartyIds = allianceMembers
              .map((m) => m.child_org_id)
              .filter((id): id is string => id !== null);
          }
        }

        const whereClause: Prisma.politicalpartyWhereInput = {};

        if (active !== undefined) {
          whereClause.active = active;
        }

        if (hiddenPartyIds.length > 0) {
          whereClause.id = { notIn: hiddenPartyIds };
        }

        if (search && search.trim() !== "") {
          const searchTerm = search.trim();
          whereClause.OR = [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { acronym: { contains: searchTerm, mode: "insensitive" } },
          ];
        }

        const [data, count] = await Promise.all([
          prisma.politicalparty.findMany({
            where: whereClause,
            orderBy: { name: "asc" },
            skip: offset,
            take: limit,
          }),
          prisma.politicalparty.count({
            where: whereClause,
          }),
        ]);

        return {
          items: data as unknown as PoliticalPartyDetail[],
          total: count,
          limit,
          offset,
        };
      } catch (error) {
        console.error("Error en getPartidosList:", error);
        throw error;
      }
    },
    ["partidos-list-paginated"],
    { tags: [TAGS.parties] },
  ),
);

type SeatsViewRow = {
  district_name: string;
  district_code: string;
  seats: number;
  elected_by_party_id: string | null;
};

interface FinancingReportQueryResponse {
  id: string;
  party_id: string;
  report_name: string;
  filing_status: string;
  source_name: string;
  source_url: string | null;
  report_date: Date;
  period_start: Date;
  period_end: Date;
  created_at: Date;
  partyfinancing: partyfinancing[];
}

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
  report_date: report.report_date as unknown as string,
  period_start: report.period_start as unknown as string,
  period_end: report.period_end as unknown as string,
  transactions: (report.partyfinancing || []).map(mapTransaction),
  created_at: report.created_at as unknown as string,
});

const mapTransaction = (t: partyfinancing): PartyFinancingBasic => ({
  id: t.id,
  financing_report_id: t.financing_report_id,
  category: t.category as FinancingCategory,
  flow_type: t.flow_type as FlowType,
  amount: Number(t.amount),
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

interface AllianceMemberJoin {
  child_party: {
    id: string;
    name: string;
    logo_url: string | null;
    active: boolean;
  };
}

export const getPartidoById = cache(
  unstable_cache(
    async (partidoId: string): Promise<PoliticalPartyDetail> => {
      try {
        const [partidoRes, seatsRes, electosRes, financingRes] =
          await Promise.all([
            prisma.politicalparty.findUnique({
              where: { id: partidoId },
              include: {
                childAlliances: {
                  include: {
                    parentParty: true,
                  },
                },
                parentAlliances: {
                  include: {
                    childParty: {
                      select: {
                        id: true,
                        name: true,
                        logo_url: true,
                        government_plan_summary: true,
                        government_plan_url: true,
                        government_audio_url: true,
                      },
                    },
                  },
                },
              },
            }),

            prisma.$queryRaw<SeatsViewRow[]>`
              SELECT district_name, district_code, seats
              FROM party_seats_by_district
              WHERE elected_by_party_id = ${partidoId}
            `,

            prisma.legislator.findMany({
              where: {
                elected_by_party_id: partidoId,
                active: true,
                condition: "EN_EJERCICIO",
              },
              select: {
                id: true,
                person_id: true,
                condition: true,
                person: {
                  select: { fullname: true, image_url: true },
                },
                electoraldistrict: {
                  select: { name: true },
                },
              },
              orderBy: {
                person: { fullname: "asc" },
              },
            }),

            prisma.financingreports.findMany({
              where: { party_id: partidoId },
              include: {
                partyfinancing: true,
              },
              orderBy: { report_date: "desc" },
            }),
          ]);

        if (!partidoRes) throw new Error("Partido no encontrado");

        const partido = partidoRes;

        const rawComposition = partido.childAlliances as unknown as
          | AllianceMemberJoin[]
          | null;

        const parentAllianceRaw = partido.parentAlliances?.[0]?.childParty;
        const parentAlliance = parentAllianceRaw;

        const {
          created_at: _created_at,
          updated_at: _updated_at,
          ...partidoWithoutTimestamps
        } = partido;

        return {
          ...partidoWithoutTimestamps,
          foundation_date: partido.foundation_date as unknown as string,
          composition:
            rawComposition?.map((item) => ({
              party: item.child_party,
            })) || [],
          parent_alliance:
            (parentAlliance as unknown as PoliticalPartyDetail["parent_alliance"]) ||
            null,
          party_timeline:
            (partido.party_timeline as unknown as PartyHistory[]) || [],
          legal_cases:
            (partido.legal_cases as unknown as PartyLegalCase[]) || [],
          type: partido.type as OrganizationType,
          government_plan_summary:
            (partido.government_plan_summary as unknown as GovernmentPlanSummary[]) ||
            [],
          government_plan_url: partido.government_plan_url || null,
          government_audio_url: partido.government_audio_url || null,
          seats_by_district: seatsRes
            ? seatsRes.map((seat) => ({
                ...seat,
                seats:
                  typeof seat.seats === "bigint"
                    ? Number(seat.seats)
                    : seat.seats,
              }))
            : [],
          elected_legislators: electosRes.map(mapLegislator) || [],
          financing_reports: financingRes.map(mapFinancingReport) || [],
        };
      } catch (error) {
        console.error("Error fetching party:", error);
        throw error;
      }
    },
    ["partido-detail"],
    { tags: [TAGS.parties] },
  ),
);
