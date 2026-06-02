"use server";

import { unstable_noStore as noStore } from "next/cache";
import type { GetLegislatorSchema } from "./validation";
import type {
  PaginatedLegislatorsResponse,
  ChamberCounts,
  DistrictCounts,
  ConditionCounts,
} from "./types";
import { prisma } from "@/lib/prisma";
import { AdminLegislator } from "@/interfaces/legislator";
import {
  ChamberType,
  GroupChangeReason,
  LegislatorCondition,
} from "@/interfaces/politics";

export async function getLegislators(
  input: GetLegislatorSchema,
): Promise<PaginatedLegislatorsResponse> {
  noStore();

  try {
    const page = input.page || 1;
    const pageSize = input.perPage || 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Record<string, unknown> = {};

    if (input.fullname) {
      where.person = {
        fullname: { contains: input.fullname, mode: "insensitive" },
      };
    }
    if (input.chamber && input.chamber.length > 0) {
      where.chamber = { in: input.chamber };
    }
    if (input.condition && input.condition.length > 0) {
      where.condition = { in: input.condition };
    }
    if (input.electoral_district && input.electoral_district.length > 0) {
      where.electoraldistrict = {
        name: { in: input.electoral_district },
      };
    }

    const orderBy: Record<string, unknown> = {};
    if (input.sort && input.sort.length > 0) {
      const sortItem = input.sort[0];
      if (sortItem.id === "fullname") {
        orderBy.person = { fullname: sortItem.desc ? "desc" : "asc" };
      } else {
        orderBy[sortItem.id] = sortItem.desc ? "desc" : "asc";
      }
    } else {
      orderBy.start_date = "desc";
    }

    const [data, count] = await Promise.all([
      prisma.legislator.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          person: { select: { id: true, fullname: true } },
          politicalparty: {
            select: { id: true, name: true, acronym: true, color_hex: true },
          },
          electoraldistrict: { select: { id: true, name: true, code: true } },
          parliamentarymembership: {
            include: {
              parliamentarygroup: true,
            },
          },
        },
      }),
      prisma.legislator.count({ where }),
    ]);

    const mappedData = data.map((row) => {
      // Find current parliamentary group

      const currentMembership = row.parliamentarymembership.find(
        (pm) => pm.end_date === null || pm.end_date >= new Date(),
      );
      const current_parliamentary_group =
        currentMembership?.parliamentarygroup || null;

      return {
        id: row.id,
        person_id: row.person_id,
        fullname: row.person?.fullname || "Sin nombre",
        elected_by_party_id: row.elected_by_party_id,
        electoral_district_id: row.electoral_district_id,
        chamber: row.chamber as ChamberType,
        condition: row.condition as LegislatorCondition,
        start_date: row.start_date,
        end_date: row.end_date,
        active: row.active,
        institutional_email: row.institutional_email,
        created_at: row.created_at,

        person: row.person,
        current_parliamentary_group: current_parliamentary_group,
        elected_by_party: row.politicalparty,
        electoral_district: row.electoraldistrict,

        parliamentary_memberships: (row.parliamentarymembership || []).map(
          (pm) => ({
            ...pm,
            change_reason: pm.change_reason as GroupChangeReason,
            parliamentary_group: pm.parliamentarygroup || undefined,
          }),
        ),
      };
    });

    return {
      data: mappedData as unknown as AdminLegislator[],
      total: count,
      page: page,
      page_size: pageSize,
    };
  } catch (error) {
    console.error("Error fetching legislators:", error);
    throw new Error("Failed to fetch legislators");
  }
}

export async function getChamberTypeCounts(): Promise<ChamberCounts> {
  try {
    const data = await prisma.legislator.groupBy({
      by: ["chamber"],
      _count: { chamber: true },
    });

    return data.reduce<ChamberCounts>((acc, curr) => {
      const key = curr.chamber;
      if (key) acc[key] = curr._count.chamber;
      return acc;
    }, {});
  } catch (error) {
    console.error("Error chamber type counts:", error);
    return {};
  }
}

export async function getLegislatorConditionCounts(): Promise<ConditionCounts> {
  try {
    const data = await prisma.legislator.groupBy({
      by: ["condition"],
      _count: { condition: true },
    });

    return data.reduce<ConditionCounts>((acc, curr) => {
      const key = curr.condition;
      if (key) acc[key] = curr._count.condition;
      return acc;
    }, {});
  } catch (error) {
    console.error("Error condition counts:", error);
    return {};
  }
}

export async function getDistrictsCounts(): Promise<DistrictCounts> {
  noStore();
  try {
    const data = await prisma.legislator.findMany({
      select: {
        electoral_district_id: true,
        electoraldistrict: {
          select: { id: true, name: true },
        },
      },
    });

    const counts: DistrictCounts = {};

    data.forEach((item) => {
      const dist = item.electoraldistrict;
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
