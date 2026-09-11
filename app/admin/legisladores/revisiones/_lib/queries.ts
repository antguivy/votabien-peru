import { Prisma, chambertype } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";

/**
 * Select de persona con datos de legislador activo (cámara, bancada, distrito)
 * para mostrar en la bandeja de revisiones de legisladores.
 */
export const personLegislatorSelect: Prisma.personDefaultArgs = {
  select: {
    id: true,
    fullname: true,
    dni: true,
    image_url: true,
    image_candidate_url: true,
    has_criminal_record: true,
    has_penal_sentence: true,
    has_sanction: true,
    is_under_investigation: true,
    legislator: {
      where: { active: true },
      orderBy: { start_date: "desc" },
      select: {
        chamber: true,
        active: true,
        condition: true,
        politicalparty: { select: { name: true } },
        electoraldistrict: {
          select: {
            name: true,
            level: true,
            code: true,
            is_national: true,
            parent: {
              select: {
                name: true,
                level: true,
                code: true,
                is_national: true,
                parent: {
                  select: {
                    name: true,
                    level: true,
                    code: true,
                    is_national: true,
                  },
                },
              },
            },
          },
        },
        parliamentarymembership: {
          where: { end_date: null },
          orderBy: { start_date: "desc" },
          take: 1,
          select: {
            parliamentarygroup: {
              select: { name: true, acronym: true },
            },
          },
        },
      },
    },
    _count: {
      select: {
        background: true,
      },
    },
  },
};

// Re-export constants from candidatos para no duplicar
export {
  CANONICAL_REGIONS,
  type RevisionesCounts,
} from "@/app/admin/candidatos/revisiones/_lib/constants";
import { type RevisionesCounts } from "@/app/admin/candidatos/revisiones/_lib/constants";

export async function getLegisladorRevisionCounts(): Promise<RevisionesCounts> {
  // Solo contar propuestas cuya person tenga al menos un legislator activo
  const legislatorPersonFilter: Prisma.research_proposalsWhereInput = {
    action: { not: "NONE" },
    person: {
      legislator: { some: { active: true } },
    },
  };

  const [pendingCount, approvedCount, rejectedCount, penalCount, eticaCount] =
    await Promise.all([
      prisma.research_proposals.count({
        where: { ...legislatorPersonFilter, status: "PENDING" },
      }),
      prisma.research_proposals.count({
        where: { ...legislatorPersonFilter, status: "APPROVED" },
      }),
      prisma.research_proposals.count({
        where: { ...legislatorPersonFilter, status: "REJECTED" },
      }),
      prisma.research_proposals.count({
        where: {
          ...legislatorPersonFilter,
          status: "PENDING",
          OR: [
            { proposed_data: { path: ["type"], string_contains: "PENAL" } },
            { proposed_data: { path: ["tipo"], string_contains: "PENAL" } },
          ],
        },
      }),
      prisma.research_proposals.count({
        where: {
          ...legislatorPersonFilter,
          status: "PENDING",
          OR: [
            { proposed_data: { path: ["type"], string_contains: "ETICA" } },
            { proposed_data: { path: ["tipo"], string_contains: "ETICA" } },
            { proposed_data: { path: ["type"], string_contains: "ETICO" } },
            { proposed_data: { path: ["tipo"], string_contains: "ETICO" } },
            {
              proposed_data: {
                path: ["type"],
                string_contains: "ADMINISTRATIVO",
              },
            },
            {
              proposed_data: {
                path: ["tipo"],
                string_contains: "ADMINISTRATIVO",
              },
            },
            { proposed_data: { path: ["type"], string_contains: "CIVIL" } },
            { proposed_data: { path: ["tipo"], string_contains: "CIVIL" } },
          ],
        },
      }),
    ]);

  const newsCount = Math.max(0, pendingCount - penalCount - eticaCount);
  const legalCount = penalCount + eticaCount;

  return {
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    penal: penalCount,
    etica: eticaCount,
    news: newsCount,
    legal: legalCount,
  };
}

export interface GetLegisladorRevisionesParams {
  tab?: string;
  page?: number;
  pageSize?: number;
  q?: string;
  region?: string;
  cargo?: string; // En este contexto = cámara (SENADO / DIPUTADOS)
  action?: string;
}

