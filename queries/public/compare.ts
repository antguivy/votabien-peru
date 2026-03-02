"use server";

import { createClient } from "@/lib/supabase/server";
import {
  FormulaCompareItem,
  FormulaComparison,
  FormulaMember,
} from "@/interfaces/comparator";
import { CandidacyType } from "@/interfaces/politics";
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

const FORMULA_TYPES = [
  CandidacyType.PRESIDENTE,
  CandidacyType.VICEPRESIDENTE_1,
  CandidacyType.VICEPRESIDENTE_2,
];

const PERSON_SELECT = `
  id,
  dni,
  fullname,
  image_url,
  image_candidate_url,
  profession,
  detailed_biography,
  university_education,
  postgraduate_education,
  technical_education,
  no_university_education,
  work_experience,
  popular_election,
  political_role,
  incomes,
  assets,
  secondary_school,
  backgrounds:background (
    id,
    publication_date,
    type,
    status,
    title,
    summary,
    sanction,
    source,
    source_url
  )
`;

/**
 * Recibe IDs de candidaturas presidenciales (candidate.id, NO dni).
 * Devuelve la fórmula completa (presidente + VP1 + VP2) para cada una.
 */
export async function getPresidentialFormulasComparison(
  presidentIds: string[],
): Promise<FormulaComparison | null> {
  const supabase = await createClient();

  if (!presidentIds || presidentIds.length < 2 || presidentIds.length > 4) {
    return null;
  }

  const uniqueIds = Array.from(new Set(presidentIds));

  // PASO 1: Buscar presidentes por candidate.id para obtener party + process
  const { data: presidents, error: presError } = await supabase
    .from("candidate")
    .select(
      `
      id,
      type,
      political_party_id,
      electoral_process_id,
      politicalparty ( id, name, acronym, logo_url, color_hex ),
      person:person_id!inner ( id, fullname )
    `,
    )
    .in("id", uniqueIds)
    .eq("type", CandidacyType.PRESIDENTE)
    .eq("active", true);

  if (presError || !presidents || presidents.length === 0) {
    console.error("Error fetching presidents:", presError);
    return null;
  }

  // PASO 2: Por cada presidente, traer la fórmula completa
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

      const { data: formulaMembers, error: formulaError } = await supabase
        .from("candidate")
        .select(
          `
          id,
          type,
          person:person_id!inner (
            ${PERSON_SELECT}
          )
        `,
        )
        .eq("political_party_id", pres.political_party_id)
        .eq("electoral_process_id", pres.electoral_process_id)
        .in("type", FORMULA_TYPES)
        .eq("active", true);

      if (formulaError || !formulaMembers) {
        console.error(
          `Error fetching formula for party ${pres.political_party_id}:`,
          formulaError,
        );
        return {
          president_id: candidateId,
          president_name: pres.person?.fullname ?? null,
          status: "not_found" as const,
          message: "Error al cargar la fórmula",
          data: null,
        };
      }

      const mapMember = (
        raw: (typeof formulaMembers)[number],
      ): FormulaMember => ({
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
        backgrounds: raw.person.backgrounds as BackgroundBase[],
      });

      const presidentMember = formulaMembers.find(
        (m) => m.type === CandidacyType.PRESIDENTE,
      );
      const vp1Member = formulaMembers.find(
        (m) => m.type === CandidacyType.VICEPRESIDENTE_1,
      );
      const vp2Member = formulaMembers.find(
        (m) => m.type === CandidacyType.VICEPRESIDENTE_2,
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
          political_party: pres.politicalparty ?? null,
          electoral_process_id: pres.electoral_process_id,
        },
      };
    }),
  );

  const totalAvailable = items.filter((i) => i.status === "available").length;

  return {
    total_requested: uniqueIds.length,
    total_available: totalAvailable,
    comparison_date: new Date().toISOString(),
    items,
  };
}
