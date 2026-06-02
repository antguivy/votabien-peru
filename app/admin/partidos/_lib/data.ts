"use server";

import { unstable_noStore as noStore } from "next/cache";
import type { GetPartySchema } from "./validation";
import { prisma } from "@/lib/prisma";
import { AdminPoliticalParty } from "@/interfaces/political-party";
import {
  ActivePartiesCounts,
  PaginatedPartiesResponse,
  PartyResponse,
} from "./types";

export async function getParties(
  input: GetPartySchema,
): Promise<PaginatedPartiesResponse> {
  noStore();

  try {
    const page = input.page || 1;
    const pageSize = input.perPage || 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Record<string, unknown> = {};
    if (input.name) {
      where.name = { contains: input.name, mode: "insensitive" };
    }
    if (input.active !== null) {
      where.active = input.active;
    }

    const orderBy: Record<string, unknown> = {};
    if (input.sort && input.sort.length > 0) {
      const sortItem = input.sort[0];
      orderBy[sortItem.id] = sortItem.desc ? "desc" : "asc";
    } else {
      orderBy.created_at = "desc";
    }

    const [data, count] = await Promise.all([
      prisma.politicalparty.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          financingreports: {
            select: {
              id: true,
              party_id: true,
              report_name: true,
              filing_status: true,
              source_name: true,
              source_url: true,
              report_date: true,
              period_start: true,
              period_end: true,
              created_at: true,
              updated_at: true,
              partyfinancing: {
                select: {
                  id: true,
                  financing_report_id: true,
                  category: true,
                  flow_type: true,
                  amount: true,
                  currency: true,
                  notes: true,
                },
              },
            },
          },
        },
      }),
      prisma.politicalparty.count({ where }),
    ]);

    // Map relations to match old Supabase shape
    const mappedData = data.map((party) => {
      const { financingreports, ...rest } = party as Record<string, unknown> & {
        financingreports: Array<
          Record<string, unknown> & { partyfinancing: unknown }
        >;
      };
      return {
        ...rest,

        financing_reports: financingreports.map((report) => {
          const { partyfinancing, ...reportRest } = report;
          return {
            ...reportRest,
            transactions: partyfinancing,
          };
        }),
      };
    }) as unknown as PartyResponse[];

    return {
      data: mappedData as unknown as AdminPoliticalParty[],
      total: count,
      page: page,
      page_size: pageSize,
    };
  } catch (error) {
    console.error("Error fetching parties:", error);
    throw new Error("Failed to fetch parties");
  }
}

export async function getActivePartiesCounts(): Promise<ActivePartiesCounts> {
  try {
    const data = await prisma.politicalparty.groupBy({
      by: ["active"],
      _count: {
        active: true,
      },
    });

    return data.reduce<ActivePartiesCounts>((acc, curr) => {
      const key = String(curr.active);
      acc[key] = curr._count.active;
      return acc;
    }, {});
  } catch (error) {
    console.error("Error active party counts:", error);
    return {};
  }
}
