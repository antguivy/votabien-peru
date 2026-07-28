"use server";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ExecutiveFormValues, GetExecutiveSchema } from "./validation";
import { PaginatedExecutivesResponse, RoleCounts, PeriodCounts } from "./types";
import { AdminExecutive } from "@/interfaces/executive";
import { ExecutiveRole } from "@/interfaces/politics";

export async function getExecutives(
  input: GetExecutiveSchema,
): Promise<PaginatedExecutivesResponse> {
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
    if (input.role && input.role.length > 0) {
      where.role = { in: input.role };
    }
    if (input.legislative_period && input.legislative_period.length > 0) {
      where.legislative_period_id = { in: input.legislative_period };
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
      prisma.executive.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          person: {
            select: {
              id: true,
              fullname: true,
              image_url: true,
              image_candidate_url: true,
              profession: true,
            },
          },
          legislativeperiod: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.executive.count({ where }),
    ]);

    const mappedData: AdminExecutive[] = data.map((row) => ({
      id: row.id,
      person_id: row.person_id,
      fullname: row.person?.fullname || "Sin nombre",
      role: row.role as ExecutiveRole,
      ministry: row.ministry,
      start_date: row.start_date.toISOString(),
      end_date: row.end_date?.toISOString() ?? null,
      end_reason: row.end_reason ?? null,
      active: row.active,
      created_at: row.created_at.toISOString(),
      person: row.person as AdminExecutive["person"],
      legislative_period: row.legislativeperiod,
    }));

    return {
      data: mappedData,
      total: count,
      page: page,
      page_size: pageSize,
    };
  } catch (error) {
    console.error("Error fetching executives:", error);
    throw new Error("Failed to fetch executives");
  }
}

export async function getRoleCounts(): Promise<RoleCounts> {
  noStore();
  try {
    const data = await prisma.executive.groupBy({
      by: ["role"],
      _count: { role: true },
    });

    return data.reduce<RoleCounts>((acc, curr) => {
      const key = curr.role;
      if (key) acc[key] = curr._count.role;
      return acc;
    }, {});
  } catch (error) {
    console.error("Error role counts:", error);
    return {};
  }
}

export async function getPeriodCounts(): Promise<PeriodCounts> {
  noStore();
  try {
    const executives = await prisma.executive.findMany({
      select: {
        legislative_period_id: true,
        legislativeperiod: {
          select: { id: true, name: true },
        },
      },
    });

    const counts: PeriodCounts = {};

    executives.forEach((item) => {
      const period = item.legislativeperiod;
      if (period && period.id) {
        if (!counts[period.id]) {
          counts[period.id] = { name: period.name, count: 0 };
        }
        counts[period.id].count += 1;
      }
    });

    return counts;
  } catch (error) {
    console.error("Error period counts:", error);
    return {};
  }
}

export async function getExecutiveForEdit(
  id: string,
): Promise<
  (ExecutiveFormValues & { person: AdminExecutive["person"] }) | null
> {
  noStore();

  const data = await prisma.executive.findUnique({
    where: { id },
    select: {
      id: true,
      person_id: true,
      role: true,
      ministry: true,
      start_date: true,
      end_date: true,
      end_reason: true,
      active: true,
      legislative_period_id: true,
      person: {
        select: {
          id: true,
          fullname: true,
          image_candidate_url: true,
          profession: true,
        },
      },
    },
  });

  if (!data) return null;

  return {
    id: data.id,
    person_id: data.person_id,
    role: data.role as ExecutiveRole,
    ministry: data.ministry,
    start_date: data.start_date.toISOString(),
    end_date: data.end_date?.toISOString() ?? null,
    end_reason: data.end_reason ?? null,
    legislative_period_id: data.legislative_period_id,
    person: data.person as AdminExecutive["person"],
  };
}
