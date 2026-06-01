import {
  FormulaCompareItem,
  FormulaComparison,
  FormulaMember,
} from "@/interfaces/comparator";
import { toJsonArray } from "@/lib/utils/text";
import {
  Assets,
  BiographyDetail,
  Incomes,
  NoUniversityEducation,
  PoliticalRole,
  PopularElection,
  PostgraduateEducation,
  TechnicalEducation,
  UniversityEducation,
  WorkExperience,
} from "@/interfaces/person";
import { BackgroundBase } from "@/interfaces/background";
import { CandidacyType } from "@/interfaces/candidate";
import { TAGS, TTL } from "@/lib/cache-tags";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

const FORMULA_TYPES = ["PRESIDENTE", "VICEPRESIDENTE_1", "VICEPRESIDENTE_2"];

export const getPresidentialFormulasComparison = cache(
  unstable_cache(
    async (presidentIds: string[]): Promise<FormulaComparison | null> => {
      if (!presidentIds || presidentIds.length < 2 || presidentIds.length > 4) {
        return null;
      }

      const uniqueIds = Array.from(new Set(presidentIds));

      try {
        const presidents = await prisma.candidate.findMany({
          where: {
            id: { in: uniqueIds },
            type: "PRESIDENTE",
            active: true,
          },
          select: {
            id: true,
            type: true,
            political_party_id: true,
            electoral_process_id: true,
            politicalparty: {
              select: {
                id: true,
                name: true,
                acronym: true,
                logo_url: true,
                color_hex: true,
              },
            },
            person: {
              select: { id: true, fullname: true },
            },
          },
        });

        if (!presidents || presidents.length === 0) {
          console.error("Error fetching presidents");
          return null;
        }

        const items: FormulaCompareItem[] = await Promise.all(
          uniqueIds.map(async (candidateId) => {
            const pres = presidents.find((p) => p.id === candidateId);

            if (!pres) {
              return {
                president_id: candidateId,
                president_name: null,
                status: "not_found" as const,
                message: `No se encontró candidato presidencial con ID ${candidateId}`,
                data: null,
              };
            }

            const formulaMembers = await prisma.candidate.findMany({
              where: {
                political_party_id: pres.political_party_id,
                electoral_process_id: pres.electoral_process_id,
                type: { in: FORMULA_TYPES as any },
                active: true,
              },
              select: {
                id: true,
                type: true,
                person: {
                  select: {
                    id: true,
                    dni: true,
                    fullname: true,
                    image_url: true,
                    image_candidate_url: true,
                    profession: true,
                    detailed_biography: true,
                    university_education: true,
                    postgraduate_education: true,
                    technical_education: true,
                    no_university_education: true,
                    work_experience: true,
                    popular_election: true,
                    political_role: true,
                    incomes: true,
                    assets: true,
                    secondary_school: true,
                    background: {
                      select: {
                        id: true,
                        publication_date: true,
                        type: true,
                        status: true,
                        title: true,
                        summary: true,
                        sanction: true,
                        source: true,
                        source_url: true,
                      },
                    },
                  },
                },
              },
            });

            if (!formulaMembers || formulaMembers.length === 0) {
              return {
                president_id: candidateId,
                president_name: pres.person?.fullname ?? null,
                status: "not_found" as const,
                message: "Error al cargar la fórmula",
                data: null,
              };
            }

            const mapMember = (raw: any): FormulaMember => ({
              id: raw.id,
              type: raw.type as FormulaMember["type"],
              person: {
                id: raw.person.id,
                dni: raw.person.dni,
                fullname: raw.person.fullname,
                image_url: raw.person.image_url,
                image_candidate_url: raw.person.image_candidate_url,
                profession: raw.person.profession,
                detailed_biography: toJsonArray<BiographyDetail>(
                  raw.person.detailed_biography,
                ),
                hoja_de_vida: {
                  university_education: toJsonArray<UniversityEducation>(
                    raw.person.university_education,
                  ),
                  postgraduate_education: toJsonArray<PostgraduateEducation>(
                    raw.person.postgraduate_education,
                  ),
                  technical_education: toJsonArray<TechnicalEducation>(
                    raw.person.technical_education,
                  ),
                  no_university_education: toJsonArray<NoUniversityEducation>(
                    raw.person.no_university_education,
                  ),
                  work_experience: toJsonArray<WorkExperience>(
                    raw.person.work_experience,
                  ),
                  popular_election: toJsonArray<PopularElection>(
                    raw.person.popular_election,
                  ),
                  political_role: toJsonArray<PoliticalRole>(
                    raw.person.political_role,
                  ),
                  incomes: toJsonArray<Incomes>(raw.person.incomes),
                  assets: toJsonArray<Assets>(raw.person.assets),
                  secondary_school: raw.person.secondary_school ?? false,
                },
              },
              backgrounds: raw.person.background as unknown as BackgroundBase[],
            });

            const presidentMember = formulaMembers.find(
              (m) => m.type === "PRESIDENTE",
            );
            const vp1Member = formulaMembers.find(
              (m) => m.type === "VICEPRESIDENTE_1",
            );
            const vp2Member = formulaMembers.find(
              (m) => m.type === "VICEPRESIDENTE_2",
            );

            if (!presidentMember) {
              return {
                president_id: candidateId,
                president_name: pres.person?.fullname ?? null,
                status: "not_found" as const,
                message: "No se encontró el presidente en la fórmula",
                data: null,
              };
            }

            return {
              president_id: candidateId,
              president_name: presidentMember.person.fullname,
              status: "available" as const,
              message: null,
              data: {
                president: mapMember(presidentMember),
                vp1: vp1Member ? mapMember(vp1Member) : null,
                vp2: vp2Member ? mapMember(vp2Member) : null,
                political_party: (pres.politicalparty as any) ?? null,
                electoral_process_id: pres.electoral_process_id,
              },
            };
          }),
        );

        const totalAvailable = items.filter(
          (i) => i.status === "available",
        ).length;

        return {
          total_requested: uniqueIds.length,
          total_available: totalAvailable,
          comparison_date: new Date().toISOString(),
          items,
        };
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    ["presidential-formulas-comparison"],
    {
      tags: [TAGS.candidates, TAGS.parties],
      revalidate: TTL.static,
    },
  ),
);
