import prisma from "@/lib/prisma";
import { type GetBillsSchema } from "./validation";
import { Prisma } from "@/prisma/generated/client";
import { unstable_cache } from "next/cache";

export async function getBills(input: GetBillsSchema) {
  const { page, perPage, sort, search, period, status, parliamentary_group } =
    input;
  const skip = (page - 1) * perPage;
  const take = perPage;

  const where: Prisma.billWhereInput = {};
  const andConditions: Prisma.billWhereInput[] = [];

  if (period && period.length > 0) {
    where.period = { in: period };
  }

  if (status && status.length > 0) {
    where.approval_status = { in: status };
  }

  if (parliamentary_group && parliamentary_group.length > 0) {
    where.parliamentary_group_id = { in: parliamentary_group };
  }

  if (search && search.trim() !== "") {
    const term = search.trim();
    andConditions.push({
      OR: [
        { number: { contains: term, mode: "insensitive" } },
        { title: { contains: term, mode: "insensitive" } },
        { title_ai: { contains: term, mode: "insensitive" } },
        { sponsor: { contains: term, mode: "insensitive" } },
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

  if (input.chamber && input.chamber.length > 0) {
    const chamberOr: Prisma.billWhereInput[] = [];
    if (input.chamber.includes("DIPUTADOS")) {
      chamberOr.push(
        { number: { endsWith: "-CD", mode: "insensitive" } },
        { legislator: { chamber: "DIPUTADOS" } },
      );
    }
    if (input.chamber.includes("SENADO")) {
      chamberOr.push(
        { number: { endsWith: "-S", mode: "insensitive" } },
        { legislator: { chamber: "SENADO" } },
      );
    }
    if (input.chamber.includes("CONGRESO")) {
      chamberOr.push(
        { number: { endsWith: "-CR", mode: "insensitive" } },
        { number: { contains: "/202" } },
        { legislator: { chamber: "CONGRESO" } },
      );
    }
    if (chamberOr.length > 0) {
      andConditions.push({ OR: chamberOr });
    }
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // Mapeo seguro de columnas de ordenamiento para evitar excepciones de Prisma
  const sortMap: Record<
    string,
    (desc: boolean) => Prisma.billOrderByWithRelationInput
  > = {
    search: (desc) => ({ title: desc ? "desc" : "asc" }),
    title: (desc) => ({ title: desc ? "desc" : "asc" }),
    status: (desc) => ({ approval_status: desc ? "desc" : "asc" }),
    approval_status: (desc) => ({ approval_status: desc ? "desc" : "asc" }),
    number: (desc) => ({ number: desc ? "desc" : "asc" }),
    period: (desc) => ({ period: desc ? "desc" : "asc" }),
    submission_date: (desc) => ({ submission_date: desc ? "desc" : "asc" }),
    legislator: (desc) => ({
      legislator: {
        person: {
          fullname: desc ? "desc" : "asc",
        },
      },
    }),
    parliamentary_group: (desc) => ({
      parliamentarygroup: {
        name: desc ? "desc" : "asc",
      },
    }),
    parliamentary_group_id: (desc) => ({
      parliamentarygroup: {
        name: desc ? "desc" : "asc",
      },
    }),
  };

  const orderBy: Prisma.billOrderByWithRelationInput[] = [];
  for (const s of sort) {
    const mapper = sortMap[s.id];
    if (mapper) {
      orderBy.push(mapper(Boolean(s.desc)));
    }
  }

  if (orderBy.length === 0) {
    orderBy.push({ submission_date: "desc" });
  }

  const [data, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        legislator: {
          include: {
            person: {
              select: {
                id: true,
                name: true,
                lastname: true,
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
            logo_url: true,
          },
        },
      },
    }),
    prisma.bill.count({ where }),
  ]);

  const pageCount = Math.ceil(total / perPage);

  return {
    data,
    total,
    pageCount,
  };
}

export async function getBillStats(period?: string | string[]) {
  const where: Prisma.billWhereInput = {};

  if (Array.isArray(period) && period.length > 0) {
    where.period = { in: period };
  } else if (typeof period === "string" && period.trim() !== "") {
    where.period = period;
  }

  const [
    total,
    aprobados,
    enComision,
    dictamen,
    conTituloIa,
    diputados,
    senado,
    congreso,
  ] = await Promise.all([
    prisma.bill.count({ where }),
    prisma.bill.count({
      where: {
        ...where,
        approval_status: {
          in: [
            "APROBADO",
            "PUBLICADO",
            "AUTOGRAFA",
            "APROBADO_PRIMERA_VOTACION",
          ],
        },
      },
    }),
    prisma.bill.count({
      where: {
        ...where,
        approval_status: "EN_COMISION",
      },
    }),
    prisma.bill.count({
      where: {
        ...where,
        approval_status: "DICTAMEN",
      },
    }),
    prisma.bill.count({
      where: {
        ...where,
        title_ai: { not: null },
      },
    }),
    prisma.bill.count({
      where: {
        ...where,
        OR: [
          { number: { endsWith: "-CD", mode: "insensitive" } },
          { legislator: { chamber: "DIPUTADOS" } },
        ],
      },
    }),
    prisma.bill.count({
      where: {
        ...where,
        OR: [
          { number: { endsWith: "-S", mode: "insensitive" } },
          { legislator: { chamber: "SENADO" } },
        ],
      },
    }),
    prisma.bill.count({
      where: {
        ...where,
        OR: [
          { number: { endsWith: "-CR", mode: "insensitive" } },
          { number: { contains: "/202" } },
          { legislator: { chamber: "CONGRESO" } },
        ],
      },
    }),
  ]);

  return {
    total,
    aprobados,
    enComision,
    dictamen,
    conTituloIa,
    sinTituloIa: Math.max(0, total - conTituloIa),
    diputados,
    senado,
    congreso,
  };
}

export const getBillFilterOptions = unstable_cache(
  async () => {
    const [distinctPeriods, parliamentaryGroups] = await Promise.all([
      prisma.bill.findMany({
        distinct: ["period"],
        select: { period: true },
        where: { period: { not: null } },
        orderBy: { period: "desc" },
      }),
      prisma.parliamentarygroup.findMany({
        select: { id: true, name: true, acronym: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const periods = distinctPeriods
      .map((p) => p.period)
      .filter((p): p is string => Boolean(p));

    // Asegurar periodos estándar si la BD está vacía
    if (!periods.includes("2026-2031")) periods.unshift("2026-2031");
    if (!periods.includes("2021-2026")) periods.push("2021-2026");

    return {
      periods,
      parliamentaryGroups,
    };
  },
  ["bill-filter-options"],
  {
    revalidate: 3600, // 1 hora
    tags: ["bills", "filter-options"],
  },
);