export async function getPaginatedLegisladorRevisiones(
  params: GetLegisladorRevisionesParams,
) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const tab = params.tab || "PENDING_ALL";
  const action = params.action || "ALL";
  const region = params.region || "ALL";
  const cargo = params.cargo || "ALL"; // cargo = chamber filter
  const q = params.q?.trim() || "";

  const where: Prisma.research_proposalsWhereInput = {
    action: { not: "NONE" },
    // Solo propuestas de personas con legislador activo
    person: {
      legislator: { some: { active: true } },
    },
  };

  // 1. Status y sub-filtros por pestaña
  if (tab === "APPROVED") {
    where.status = "APPROVED";
  } else if (tab === "REJECTED") {
    where.status = "REJECTED";
  } else if (tab === "PENDING_LEGAL") {
    where.status = "PENDING";
    where.OR = [
      { proposed_data: { path: ["type"], string_contains: "PENAL" } },
      { proposed_data: { path: ["tipo"], string_contains: "PENAL" } },
      { proposed_data: { path: ["type"], string_contains: "ETICA" } },
      { proposed_data: { path: ["tipo"], string_contains: "ETICA" } },
      { proposed_data: { path: ["type"], string_contains: "ETICO" } },
      { proposed_data: { path: ["tipo"], string_contains: "ETICO" } },
      { proposed_data: { path: ["type"], string_contains: "ADMINISTRATIVO" } },
      { proposed_data: { path: ["tipo"], string_contains: "ADMINISTRATIVO" } },
      { proposed_data: { path: ["type"], string_contains: "CIVIL" } },
      { proposed_data: { path: ["tipo"], string_contains: "CIVIL" } },
    ];
  } else if (tab === "PENDING_NEWS") {
    where.status = "PENDING";
    where.NOT = [
      { proposed_data: { path: ["type"], string_contains: "PENAL" } },
      { proposed_data: { path: ["tipo"], string_contains: "PENAL" } },
      { proposed_data: { path: ["type"], string_contains: "ETICA" } },
      { proposed_data: { path: ["tipo"], string_contains: "ETICA" } },
      { proposed_data: { path: ["type"], string_contains: "ETICO" } },
      { proposed_data: { path: ["tipo"], string_contains: "ETICO" } },
      { proposed_data: { path: ["type"], string_contains: "ADMINISTRATIVO" } },
      { proposed_data: { path: ["tipo"], string_contains: "ADMINISTRATIVO" } },
      { proposed_data: { path: ["type"], string_contains: "CIVIL" } },
      { proposed_data: { path: ["tipo"], string_contains: "CIVIL" } },
    ];
  } else {
    // PENDING_ALL por defecto
    where.status = "PENDING";
  }

  // 2. Filtro por acción
  if (action !== "ALL") {
    where.action = action;
  }

  const andClauses: Prisma.research_proposalsWhereInput[] = [];

  // 3. Filtro por cámara (Senado / Diputados)
  if (cargo !== "ALL") {
    const chamberMap: Record<string, chambertype> = {
      SENADO: chambertype.SENADO,
      DIPUTADOS: chambertype.DIPUTADOS,
    };
    const chamberVal = chamberMap[cargo];
    if (chamberVal) {
      andClauses.push({
        person: {
          legislator: {
            some: { active: true, chamber: chamberVal },
          },
        },
      });
    }
  }

  // 4. Filtro por región (distrito electoral del legislador)
  if (region !== "ALL") {
    // Importación dinámica para reutilizar la función de candidatos
    const { getDistrictIdsForRegion } = await import(
      "@/app/admin/candidatos/revisiones/_lib/queries"
    );
    const districtIds = await getDistrictIdsForRegion(region);
    andClauses.push({
      person: {
        legislator: {
          some: {
            active: true,
            electoral_district_id: {
              in: districtIds.length > 0 ? districtIds : ["__NO_MATCH__"],
            },
          },
        },
      },
    });
  }

  // 5. Búsqueda por texto
  if (q) {
    const cleanQ = q.trim();
    andClauses.push({
      OR: [
        { person: { fullname: { contains: cleanQ, mode: "insensitive" } } },
        { person: { dni: { contains: cleanQ } } },
        { proposed_data: { path: ["title"], string_contains: cleanQ } },
        { proposed_data: { path: ["titulo"], string_contains: cleanQ } },
      ],
    });
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  const orderBy: Prisma.research_proposalsOrderByWithRelationInput[] =
    tab === "APPROVED" || tab === "REJECTED"
      ? [
          { reviewed_at: { sort: "desc", nulls: "last" } },
          { created_at: "desc" },
        ]
      : [{ created_at: "desc" }];

  const [items, totalItems] = await Promise.all([
    prisma.research_proposals.findMany({
      where,
      include: { person: personLegislatorSelect },
      orderBy,
      take: pageSize,
      skip: skip,
    }),
    prisma.research_proposals.count({ where }),
  ]);

  return {
    items,
    totalItems,
    currentPage: page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}
