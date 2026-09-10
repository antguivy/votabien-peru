import { Prisma, candidacytype } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";

export const personSelect: Prisma.personDefaultArgs = {
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
    candidate: {
      where: {
        active: true,
        electoralprocess: { active: true },
      },
      orderBy: [{ type: "asc" }, { list_number: "asc" }],
      select: {
        type: true,
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
      },
    },
    _count: {
      select: {
        background: true,
      },
    },
  },
};

export const CANONICAL_REGIONS = [
  "Amazonas",
  "Ancash",
  "Apurímac",
  "Arequipa",
  "Ayacucho",
  "Cajamarca",
  "Callao",
  "Cusco",
  "Huancavelica",
  "Huánuco",
  "Ica",
  "Junín",
  "La Libertad",
  "Lambayeque",
  "Lima",
  "Loreto",
  "Madre de Dios",
  "Moquegua",
  "Pasco",
  "Piura",
  "Puno",
  "San Martín",
  "Tacna",
  "Tumbes",
  "Ucayali",
  "Extranjero",
  "Ámbito Nacional",
];

export interface RevisionesCounts {
  pending: number;
  approved: number;
  rejected: number;
  penal: number;
  etica: number;
  news: number;
  legal: number;
}

export async function getRevisionCounts(): Promise<RevisionesCounts> {
  const [pendingCount, approvedCount, rejectedCount, penalCount, eticaCount] =
    await Promise.all([
      prisma.research_proposals.count({
        where: { status: "PENDING", action: { not: "NONE" } },
      }),
      prisma.research_proposals.count({
        where: { status: "APPROVED", action: { not: "NONE" } },
      }),
      prisma.research_proposals.count({
        where: { status: "REJECTED", action: { not: "NONE" } },
      }),
      prisma.research_proposals.count({
        where: {
          status: "PENDING",
          action: { not: "NONE" },
          OR: [
            { proposed_data: { path: ["type"], string_contains: "PENAL" } },
            { proposed_data: { path: ["tipo"], string_contains: "PENAL" } },
          ],
        },
      }),
      prisma.research_proposals.count({
        where: {
          status: "PENDING",
          action: { not: "NONE" },
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

export interface GetRevisionesParams {
  tab?: string;
  page?: number;
  pageSize?: number;
  q?: string;
  region?: string;
  cargo?: string;
  action?: string;
}

function normalizeSearch(term: string): string {
  return term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export async function getPaginatedRevisiones(params: GetRevisionesParams) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const tab = params.tab || "PENDING_ALL";
  const action = params.action || "ALL";
  const region = params.region || "ALL";
  const cargo = params.cargo || "ALL";
  const q = params.q?.trim() || "";

  const where: Prisma.research_proposalsWhereInput = {
    action: { not: "NONE" },
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

  // 3. Filtros relacionales de candidato (cargo y región)
  const candidateWhere: Prisma.candidateWhereInput = {
    active: true,
  };

  const cargoMap: Record<string, candidacytype[]> = {
    GOBERNADOR: [
      candidacytype.GOBERNADOR_REGIONAL,
      candidacytype.VICEGOBERNADOR_REGIONAL,
    ],
    ALCALDE_PROV: [candidacytype.ALCALDE_PROVINCIAL],
    ALCALDE_DIST: [candidacytype.ALCALDE_DISTRITAL],
    REGIDOR_CONSEJERO: [
      candidacytype.CONSEJERO_REGIONAL,
      candidacytype.REGIDOR_PROVINCIAL,
      candidacytype.REGIDOR_DISTRITAL,
    ],
    NACIONAL: [
      candidacytype.PRESIDENTE,
      candidacytype.VICEPRESIDENTE_1,
      candidacytype.VICEPRESIDENTE_2,
      candidacytype.SENADOR,
      candidacytype.DIPUTADO,
    ],
  };

  if (cargo !== "ALL" && cargoMap[cargo]) {
    candidateWhere.type = { in: cargoMap[cargo] };
  }

  if (region !== "ALL") {
    const regUpper = normalizeSearch(region).toUpperCase();
    if (regUpper === "AMBITO NACIONAL") {
      candidateWhere.OR = [
        { electoraldistrict: { is_national: true } },
        {
          electoraldistrict: {
            name: { contains: "nacional", mode: "insensitive" },
          },
        },
        { electoraldistrict: { code: "NAC" } },
      ];
    } else if (regUpper === "EXTRANJERO") {
      candidateWhere.OR = [
        {
          electoraldistrict: {
            name: { contains: "extranjero", mode: "insensitive" },
          },
        },
        { electoraldistrict: { code: "EXT" } },
      ];
    } else if (regUpper === "LIMA") {
      candidateWhere.OR = [
        {
          electoraldistrict: {
            name: { contains: "LIMA", mode: "insensitive" },
          },
        },
        {
          electoraldistrict: {
            parent: { name: { contains: "LIMA", mode: "insensitive" } },
          },
        },
        {
          electoraldistrict: {
            parent: {
              parent: { name: { contains: "LIMA", mode: "insensitive" } },
            },
          },
        },
      ];
    } else {
      const cleanTerm = normalizeSearch(region);
      candidateWhere.OR = [
        {
          electoraldistrict: {
            name: { contains: cleanTerm, mode: "insensitive" },
          },
        },
        {
          electoraldistrict: {
            parent: { name: { contains: cleanTerm, mode: "insensitive" } },
          },
        },
        {
          electoraldistrict: {
            parent: {
              parent: { name: { contains: cleanTerm, mode: "insensitive" } },
            },
          },
        },
      ];
    }
  }

  const andClauses: Prisma.research_proposalsWhereInput[] = [];

  if (cargo !== "ALL" || region !== "ALL") {
    andClauses.push({
      person: {
        candidate: {
          some: candidateWhere,
        },
      },
    });
  }

  // 4. Búsqueda por texto (nombre, DNI o título de propuesta)
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
      include: { person: personSelect },
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
