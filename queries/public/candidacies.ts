import {
  CandidacyStatus,
  CandidacyType,
  CandidateCard,
  CandidateDetail,
  CandidatePresidentials,
  CandidateSuccession,
  SuccessionReason,
} from "@/interfaces/candidate";
import { RnasSanction } from "@/interfaces/person";
import { TAGS, TTL } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import {
  Prisma,
  candidacystatus,
  candidacytype,
} from "@/prisma/generated/client";
import { cache } from "react";
import { buildPersonSearchWhere } from "@/lib/search-filters";

const DISQUALIFIED_STATUSES: candidacystatus[] = [
  "RENUNCIA",
  "EXCLUIDO",
  "TACHADO",
  "IMPROCEDENTE",
  "FALLECIMIENTO",
];

const EXECUTIVE_SUCCESSION_CONFIG: Partial<
  Record<
    candidacytype,
    {
      successorType: candidacytype;
      listNumber?: number;
      legalBasis: string;
    }
  >
> = {
  GOBERNADOR_REGIONAL: {
    successorType: "VICEGOBERNADOR_REGIONAL",
    legalBasis: "Art. 23 Ley N° 27867 (LOGR)",
  },
  ALCALDE_PROVINCIAL: {
    successorType: "REGIDOR_PROVINCIAL",
    listNumber: 1,
    legalBasis: "Art. 24 Ley N° 27972 (LOM)",
  },
  ALCALDE_DISTRITAL: {
    successorType: "REGIDOR_DISTRITAL",
    listNumber: 1,
    legalBasis: "Art. 24 Ley N° 27972 (LOM)",
  },
};

const SUCCESSOR_TO_TARGET_MAP: Partial<
  Record<
    candidacytype,
    {
      targetType: candidacytype;
      expectedListNumber?: number;
      legalBasis: string;
    }
  >
> = {
  VICEGOBERNADOR_REGIONAL: {
    targetType: "GOBERNADOR_REGIONAL",
    legalBasis: "Art. 23 Ley N° 27867 (LOGR)",
  },
  REGIDOR_PROVINCIAL: {
    targetType: "ALCALDE_PROVINCIAL",
    expectedListNumber: 1,
    legalBasis: "Art. 24 Ley N° 27972 (LOM)",
  },
  REGIDOR_DISTRITAL: {
    targetType: "ALCALDE_DISTRITAL",
    expectedListNumber: 1,
    legalBasis: "Art. 24 Ley N° 27972 (LOM)",
  },
};

