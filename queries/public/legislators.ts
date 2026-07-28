import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";

import {
  LegislatorCard,
  LegislatorDetailWithPerson,
} from "@/interfaces/legislator";
import { LegislatorVersusCard } from "@/interfaces/legislator-metrics";
import { ChamberType } from "@/interfaces/politics";
import { RnasSanction } from "@/interfaces/person";
import prisma from "@/lib/prisma";
import { Prisma, legislatormetrics } from "@/prisma/generated/client";

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
  legislative_period_id?: string;
}

export const getLegisladoresCards = cache(
  unstable_cache(
    async ({
      active_only = true,
      chamber,
      groups,
      districts,
      search,
      ids,
      page = 1,
      pageSize = 30,
      legislative_period_id,
    }: GetLegislatorsParams): Promise<LegislatorCard[]> => {
      const skip = (page - 1) * pageSize;
      const take = pageSize;

      try {
        const whereClause: Prisma.legislatorWhereInput = {};

        if (active_only) whereClause.active = true;
        if (legislative_period_id)
          whereClause.legislative_period_id = legislative_period_id;
        if (chamber) whereClause.chamber = chamber;
        if (ids && ids.length > 0) whereClause.id = { in: ids };

        if (search) {
          whereClause.person = {
            fullname: { contains: search, mode: "insensitive" },
          };
        }

        if (districts && districts.length > 0) {
          whereClause.electoraldistrict = {
            name: { in: districts },
          };
        }

        if (groups && groups.length > 0) {
          whereClause.parliamentarymembership = {
            some: {
              end_date: null,
              parliamentarygroup: {
                name: { in: groups },
              },
            },
          };
        }

        const data = await prisma.legislator.findMany({
          where: whereClause,
          skip,
          take,
          include: {
            person: {
              select: {
                id: true,
                fullname: true,
                dni: true,
                image_url: true,
                image_candidate_url: true,
                profession: true,
                has_sanction: true,
                has_penal_sentence: true,
                is_incumbent: true,
                rnas_sanctions: true,
              },
            },
            electoraldistrict: {
              select: {
                id: true,
                name: true,
                code: true,
                is_national: true,
                active: true,
              },
            },
            politicalparty: {
              select: {
                id: true,
                name: true,
                acronym: true,
                logo_url: true,
                color_hex: true,
                active: true,
                foundation_date: true,
              },
            },
            parliamentarymembership: {
              where: { end_date: null },
              include: { parliamentarygroup: true },
              take: 1,
            },
          },
          orderBy: {
            person: { lastname: "asc" },
          },
        });

        if (!data || data.length === 0) return [];

        const legislatorIds = data.map((l) => l.id);
        const metricsData = await prisma.legislatormetrics.findMany({
          where: { legislator_id: { in: legislatorIds } },
          select: { legislator_id: true },
        });

        const metricsSet = new Set(metricsData?.map((m) => m.legislator_id));

        const results: LegislatorCard[] = data.map((leg) => {
          let current_parliamentary_group = null;
          if (
            leg.parliamentarymembership &&
            leg.parliamentarymembership.length > 0
          ) {
            const group = leg.parliamentarymembership[0].parliamentarygroup;
            current_parliamentary_group = {
              id: group.id,
              name: group.name,
              acronym: group.acronym || "",
              logo_url: group.logo_url,
              color_hex: group.color_hex || "",
              government_audio_url: group.government_audio_url,
            };
          }

          return {
            id: leg.id,
            chamber: leg.chamber as unknown as ChamberType,
            condition: leg.condition as LegislatorCard["condition"],
            active: leg.active,
            start_date: leg.start_date as unknown as string,
            end_date: leg.end_date as unknown as string,
            person: {
              id: leg.person.id,
              fullname: leg.person.fullname,
              dni: leg.person.dni,
              image_url: leg.person.image_url,
              image_candidate_url: leg.person.image_candidate_url,
              profession: leg.person.profession,
              has_sanction: leg.person.has_sanction,
              has_penal_sentence: leg.person.has_penal_sentence,
              is_incumbent: leg.person.is_incumbent,
              rnas_sanctions:
                (leg.person.rnas_sanctions as unknown as RnasSanction[]) ??
                null,
            },
            elected_by_party: {
              id: leg.politicalparty.id,
              name: leg.politicalparty.name,
              acronym: leg.politicalparty.acronym,
              logo_url: leg.politicalparty.logo_url ?? null,
              color_hex: leg.politicalparty.color_hex,
              active: leg.politicalparty.active,
              foundation_date:
                (leg.politicalparty.foundation_date as unknown as string) ??
                null,
            },
            electoral_district: {
              id: leg.electoraldistrict.id,
              name: leg.electoraldistrict.name,
              code: leg.electoraldistrict.code,
              is_national: leg.electoraldistrict.is_national,
              active: leg.electoraldistrict.active,
            },
            current_parliamentary_group,
            has_metrics: metricsSet.has(leg.id),
          };
        });

        return results;
      } catch (error) {
        console.error("Error fetching legislators:", error);
        throw new Error("Error al obtener legisladores");
      }
    },
    ["legislators-cards-list"],
    { tags: [TAGS.legislators] },
  ),
);

