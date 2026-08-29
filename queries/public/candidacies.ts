import {
  CandidacyStatus,
  CandidacyType,
  CandidateCard,
  CandidateDetail,
  CandidatePresidentials,
} from "@/interfaces/candidate";
import { RnasSanction } from "@/interfaces/person";
import { TAGS, TTL } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { Prisma } from "@/prisma/generated/client";
import { cache } from "react";

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
}

function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u0302\u0304-\u036f]/g, "")
    .normalize("NFC")
    .trim();
}

function parseSearchWords(search: string): string[] {
  return normalizeSearchTerm(search)
    .split(/\s+/)
    .filter((w) => w.length >= 2);
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

    if (type === "GOBERNADOR_REGIONAL" || type === "VICEGOBERNADOR_REGIONAL") {
      const depSearch = parentName || baseName;
      orConditions.push(
        { id: cleanD },
        { code: cleanD },
        { children: { some: { id: cleanD } } },
        { children: { some: { children: { some: { id: cleanD } } } } },
        { children: { some: { code: cleanD } } },
        { children: { some: { children: { some: { code: cleanD } } } } },
      );
      if (cleanD.toUpperCase() === "LIMA") {
        orConditions.push(
          { code: "LMP" },
          {
            name: { contains: "LIMA PROVINCIAS", mode: "insensitive" as const },
          },
        );
      } else {
        orConditions.push(
          { name: { equals: depSearch, mode: "insensitive" as const } },
          { name: { contains: depSearch, mode: "insensitive" as const } },
        );
      }
    } else if (type === "CONSEJERO_REGIONAL") {
      const depSearch = parentName || baseName;
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
      );
      if (cleanD.toUpperCase() === "LIMA") {
        orConditions.push(
          { parent: { code: "LMP" } },
          {
            parent: {
              name: { contains: "LIMA", mode: "insensitive" as const },
            },
          },
        );
      } else {
        orConditions.push(
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
      orConditions.push(
        { id: cleanD },
        { code: cleanD },
        // Si cleanD es un distrito, encontrar su provincia padre:
        { children: { some: { id: cleanD } } },
        { children: { some: { code: cleanD } } },
        // Si cleanD es una región, encontrar todas sus provincias hijas:
        { parent_id: cleanD },
        { parent: { code: cleanD } },
      );
      if (cleanD.toUpperCase() === "LIMA") {
        orConditions.push(
          { code: "LIM" },
          { parent: { code: "LMP" } },
          { name: { contains: "LIMA", mode: "insensitive" as const } },
        );
      } else {
        orConditions.push(
          { name: { equals: baseName, mode: "insensitive" as const } },
          {
            name: { startsWith: baseName + " -", mode: "insensitive" as const },
          },
          ...(parentName
            ? [{ name: { contains: parentName, mode: "insensitive" as const } }]
            : []),
        );
      }
    } else if (type === "ALCALDE_DISTRITAL" || type === "REGIDOR_DISTRITAL") {
      orConditions.push(
        { id: cleanD },
        { code: cleanD },
        { ubigeo: cleanD },
        // Si cleanD es una provincia, encontrar todos sus distritos hijos:
        { parent_id: cleanD },
        { parent: { code: cleanD } },
        // Si cleanD es una región, encontrar todos sus distritos nietos:
        { parent: { parent_id: cleanD } },
        { parent: { parent: { code: cleanD } } },
      );
      if (cleanD.toUpperCase() === "LIMA") {
        orConditions.push(
          { parent: { code: "LIM" } },
          { parent: { parent: { code: "LMP" } } },
        );
      } else {
        orConditions.push(
          { name: { equals: baseName, mode: "insensitive" as const } },
          {
            name: { startsWith: baseName + " -", mode: "insensitive" as const },
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

export const getCandidatesCards = cache(
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
    }: GetCandidatesParams): Promise<CandidateCard[]> => {
      try {
        const searchWords = search?.trim() ? parseSearchWords(search) : [];
        const hasSearch = searchWords.length > 0;

        const isExecutive =
          !hasSearch &&
          (type === "GOBERNADOR_REGIONAL" ||
            type === "ALCALDE_PROVINCIAL" ||
            type === "ALCALDE_DISTRITAL" ||
            type === "PRESIDENTE");

        const skip = hasSearch ? 0 : (page - 1) * pageSize;
        const take = hasSearch ? 100 : pageSize;

        const whereClause: Prisma.candidateWhereInput = { active: true };

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

        if (hasSearch) {
          whereClause.person = {
            OR: searchWords.map((word) => ({
              OR: [
                { name: { contains: word, mode: "insensitive" } },
                { lastname: { contains: word, mode: "insensitive" } },
              ],
            })),
          };
        }

        // Filtro ético (Sin sentencias penales ni civiles)
        if (no_sentencias || (alerts && alerts.includes("NO_SENTENCIAS"))) {
          if (!whereClause.person) whereClause.person = {};
          whereClause.person.has_penal_sentence = false;
          whereClause.person.has_sanction = false;
        }

        // Filtro de experiencia laboral mínima
        if (min_work && min_work > 0) {
          if (!whereClause.person) whereClause.person = {};
          whereClause.person.work_experience_count = { gte: min_work };
        }

        // Filtro de nivel de estudios
        if (education && education !== "all") {
          if (!whereClause.person) whereClause.person = {};
          if (education === "universitaria") {
            whereClause.person.education_level = { gte: 2 };
          } else if (education === "tecnica") {
            whereClause.person.education_level = { gte: 1 };
          } else if (education === "secundaria") {
            whereClause.person.secondary_school = true;
          }
        }

        const data = await prisma.candidate.findMany({
          where: whereClause,
          skip,
          take,
          orderBy: !isExecutive ? { list_number: "asc" } : undefined,
          select: {
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
          },
        });

        return data.map((candidate) => {
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
              is_under_investigation:
                (p.is_under_investigation as boolean) ?? false,
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
                (candidate.politicalparty
                  ?.foundation_date as unknown as string) ?? null,
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
        });
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    ["candidates-cards-list"],
    {
      tags: [TAGS.candidates],
      revalidate: TTL.static,
    },
  ),
);

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