const CANDIDATE_CARD_SELECT = {
  id: true,
  electoral_process_id: true,
  political_party_id: true,
  electoral_district_id: true,
  type: true,
  list_number: true,
  status: true,
  active: true,
  person: {
    select: {
      id: true,
      name: true,
      lastname: true,
      fullname: true,
      image_url: true,
      image_candidate_url: true,
      profession: true,
      is_incumbent: true,
      education_level: true,
      secondary_school: true,
      has_criminal_record: true,
      has_penal_sentence: true,
      is_under_investigation: true,
      has_sanction: true,
      reinfo_status: true,
      rnas_sanctions: true,
      has_income: true,
      has_assets: true,
      work_experience_count: true,
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
  electoraldistrict: {
    select: {
      id: true,
      name: true,
      code: true,
      is_national: true,
      active: true,
    },
  },
} as const;

type RawCandidateCard = Prisma.candidateGetPayload<{
  select: typeof CANDIDATE_CARD_SELECT;
}>;

function mapRawCandidateToCard(candidate: RawCandidateCard): CandidateCard {
  const p = candidate.person;
  return {
    id: candidate.id,
    active: candidate.active,
    electoral_process_id: candidate.electoral_process_id,
    political_party_id: candidate.political_party_id,
    electoral_district_id: candidate.electoral_district_id,
    type: candidate.type as CandidacyType,
    list_number: candidate.list_number,
    status: candidate.status as CandidacyStatus,
    person: {
      id: p.id,
      fullname: p.fullname,
      image_url: p.image_url,
      image_candidate_url: p.image_candidate_url,
      profession: p.profession,
      is_incumbent: (p.is_incumbent as boolean) ?? false,
      education_level: (p.education_level as number | null) ?? null,
      secondary_school: (p.secondary_school as boolean | null) ?? null,
      has_criminal_record: (p.has_criminal_record as boolean) ?? false,
      has_penal_sentence: (p.has_penal_sentence as boolean) ?? false,
      is_under_investigation: (p.is_under_investigation as boolean) ?? false,
      has_sanction: (p.has_sanction as boolean) ?? false,
      reinfo_status: (p.reinfo_status as string | null) ?? null,
      rnas_sanctions: parseRnasSanctions(p.rnas_sanctions),
      has_income: (p.has_income as boolean) ?? false,
      has_assets: (p.has_assets as boolean) ?? false,
      work_experience_count: p.work_experience_count as number,
    },
    political_party: {
      id: candidate.politicalparty?.id,
      name: candidate.politicalparty?.name,
      acronym: candidate.politicalparty?.acronym ?? null,
      logo_url: candidate.politicalparty?.logo_url ?? null,
      color_hex: candidate.politicalparty?.color_hex ?? null,
      active: candidate.politicalparty?.active,
      foundation_date:
        (candidate.politicalparty?.foundation_date as unknown as string) ??
        null,
    },
    electoral_district: candidate.electoraldistrict
      ? {
          id: candidate.electoraldistrict.id,
          name: candidate.electoraldistrict.name,
          code: candidate.electoraldistrict.code,
          is_national: candidate.electoraldistrict.is_national,
          active: candidate.electoraldistrict.active,
        }
      : null,
    has_metrics: false,
  };
}

interface GetCandidatesParams {
  ids?: string[];
  electoral_process_id?: string;
  type?: string;
  districts?: string[];
  parties?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
  alerts?: string[];
  no_sentencias?: boolean;
  min_work?: number;
  education?: string;
  active?: boolean;
}

function parseRnasSanctions(val: unknown): RnasSanction[] | null {
  if (!val || !Array.isArray(val) || val.length === 0) return null;
  const parsed = val.map((item) => {
    if (typeof item === "string") {
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    }
    return item;
  });
  return parsed as RnasSanction[];
}
const LIMA_METRO_ID = "hxvfxkwrav0ogbpsi3mvb4cw";
const LIMA_PROV_ID = "gw2kf8o38y3b9hiand3sfjjb";

function buildDistrictFilter(
  type: string,
  districts?: string[],
): Prisma.electoraldistrictWhereInput | undefined {
  if (!districts || districts.length === 0) return undefined;

  const orConditions: Prisma.electoraldistrictWhereInput[] = [];

  for (const d of districts) {
    if (!d || !d.trim()) continue;
    const cleanD = d.trim();

    let baseName = cleanD;
    let parentName = "";
    if (cleanD.includes(" (")) {
      const parts = cleanD.split(" (");
      baseName = parts[0].trim();
      parentName = parts[1].replace(")", "").trim();
    } else if (cleanD.includes(" - ")) {
      const parts = cleanD.split(" - ");
      baseName = parts[0].trim();
      parentName = parts.slice(1).join(" ");
    }

    const isLimaMetro =
      cleanD === LIMA_METRO_ID ||
      cleanD.toUpperCase() === "LIM" ||
      cleanD.toUpperCase() === "LIMA METROPOLITANA" ||
      baseName.toUpperCase() === "LIMA METROPOLITANA";

    const isLimaProvincias =
      cleanD === LIMA_PROV_ID ||
      cleanD.toUpperCase() === "LMP" ||
      cleanD.toUpperCase() === "LIMA PROVINCIAS" ||
      baseName.toUpperCase() === "LIMA PROVINCIAS";

    const isGenericLima =
      cleanD.toUpperCase() === "LIMA" ||
      cleanD.toUpperCase() === "REGIÓN LIMA" ||
      cleanD.toUpperCase() === "REGION LIMA" ||
      baseName.toUpperCase() === "LIMA";

    if (type === "GOBERNADOR_REGIONAL" || type === "VICEGOBERNADOR_REGIONAL") {
      const depSearch = parentName || baseName;
      if (isLimaMetro) {
        // En Lima Metropolitana no existe elección regional
        orConditions.push({ id: "__none_no_regional_in_lima_metro__" });
      } else if (isLimaProvincias || isGenericLima) {
        orConditions.push(
          { code: "LMP" },
          { id: LIMA_PROV_ID },
          {
            name: { contains: "LIMA PROVINCIAS", mode: "insensitive" as const },
          },
        );
      } else {
        orConditions.push(
          { id: cleanD },
          { code: cleanD },
          { children: { some: { id: cleanD } } },
          { children: { some: { children: { some: { id: cleanD } } } } },
          { children: { some: { code: cleanD } } },
          { children: { some: { children: { some: { code: cleanD } } } } },
          { name: { equals: depSearch, mode: "insensitive" as const } },
          { name: { contains: depSearch, mode: "insensitive" as const } },
        );
      }
    } else if (type === "CONSEJERO_REGIONAL") {
      const depSearch = parentName || baseName;
      if (isLimaMetro) {
        orConditions.push({ id: "__none_no_regional_in_lima_metro__" });
      } else if (isLimaProvincias || isGenericLima) {
        orConditions.push(
          { parent: { code: "LMP" } },
          { parent_id: LIMA_PROV_ID },
        );
      } else {
        orConditions.push(
          { id: cleanD },
          { parent_id: cleanD },
          { parent: { id: cleanD } },
          { parent: { code: cleanD } },
          { parent: { children: { some: { id: cleanD } } } },
          {
            parent: {
              children: { some: { children: { some: { id: cleanD } } } },
            },
          },
          {
            parent: {
              name: { equals: depSearch, mode: "insensitive" as const },
            },
          },
          {
            parent: {
              name: { contains: depSearch, mode: "insensitive" as const },
            },
          },
        );
      }
    } else if (type === "ALCALDE_PROVINCIAL" || type === "REGIDOR_PROVINCIAL") {
      if (isLimaMetro) {
        orConditions.push({ id: LIMA_METRO_ID }, { code: "LIM" });
      } else if (isLimaProvincias) {
        orConditions.push(
          { parent: { code: "LMP" } },
          { parent_id: LIMA_PROV_ID },
        );
      } else if (isGenericLima) {
        orConditions.push(
          { id: LIMA_METRO_ID },
          { code: "LIM" },
          { parent: { code: "LMP" } },
          { parent_id: LIMA_PROV_ID },
        );
      } else {
        orConditions.push(
          { id: cleanD },
          { code: cleanD },
          { children: { some: { id: cleanD } } },
          { children: { some: { code: cleanD } } },
          { parent_id: cleanD },
          { parent: { code: cleanD } },
          { name: { equals: baseName, mode: "insensitive" as const } },
          {
            name: { startsWith: baseName + " -", mode: "insensitive" as const },
          },
          ...(parentName
            ? [{ name: { contains: parentName, mode: "insensitive" as const } }]
            : []),
          ...(parentName
            ? []
            : [
                {
                  parent: {
                    name: { equals: baseName, mode: "insensitive" as const },
                  },
                },
              ]),
        );
      }
    } else if (type === "ALCALDE_DISTRITAL" || type === "REGIDOR_DISTRITAL") {
      if (isLimaMetro) {
        orConditions.push(
          { parent: { code: "LIM" } },
          { parent_id: LIMA_METRO_ID },
        );
      } else if (isLimaProvincias) {
        orConditions.push(
          { parent: { parent: { code: "LMP" } } },
          { parent: { parent_id: LIMA_PROV_ID } },
        );
      } else if (isGenericLima) {
        orConditions.push(
          { parent: { code: "LIM" } },
          { parent_id: LIMA_METRO_ID },
          { parent: { parent: { code: "LMP" } } },
          { parent: { parent_id: LIMA_PROV_ID } },
        );
      } else {
        orConditions.push(
          { id: cleanD },
          { code: cleanD },
          { ubigeo: cleanD },
          { parent_id: cleanD },
          { parent: { code: cleanD } },
          { parent: { parent_id: cleanD } },
          { parent: { parent: { code: cleanD } } },
          { name: { equals: baseName, mode: "insensitive" as const } },
          {
            name: { startsWith: baseName + " -", mode: "insensitive" as const },
          },
          {
            parent: {
              name: { equals: baseName, mode: "insensitive" as const },
            },
          },
          {
            parent: {
              parent: {
                name: { equals: baseName, mode: "insensitive" as const },
              },
            },
          },
        );
      }
    } else {
      orConditions.push(
        { id: cleanD },
        { code: cleanD },
        { ubigeo: cleanD },
        { name: { contains: cleanD, mode: "insensitive" as const } },
        { parent_id: cleanD },
      );
    }
  }

  return orConditions.length > 0 ? { OR: orConditions } : undefined;
}

export const getCandidatesCardsCached = cache(
  unstable_cache(
    async ({
      electoral_process_id,
      type,
      districts,
      parties,
      search,
      ids,
      page = 1,
      pageSize = 40,
      alerts,
      no_sentencias,
      min_work,
      education,
      active,
    }: GetCandidatesParams): Promise<CandidateCard[]> => {
      try {
        const personSearchWhere = buildPersonSearchWhere(search);
        const hasSearch = !!personSearchWhere;

        const isExecutive =
          !hasSearch &&
          (type === "GOBERNADOR_REGIONAL" ||
            type === "ALCALDE_PROVINCIAL" ||
            type === "ALCALDE_DISTRITAL" ||
            type === "PRESIDENTE");

        const skip = hasSearch ? 0 : (page - 1) * pageSize;
        const take = hasSearch ? 100 : pageSize;

        const whereClause: Prisma.candidateWhereInput = {
          active: active !== undefined ? active : true,
        };

        if (electoral_process_id)
          whereClause.electoral_process_id = electoral_process_id;
        if (ids && ids.length > 0) whereClause.id = { in: ids };

        const districtFilter = buildDistrictFilter(
          type || "GOBERNADOR_REGIONAL",
          districts,
        );

        if (!hasSearch && type) {
          switch (type) {
            case "GOBERNADOR_REGIONAL":
              whereClause.type = "GOBERNADOR_REGIONAL";
              if (districtFilter)
                whereClause.electoraldistrict = districtFilter;
              break;
            case "VICEGOBERNADOR_REGIONAL":
              whereClause.type = "VICEGOBERNADOR_REGIONAL";
              if (districtFilter)
                whereClause.electoraldistrict = districtFilter;
              break;
            case "CONSEJERO_REGIONAL":
              whereClause.type = "CONSEJERO_REGIONAL";
              if (districtFilter)
                whereClause.electoraldistrict = districtFilter;
              break;
            case "ALCALDE_PROVINCIAL":
              whereClause.type = "ALCALDE_PROVINCIAL";
              if (districtFilter)
                whereClause.electoraldistrict = districtFilter;
              break;
            case "REGIDOR_PROVINCIAL":
              whereClause.type = "REGIDOR_PROVINCIAL";
              if (districtFilter)
                whereClause.electoraldistrict = districtFilter;
              break;
            case "ALCALDE_DISTRITAL":
              whereClause.type = "ALCALDE_DISTRITAL";
              if (districtFilter)
                whereClause.electoraldistrict = districtFilter;
              break;
            case "REGIDOR_DISTRITAL":
              whereClause.type = "REGIDOR_DISTRITAL";
              if (districtFilter)
                whereClause.electoraldistrict = districtFilter;
              break;
            case "PRESIDENTE":
              whereClause.type = "PRESIDENTE";
              whereClause.electoraldistrict = { is_national: true };
              break;
            case "SENADOR_NACIONAL":
              whereClause.type = "SENADOR";
              whereClause.electoraldistrict = { is_national: true };
              break;
            case "SENADOR_REGIONAL":
              whereClause.type = "SENADOR";
              whereClause.electoraldistrict = { is_national: false };
              if (districtFilter)
                whereClause.electoraldistrict = districtFilter;
              break;
            case "DIPUTADO":
              whereClause.type = "DIPUTADO";
              if (districtFilter)
                whereClause.electoraldistrict = districtFilter;
              break;
            case "PARLAMENTO_ANDINO":
              whereClause.type = "PARLAMENTO_ANDINO";
              whereClause.electoraldistrict = { is_national: true };
              break;
            default:
              whereClause.type = "GOBERNADOR_REGIONAL";
              if (districtFilter)
                whereClause.electoraldistrict = districtFilter;
              break;
          }
        }

        if (parties && parties.length > 0)
          whereClause.political_party_id = { in: parties };

        const personWhere: Prisma.personWhereInput = {};

        if (personSearchWhere) {
          Object.assign(personWhere, personSearchWhere);
        }

        // Filtro ético (Sin sentencias penales ni civiles)
        if (no_sentencias || (alerts && alerts.includes("NO_SENTENCIAS"))) {
          personWhere.has_penal_sentence = false;
          personWhere.has_sanction = false;
        }

        // Filtro de experiencia laboral mínima
        if (min_work && min_work > 0) {
          personWhere.work_experience_count = { gte: min_work };
        }

        // Filtro de nivel de estudios
        if (education && education !== "all") {
          if (education === "universitaria") {
            personWhere.education_level = { gte: 2 };
          } else if (education === "tecnica") {
            personWhere.education_level = { gte: 1 };
          } else if (education === "secundaria") {
            personWhere.secondary_school = true;
          }
        }

        if (Object.keys(personWhere).length > 0) {
          whereClause.person = personWhere;
        }

        if (!hasSearch && isExecutive) {
          whereClause.status = { notIn: DISQUALIFIED_STATUSES };
        }

        const data = await prisma.candidate.findMany({
          where: whereClause,
          skip,
          take,
          orderBy: !isExecutive ? { list_number: "asc" } : undefined,
          select: CANDIDATE_CARD_SELECT,
        });

        const resultCards: CandidateCard[] = data.map(mapRawCandidateToCard);

        const succConfig = type
          ? EXECUTIVE_SUCCESSION_CONFIG[type as candidacytype]
          : undefined;

        // Si es cargo ejecutivo en la primera página (o listado distrital/provincial/regional),
        // incorporar al sucesor legal (ej. Primer Regidor o Vicegobernador) en aquellas listas
        // cuyo candidato titular no esté disponible (renuncia, exclusión, tacha o inactivo).
        if (!hasSearch && succConfig && page === 1) {
          const successorWhere: Prisma.candidateWhereInput = {
            active: true,
            status: { notIn: DISQUALIFIED_STATUSES },
            type: succConfig.successorType,
            ...(succConfig.listNumber !== undefined
              ? { list_number: succConfig.listNumber }
              : {}),
          };

          if (electoral_process_id)
            successorWhere.electoral_process_id = electoral_process_id;
          if (districtFilter) successorWhere.electoraldistrict = districtFilter;
          if (parties && parties.length > 0)
            successorWhere.political_party_id = { in: parties };
          if (Object.keys(personWhere).length > 0)
            successorWhere.person = personWhere;

          const potentialSuccessors = await prisma.candidate.findMany({
            where: successorWhere,
            select: CANDIDATE_CARD_SELECT,
          });

          if (potentialSuccessors.length > 0) {
            const partyIds = Array.from(
              new Set(potentialSuccessors.map((s) => s.political_party_id)),
            );
            const districtIds = Array.from(
              new Set(potentialSuccessors.map((s) => s.electoral_district_id)),
            );

            // Identificar qué listas ya tienen un titular hábil en carrera
            const existingTitulares = await prisma.candidate.findMany({
              where: {
                ...(electoral_process_id ? { electoral_process_id } : {}),
                type: type as candidacytype,
                active: true,
                status: { notIn: DISQUALIFIED_STATUSES },
                political_party_id: { in: partyIds },
                electoral_district_id: { in: districtIds },
              },
              select: {
                political_party_id: true,
                electoral_district_id: true,
              },
            });

            const existingTitularSet = new Set(
              existingTitulares.map(
                (t) => `${t.political_party_id}:${t.electoral_district_id}`,
              ),
            );

            // Filtrar únicamente los sucesores de listas sin titular hábil
            const validSuccessors = potentialSuccessors.filter(
              (s) =>
                !existingTitularSet.has(
                  `${s.political_party_id}:${s.electoral_district_id}`,
                ),
            );

            if (validSuccessors.length > 0) {
              const inactiveTitulares = await prisma.candidate.findMany({
                where: {
                  ...(electoral_process_id ? { electoral_process_id } : {}),
                  type: type as candidacytype,
                  political_party_id: {
                    in: validSuccessors.map((s) => s.political_party_id),
                  },
                  electoral_district_id: {
                    in: validSuccessors.map((s) => s.electoral_district_id),
                  },
                },
                select: {
                  political_party_id: true,
                  electoral_district_id: true,
                  status: true,
                  active: true,
                  person: { select: { fullname: true } },
                },
              });

              const titularInfoMap = new Map<
                string,
                { name: string | null; reason: SuccessionReason }
              >();

              for (const it of inactiveTitulares) {
                const key = `${it.political_party_id}:${it.electoral_district_id}`;
                let reason: SuccessionReason = "INACTIVO";
                if (it.status === "RENUNCIA") reason = "RENUNCIA";
                else if (it.status === "EXCLUIDO") reason = "EXCLUIDO";
                else if (it.status === "TACHADO") reason = "TACHADO";
                else if (it.status === "IMPROCEDENTE") reason = "IMPROCEDENTE";
                else if (it.status === "FALLECIMIENTO")
                  reason = "FALLECIMIENTO";
                else if (!it.active) reason = "INACTIVO";

                titularInfoMap.set(key, {
                  name: it.person?.fullname ?? null,
                  reason,
                });
              }

              for (const successor of validSuccessors) {
                const key = `${successor.political_party_id}:${successor.electoral_district_id}`;
                const titularInfo = titularInfoMap.get(key);
                const reason: SuccessionReason =
                  titularInfo?.reason ?? "INACTIVO";
                const originalName = titularInfo?.name ?? null;

                const card = mapRawCandidateToCard(successor);
                card.succession = {
                  target_type: type as unknown as CandidacyType,
                  original_candidate_name: originalName,
                  reason,
                  legal_basis: succConfig.legalBasis,
                };

                resultCards.push(card);
              }
            }
          }
        }

        // Si la consulta fue por búsqueda libre (texto), enriquecer aquellos candidatos que son sucesores
        if (hasSearch && resultCards.length > 0) {
          for (const card of resultCards) {
            const rule = SUCCESSOR_TO_TARGET_MAP[card.type as candidacytype];
            if (
              rule &&
              (rule.expectedListNumber === undefined ||
                card.list_number === rule.expectedListNumber) &&
              card.active &&
              !DISQUALIFIED_STATUSES.includes(card.status as candidacystatus)
            ) {
              const titular = await prisma.candidate.findFirst({
                where: {
                  electoral_process_id: card.electoral_process_id,
                  political_party_id: card.political_party_id,
                  electoral_district_id: card.electoral_district_id,
                  type: rule.targetType,
                },
                select: {
                  active: true,
                  status: true,
                  person: { select: { fullname: true } },
                },
              });

              if (
                !titular ||
                !titular.active ||
                DISQUALIFIED_STATUSES.includes(
                  titular.status as candidacystatus,
                )
              ) {
                let reason: SuccessionReason = "INACTIVO";
                if (titular?.status === "RENUNCIA") reason = "RENUNCIA";
                else if (titular?.status === "EXCLUIDO") reason = "EXCLUIDO";
                else if (titular?.status === "TACHADO") reason = "TACHADO";
                else if (titular?.status === "IMPROCEDENTE")
                  reason = "IMPROCEDENTE";
                else if (titular?.status === "FALLECIMIENTO")
                  reason = "FALLECIMIENTO";
                else if (titular && !titular.active) reason = "INACTIVO";

                card.succession = {
                  target_type: rule.targetType as unknown as CandidacyType,
                  original_candidate_name: titular?.person?.fullname ?? null,
                  reason,
                  legal_basis: rule.legalBasis,
                };
              }
            }
          }
        }

        return resultCards;
      } catch (error) {
        // Se relanza deliberadamente: `unstable_cache` no debe almacenar una
        // lista vacía de respaldo (quedaría cacheada durante TTL.static).
        console.error("Error al obtener las tarjetas de candidatos:", error);
        throw error;
      }
    },
    // v2: la semántica de filtrado por circunscripción cambió; se incrementa la
    // clave para invalidar entradas previamente cacheadas.
    ["candidates-cards-list-v2"],
    {
      tags: [TAGS.candidates],
      revalidate: TTL.static,
    },
  ),
);

/**
 * Punto de entrada tolerante a fallos para la grilla de candidatos.
 *
 * La capa cacheada nunca devuelve una lista vacía ante un error, y este
 * envoltorio conserva la degradación controlada (lista vacía + log) para que
 * una falla del backend no rompa el render.
 */
export async function getCandidatesCards(
  params: GetCandidatesParams,
): Promise<CandidateCard[]> {
  try {
    return await getCandidatesCardsCached(params);
  } catch (error) {
    console.error("Error al obtener las tarjetas de candidatos:", error);
    return [];
  }
}

export const getPrincipalCandidates = cache(
  unstable_cache(
    async (partidoId: string): Promise<CandidatePresidentials[]> => {
      try {
        const processValid = await prisma.electoralprocess.findFirst({
          where: { active: true },
          select: { id: true },
        });

        if (!processValid) throw new Error("No hay proceso electoral activo");

        const data = await prisma.candidate.findMany({
          where: {
            electoral_process_id: processValid.id,
            political_party_id: partidoId,
            type: {
              in: ["PRESIDENTE", "VICEPRESIDENTE_1", "VICEPRESIDENTE_2"],
            },
          },
          select: {
            id: true,
            type: true,
            person: {
              select: { id: true, fullname: true, image_candidate_url: true },
            },
          },
        });

        return data.map((c) => ({
          id: c.id,
          type: c.type as CandidacyType,
          person: {
            id: c.person.id,
            fullname: c.person.fullname,
            image_url: null,
            image_candidate_url: c.person.image_candidate_url,
            dni: null,
            profession: null,
          },
        }));
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    ["principal-candidates"],
    { tags: [TAGS.candidates, TAGS.electoral_process] },
  ),
);

export const getFormulaPorPartido = cache(
  unstable_cache(
    async (
      partidoId: string,
      processId: string,
      candidacyType?: string,
      districtId?: string,
    ): Promise<CandidatePresidentials[]> => {
      try {
        const whereClause: Prisma.candidateWhereInput = {
          electoral_process_id: processId,
          political_party_id: partidoId,
        };

        if (candidacyType === "GOBERNADOR_REGIONAL") {
          whereClause.type = "VICEGOBERNADOR_REGIONAL";
          if (districtId) whereClause.electoral_district_id = districtId;
        } else if (candidacyType === "VICEGOBERNADOR_REGIONAL") {
          whereClause.type = "GOBERNADOR_REGIONAL";
          if (districtId) whereClause.electoral_district_id = districtId;
        } else if (candidacyType === "ALCALDE_PROVINCIAL") {
          whereClause.type = "REGIDOR_PROVINCIAL";
          if (districtId) whereClause.electoral_district_id = districtId;
        } else if (candidacyType === "ALCALDE_DISTRITAL") {
          whereClause.type = "REGIDOR_DISTRITAL";
          if (districtId) whereClause.electoral_district_id = districtId;
        } else if (candidacyType === "REGIDOR_PROVINCIAL") {
          whereClause.type = {
            in: ["ALCALDE_PROVINCIAL", "REGIDOR_PROVINCIAL"],
          };
          if (districtId) whereClause.electoral_district_id = districtId;
        } else if (candidacyType === "REGIDOR_DISTRITAL") {
          whereClause.type = {
            in: ["ALCALDE_DISTRITAL", "REGIDOR_DISTRITAL"],
          };
          if (districtId) whereClause.electoral_district_id = districtId;
        } else if (candidacyType === "CONSEJERO_REGIONAL") {
          whereClause.type = {
            in: ["GOBERNADOR_REGIONAL", "VICEGOBERNADOR_REGIONAL"],
          };
        } else {
          whereClause.type = { in: ["VICEPRESIDENTE_1", "VICEPRESIDENTE_2"] };
        }

        const data = await prisma.candidate.findMany({
          where: whereClause,
          select: {
            id: true,
            type: true,
            list_number: true,
            person: {
              select: {
                id: true,
                fullname: true,
                image_candidate_url: true,
                profession: true,
              },
            },
          },
          orderBy: [{ type: "asc" }, { list_number: "asc" }],
        });
        return data as unknown as CandidatePresidentials[];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return [];
      }
    },
    ["formula-por-partido"],
    { tags: [TAGS.candidates] },
  ),
);

export const getActiveLegislatorId = cache(
  unstable_cache(
    async (personId: string): Promise<string | null> => {
      try {
        const data = await prisma.legislator.findFirst({
          where: { person_id: personId, active: true },
          select: { id: true },
        });
        return data ? data.id : null;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return null;
      }
    },
    ["active-legislator"],
    { tags: [TAGS.candidates] },
  ),
);

export const getCandidateById = cache(
  unstable_cache(
    async (candidateId: string): Promise<CandidateDetail | null> => {
      try {
        const item = await prisma.candidate.findUnique({
          where: { id: candidateId },
          include: {
            person: { include: { background: true } },
            politicalparty: {
              select: { id: true, name: true, acronym: true, logo_url: true },
            },
            electoraldistrict: {
              select: { id: true, name: true, code: true, is_national: true },
            },
          },
        });

        if (!item) return null;

        const cType = item.type;
        const isNational = item.electoraldistrict?.is_national || false;
        let positionCategory = item.type as string;
        if (cType === "PRESIDENTE") positionCategory = "PRESIDENTE";
        if (cType === "SENADOR") {
          positionCategory = isNational
            ? "SENADOR_NACIONAL"
            : "SENADOR_REGIONAL";
        }

        const ensureArray = (val: unknown) => (Array.isArray(val) ? val : []);

        const personWithBackground = {
          id: item.person.id,
          name: item.person.name,
          lastname: item.person.lastname,
          fullname: item.person.fullname,
          gender: item.person.gender,
          dni: item.person.dni,
          image_url: item.person.image_url,
          image_candidate_url: item.person.image_candidate_url,
          birth_date: item.person.birth_date,
          place_of_birth: item.person.place_of_birth,
          profession: item.person.profession,
          is_incumbent: item.person.is_incumbent ?? false,
          reinfo_status: item.person.reinfo_status ?? null,
          rnas_sanctions: parseRnasSanctions(item.person.rnas_sanctions),
          education_level: item.person.education_level,
          secondary_school: item.person.secondary_school,
          has_criminal_record: item.person.has_criminal_record,
          has_penal_sentence: item.person.has_penal_sentence,
          has_sanction: item.person.has_sanction,
          is_under_investigation: item.person.is_under_investigation,
          updated_at: item.person.updated_at,
          posturas: ensureArray(item.person.posturas),
          technical_education: ensureArray(item.person.technical_education),
          no_university_education: ensureArray(
            item.person.no_university_education,
          ),
          university_education: ensureArray(item.person.university_education),
          postgraduate_education: ensureArray(
            item.person.postgraduate_education,
          ),
          work_experience: ensureArray(item.person.work_experience),
          political_role: ensureArray(item.person.political_role),
          popular_election: ensureArray(item.person.popular_election),
          incomes: ensureArray(item.person.incomes),
          assets: ensureArray(item.person.assets),
          backgrounds: item.person.background,
        };

        let succession: CandidateSuccession | undefined = undefined;
        const successorRule =
          SUCCESSOR_TO_TARGET_MAP[item.type as candidacytype];

        if (
          successorRule &&
          (successorRule.expectedListNumber === undefined ||
            item.list_number === successorRule.expectedListNumber) &&
          item.active &&
          !DISQUALIFIED_STATUSES.includes(item.status as candidacystatus)
        ) {
          const titular = await prisma.candidate.findFirst({
            where: {
              electoral_process_id: item.electoral_process_id,
              political_party_id: item.political_party_id,
              electoral_district_id: item.electoral_district_id,
              type: successorRule.targetType,
            },
            select: {
              active: true,
              status: true,
              person: { select: { fullname: true } },
            },
          });

          if (
            !titular ||
            !titular.active ||
            DISQUALIFIED_STATUSES.includes(titular.status as candidacystatus)
          ) {
            let reason: SuccessionReason = "INACTIVO";
            if (titular?.status === "RENUNCIA") reason = "RENUNCIA";
            else if (titular?.status === "EXCLUIDO") reason = "EXCLUIDO";
            else if (titular?.status === "TACHADO") reason = "TACHADO";
            else if (titular?.status === "IMPROCEDENTE")
              reason = "IMPROCEDENTE";
            else if (titular?.status === "FALLECIMIENTO")
              reason = "FALLECIMIENTO";
            else if (titular && !titular.active) reason = "INACTIVO";

            succession = {
              target_type: successorRule.targetType as unknown as CandidacyType,
              original_candidate_name: titular?.person?.fullname ?? null,
              reason,
              legal_basis: successorRule.legalBasis,
            };
          }
        }

        return {
          id: item.id,
          person_id: item.person_id,
          active: item.active,
          political_party_id: item.political_party_id,
          electoral_district_id: item.electoral_district_id,
          type: item.type,
          list_number: item.list_number,
          status: item.status,
          position_category: positionCategory,
          person: personWithBackground,
          political_party: item.politicalparty,
          electoral_district: item.electoraldistrict,
          succession,
        } as unknown as CandidateDetail;
      } catch (error) {
        console.error("Error fetching candidate detail:", error);
        return null;
      }
    },
    ["candidate-detail"],
    { tags: [TAGS.candidates] },
  ),
);
