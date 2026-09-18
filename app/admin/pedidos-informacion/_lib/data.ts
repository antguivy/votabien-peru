import prisma from "@/lib/prisma";
import { type GetInformationRequestsSchema } from "./validation";
import { Prisma } from "@/prisma/generated/client";
import { unstable_cache } from "next/cache";
import { AdminInformationRequestRow, InformationRequestStats } from "./types";
import type { chambertype } from "@/prisma/generated/client";

export async function getInformationRequests(
  input: GetInformationRequestsSchema,
) {
  const { page, perPage, sort, search, period, chamber, target_entity } = input;
  const skip = (page - 1) * perPage;
  const take = perPage;

  const where: Prisma.information_requestWhereInput = {};
  const andConditions: Prisma.information_requestWhereInput[] = [];

  if (period && period.length > 0) {
    where.period = { in: period };
  }

  if (chamber && chamber.length > 0) {
    where.chamber = { in: chamber as chambertype[] };
  }

  if (target_entity && target_entity.trim() !== "") {
    where.target_entity = {
      contains: target_entity.trim(),
      mode: "insensitive",
    };
  }

  if (search && search.trim() !== "") {
    const term = search.trim();
    andConditions.push({
      OR: [
        { number: { contains: term, mode: "insensitive" } },
        { summary: { contains: term, mode: "insensitive" } },
        { target_entity: { contains: term, mode: "insensitive" } },
        { target_person: { contains: term, mode: "insensitive" } },
        { document_code: { contains: term, mode: "insensitive" } },
        {
          legislator: {
            person: {
              fullname: { contains: term, mode: "insensitive" },
            },
          },
        },
      ],
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const sortMap: Record<
    string,
    (desc: boolean) => Prisma.information_requestOrderByWithRelationInput
  > = {
    document_date: (desc) => ({ document_date: desc ? "desc" : "asc" }),
    number: (desc) => ({ number: desc ? "desc" : "asc" }),
    chamber: (desc) => ({ chamber: desc ? "desc" : "asc" }),
    target_entity: (desc) => ({ target_entity: desc ? "desc" : "asc" }),
    reception_date: (desc) => ({ reception_date: desc ? "desc" : "asc" }),
    due_date: (desc) => ({ due_date: desc ? "desc" : "asc" }),
  };

  let orderBy: Prisma.information_requestOrderByWithRelationInput = {
    document_date: "desc",
  };
  if (sort && sort.length > 0) {
    const primary = sort[0];
    const mapper = sortMap[primary.id];
    if (mapper) {
      orderBy = mapper(primary.desc);
    }
  }

  const [data, total] = await Promise.all([
    prisma.information_request.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        legislator: {
          select: {
            id: true,
            person: {
              select: {
                id: true,
                fullname: true,
                image_url: true,
              },
            },
          },
        },
      },
    }),
    prisma.information_request.count({ where }),
  ]);

  const pageCount = Math.ceil(total / perPage);

  return {
    data: data as unknown as AdminInformationRequestRow[],
    total,
    pageCount,
  };
}

export async function getInformationRequestStats(
  periodFilter?: string[],
): Promise<InformationRequestStats> {
  const where: Prisma.information_requestWhereInput = {};
  if (periodFilter && periodFilter.length > 0) {
    where.period = { in: periodFilter };
  }

  const [total, diputados, senado, with_pdf] = await Promise.all([
    prisma.information_request.count({ where }),
    prisma.information_request.count({
      where: { ...where, chamber: "DIPUTADOS" },
    }),
    prisma.information_request.count({
      where: { ...where, chamber: "SENADO" },
    }),
    prisma.information_request.count({
      where: { ...where, document_url: { not: null } },
    }),
  ]);

  return {
    total,
    diputados,
    senado,
    with_pdf,
  };
}

export const getInformationRequestFilterOptions = unstable_cache(
  async () => {
    const periodsRaw = await prisma.information_request.findMany({
      distinct: ["period"],
      select: { period: true },
      where: { period: { not: null } },
    });

    const periods = Array.from(
      new Set(
        [
          "2026-2031",
          ...periodsRaw
            .map((p) => p.period)
            .filter((p): p is string => Boolean(p)),
        ]
          .sort()
          .reverse(),
      ),
    );

    return {
      periods,
    };
  },
  ["information_request_admin_filter_options"],
  { revalidate: 60, tags: ["information_requests"] },
);