export const getLegisladorById = cache(
  unstable_cache(
    async (
      legisladorId: string,
    ): Promise<LegislatorDetailWithPerson | null> => {
      try {
        const data = await prisma.legislator.findUnique({
          where: { id: legisladorId },
          include: {
            politicalparty: true,
            electoraldistrict: true,
            bill: {
              orderBy: { submission_date: "desc" },
            },
            attendance: true,
            parliamentarymembership: {
              orderBy: { start_date: "desc" },
              include: { parliamentarygroup: true },
            },
            person: {
              include: { background: true },
            },
          },
        });

        if (!data) return null;

        // remap to match expected type interface
        const mappedData = {
          ...data,
          elected_by_party: data.politicalparty,
          electoral_district: data.electoraldistrict,
          bill_authorships: data.bill,
          attendances: data.attendance,
          parliamentary_memberships: data.parliamentarymembership.map((m) => ({
            ...m,
            parliamentary_group: m.parliamentarygroup,
          })),
          person: {
            ...data.person,
            backgrounds: data.person.background,
          },
        };

        return mappedData as unknown as LegislatorDetailWithPerson;
      } catch (error) {
        console.error("Error fetching legislador:", error);
        return null;
      }
    },
    ["legislator-detail"],
    { tags: [TAGS.legislators] },
  ),
);

export const getVersusLegislators = cache(
  unstable_cache(
    async ({
      limit = 40,
      activeOnly = true,
    }: {
      limit?: number;
      activeOnly?: boolean;
    }): Promise<LegislatorVersusCard[]> => {
      try {
        const whereClause: Prisma.legislatorWhereInput = {};
        if (activeOnly) {
          whereClause.active = true;
        }

        const data = await prisma.legislator.findMany({
          where: whereClause,
          take: limit,
          orderBy: { person: { lastname: "asc" } },
          include: {
            person: {
              select: {
                id: true,
                fullname: true,
                name: true,
                lastname: true,
                image_url: true,
                profession: true,
              },
            },
            electoraldistrict: { select: { id: true, name: true } },
            politicalparty: {
              select: {
                id: true,
                name: true,
                acronym: true,
                logo_url: true,
                color_hex: true,
                active: true,
                foundation_date: true,
              },
            },
            legislatormetrics: true,
            parliamentarymembership: {
              where: { end_date: null },
              include: { parliamentarygroup: true },
              take: 1,
            },
          },
        });

        if (!data) return [];

        return data.map((leg) => {
          const metrics = leg.legislatormetrics;

          let current_parliamentary_group = null;
          if (
            leg.parliamentarymembership &&
            leg.parliamentarymembership.length > 0
          ) {
            const group = leg.parliamentarymembership[0].parliamentarygroup;
            current_parliamentary_group = {
              id: group.id,
              name: group.name,
              acronym: group.acronym || "",
              color_hex: group.color_hex || "",
              logo_url: group.logo_url,
              government_audio_url: group.government_audio_url,
            };
          }

          return {
            id: leg.id,
            person_id: leg.person.id,
            fullname: leg.person.fullname,
            name: leg.person.name,
            lastname: leg.person.lastname,
            image_url: leg.person.image_url,
            profession: leg.person.profession,
            chamber: leg.chamber as unknown as ChamberType,
            condition: leg.condition as LegislatorCard["condition"],
            start_date: leg.start_date as unknown as string,
            days_in_office: calculateDaysInOffice(leg.start_date),
            current_parliamentary_group,
            electoral_district: leg.electoraldistrict,
            elected_by_party: {
              ...leg.politicalparty,
              foundation_date: leg.politicalparty
                ?.foundation_date as unknown as string,
            } as unknown as LegislatorVersusCard["elected_by_party"],
            stats: buildStats(metrics),
          };
        });
      } catch (error) {
        console.error("Error:", error);
        throw new Error(`Error al obtener legisladores`);
      }
    },
    ["versus-legislators-list"],
    { tags: [TAGS.legislators] },
  ),
);

function calculateDaysInOffice(startDate: string | Date): number {
  return Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000);
}

function buildStats(
  metrics: legislatormetrics | null,
): LegislatorVersusCard["stats"] {
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
