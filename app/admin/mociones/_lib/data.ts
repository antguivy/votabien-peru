import prisma from "@/lib/prisma";
import { type GetMotionsSchema } from "./validation";
import { Prisma } from "@/prisma/generated/client";
import { unstable_cache } from "next/cache";
import { AdminMotionRow, MotionStats } from "./types";
import type { chambertype } from "@/prisma/generated/client";

export async function getMotions(input: GetMotionsSchema) {
  const {
    page,
    perPage,
    sort,
    search,
    period,
    chamber,
    motion_type,
    is_greeting,
    parliamentary_group,
  } = input;
  const skip = (page - 1) * perPage;
  const take = perPage;

  const where: Prisma.motionWhereInput = {};
  const andConditions: Prisma.motionWhereInput[] = [];

  if (period && period.length > 0) {
    where.period = { in: period };
  }

  if (chamber && chamber.length > 0) {
    where.chamber = { in: chamber as chambertype[] };
  }

  if (motion_type && motion_type.length > 0) {
    where.motion_type = { in: motion_type };
  }

  if (is_greeting === "true") {
    where.is_greeting = true;
  } else if (is_greeting === "false") {
    where.is_greeting = false;
  }

  if (parliamentary_group && parliamentary_group.length > 0) {
    where.parliamentary_group_id = { in: parliamentary_group };
  }

  if (search && search.trim() !== "") {
    const term = search.trim();
    andConditions.push({
      OR: [
        { number: { contains: term, mode: "insensitive" } },
        { summary: { contains: term, mode: "insensitive" } },
        { purpose: { contains: term, mode: "insensitive" } },
        { motion_type: { contains: term, mode: "insensitive" } },
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
    (desc: boolean) => Prisma.motionOrderByWithRelationInput
  > = {
    submission_date: (desc) => ({ submission_date: desc ? "desc" : "asc" }),
    number: (desc) => ({ number: desc ? "desc" : "asc" }),
    chamber: (desc) => ({ chamber: desc ? "desc" : "asc" }),
    motion_type: (desc) => ({ motion_type: desc ? "desc" : "asc" }),
    is_greeting: (desc) => ({ is_greeting: desc ? "desc" : "asc" }),
  };

  let orderBy: Prisma.motionOrderByWithRelationInput = {
    submission_date: "desc",
  };
  if (sort && sort.length > 0) {
    const primary = sort[0];
    const mapper = sortMap[primary.id];
    if (mapper) {
      orderBy = mapper(primary.desc);
    }
  }

  const [data, total] = await Promise.all([
    prisma.motion.findMany({
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
        parliamentarygroup: {
          select: {
            id: true,
            name: true,
            acronym: true,
            color_hex: true,
          },
        },
      },
    }),
    prisma.motion.count({ where }),
  ]);

  const pageCount = Math.ceil(total / perPage);

  return {
    data: data as unknown as AdminMotionRow[],
    total,
    pageCount,
  };
}

export async function getMotionStats(
  periodFilter?: string[],
): Promise<MotionStats> {
  const where: Prisma.motionWhereInput = {};
  if (periodFilter && periodFilter.length > 0) {
    where.period = { in: periodFilter };
  }

  const [total, diputados, senado, greetings, interpellations] =
    await Promise.all([
      prisma.motion.count({ where }),
      prisma.motion.count({ where: { ...where, chamber: "DIPUTADOS" } }),
      prisma.motion.count({ where: { ...where, chamber: "SENADO" } }),
      prisma.motion.count({ where: { ...where, is_greeting: true } }),
      prisma.motion.count({
        where: {
          ...where,
          motion_type: { contains: "interpela", mode: "insensitive" },
        },
      }),
    ]);

  return {
    total,
    diputados,
    senado,
    greetings,
    interpellations,
  };
}

export const getMotionFilterOptions = unstable_cache(
  async () => {
    const [periodsRaw, parliamentaryGroups] = await Promise.all([
      prisma.motion.findMany({
        distinct: ["period"],
        select: { period: true },
        where: { period: { not: null } },
      }),
      prisma.parliamentarygroup.findMany({
        where: { active: true },
        select: { id: true, name: true, acronym: true },
        orderBy: { name: "asc" },
      }),
    ]);

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
      parliamentaryGroups,
    };
  },
  ["motion_admin_filter_options"],
  { revalidate: 60, tags: ["motions"] },
);
