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
    }: GetCandidatesParams): Promise<CandidateCard[]> => {
      try {
        const searchWords = search?.trim() ? parseSearchWords(search) : [];
        const hasSearch = searchWords.length > 0;

        const isPresidente = !hasSearch && type === "PRESIDENTE";

        const skip = isPresidente || hasSearch ? 0 : (page - 1) * pageSize;
        const take = isPresidente || hasSearch ? 100 : pageSize;

        const whereClause: Prisma.candidateWhereInput = { active: true };

        if (electoral_process_id)
          whereClause.electoral_process_id = electoral_process_id;
        if (ids && ids.length > 0) whereClause.id = { in: ids };

        if (!hasSearch && type) {
          switch (type) {
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
              if (districts && districts.length > 0)
                whereClause.electoraldistrict.name = { in: districts };
              break;
            case "DIPUTADO":
              whereClause.type = "DIPUTADO";
              if (districts && districts.length > 0)
                whereClause.electoraldistrict = { name: { in: districts } };
              break;
            case "PARLAMENTO_ANDINO":
              whereClause.type = "PARLAMENTO_ANDINO";
              whereClause.electoraldistrict = { is_national: true };
              break;
            default:
              whereClause.type = "PRESIDENTE";
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

        if (alerts && alerts.length > 0) {
          if (!whereClause.person) whereClause.person = {};
          if (alerts.includes("HAS_PENAL_SENTENCE"))
            whereClause.person.has_penal_sentence = false;
          if (alerts.includes("HAS_SANCTION"))
            whereClause.person.has_sanction = false;
          if (alerts.includes("EN_INVESTIGACION"))
            whereClause.person.is_under_investigation = false;
          if (alerts.includes("IS_INCUMBENT"))
            whereClause.person.is_incumbent = false;
        }

        const data = await prisma.candidate.findMany({
          where: whereClause,
          skip,
          take,
          orderBy: !isPresidente ? { list_number: "asc" } : undefined,
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
              rnas_sanctions:
                (p.rnas_sanctions as unknown as RnasSanction[] | null) ?? null,
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
    { tags: [TAGS.candidates] },
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
    ): Promise<CandidatePresidentials[]> => {
      try {
        const data = await prisma.candidate.findMany({
          where: {
            electoral_process_id: processId,
            political_party_id: partidoId,
            type: { in: ["VICEPRESIDENTE_1", "VICEPRESIDENTE_2"] },
          },
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
          orderBy: { list_number: "asc" },
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
        const data = await prisma.candidate.findUnique({
          where: { id: candidateId },
          include: {
            person: {
              include: { background: true },
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
            electoralprocess: true,
          },
        });

        if (!data) return null;

        // Remap to match expected type
        return {
          ...data,
          political_party: data.politicalparty,
          electoral_district: data.electoraldistrict,
          electoral_process: data.electoralprocess,
          person: {
            ...data.person,
            backgrounds: data.person.background,
          },
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
