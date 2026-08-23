import prisma from "@/lib/prisma";
import { type GetBillsSchema } from "./validation";
import { Prisma } from "@/prisma/generated/client";

export async function getBills(input: GetBillsSchema) {
  const { page, perPage, sort, search, period, status, parliamentary_group } =
    input;
  const skip = (page - 1) * perPage;
  const take = perPage;

  const where: Prisma.billWhereInput = {};

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
    where.OR = [
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
    ];
  }

  const orderBy: Prisma.billOrderByWithRelationInput[] = sort.map((s) => {
    if (s.id === "legislator") {
      return {
        legislator: {
          person: {
            fullname: s.desc ? "desc" : "asc",
          },
        },
      };
    }
    if (s.id === "parliamentary_group_id" || s.id === "parliamentarygroup") {
      return {
        parliamentarygroup: {
          name: s.desc ? "desc" : "asc",
        },
      };
    }
    return {
      [s.id]: s.desc ? "desc" : "asc",
    };
  });

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

export async function getBillStats(period?: string) {
  const where: Prisma.billWhereInput = period ? { period } : {};

  const [total, aprobados, enComision, dictamen, conTituloIa] =
    await Promise.all([
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
    ]);

  return {
    total,
    aprobados,
    enComision,
    dictamen,
    conTituloIa,
    sinTituloIa: total - conTituloIa,
  };
}

export async function getBillFilterOptions() {
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
}
