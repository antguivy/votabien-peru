"use server";

import {
  BackgroundBase,
  BackgroundStatus,
  BackgroundType,
} from "@/interfaces/background";
import { BillBase, BillBasic } from "@/interfaces/bill";
import { LegislatorDetail } from "@/interfaces/legislator";
import {
  Assets,
  BiographyDetail,
  Incomes,
  NoUniversityEducation,
  PersonDetailCandidate,
  PersonDetailLegislator,
  PersonWithActivePeriod,
  PoliticalRole,
  PopularElection,
  PostgraduateEducation,
  TechnicalEducation,
  UniversityEducation,
  WorkExperience,
} from "@/interfaces/person";
import { createClient } from "@/lib/supabase/server";
import { getBillStatusGroup } from "@/lib/utils-bill";

type RawBill = Omit<BillBasic, "status_group">;
type RawLegislatorPeriod = Omit<LegislatorDetail, "bill_authorships"> & {
  bill_authorships: RawBill[];
};

export async function getPersonaAsLegisladorById(
  personaId: string,
): Promise<PersonDetailLegislator | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("person")
    .select(
      `
      *,
      backgrounds:background(*), 
      legislative_periods:legislator(
        *,
        elected_by_party:politicalparty(*),
        electoral_district:electoraldistrict(*),
        bill_authorships:bill(*),
        attendances:attendance(*)
      )
    `,
    )
    .eq("id", personaId)
    .single();

  if (error || !data) return null;

  // Transformación ligera
  const transformedData: PersonDetailLegislator = {
    ...data,
    // 1. Corregimos el problema de los campos JSON que TypeScript marca como incompatibles
    detailed_biography:
      (data.detailed_biography as unknown as BiographyDetail[]) ?? [],
    work_experience:
      (data.work_experience as unknown as WorkExperience[]) ?? [],
    assets: (data.assets as unknown as Assets[]) ?? [],
    incomes: (data.incomes as unknown as Incomes[]) ?? [],
    technical_education:
      (data.technical_education as unknown as TechnicalEducation[]) ?? [],
    no_university_education:
      (data.no_university_education as unknown as NoUniversityEducation[]) ??
      [],
    university_education:
      (data.university_education as unknown as UniversityEducation[]) ?? [],
    postgraduate_education:
      (data.postgraduate_education as unknown as PostgraduateEducation[]) ?? [],
    political_role: (data.political_role as unknown as PoliticalRole[]) ?? [],
    popular_election:
      (data.popular_election as unknown as PopularElection[]) ?? [],

    // 2. Mantenemos tu lógica de backgrounds
    backgrounds: (data.backgrounds || []).map(
      (bg): BackgroundBase => ({
        ...bg,
        type: bg.type as BackgroundType,
        status: bg.status as BackgroundStatus,
        summary: bg.summary ?? "",
      }),
    ),

    // 3. Mantenemos tu lógica de periodos legislativos
    legislative_periods: (
      (data.legislative_periods as RawLegislatorPeriod[]) || []
    ).map(
      (period: RawLegislatorPeriod): LegislatorDetail => ({
        ...period,
        bill_authorships: (period.bill_authorships || []).map(
          (bill: RawBill): BillBasic => ({
            ...bill,
            status_group: getBillStatusGroup(bill.approval_status),
          }),
        ),
      }),
    ),
  };
  return transformedData;
}

// CONSULTA PARA CANDIDATOS
export async function getPersonaAsCandidatoById(
  personaId: string,
): Promise<PersonDetailCandidate | null> {
  const supabase = await createClient();

  const TABLE_NAME = "person";
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      `
      *,
      backgrounds:background(*),
      candidacies:candidate(
        *,
        electoral_process:electoralprocess(*),
        political_party:politicalparty(*),
        electoral_district:electoraldistrict(*)
      )
    `,
    )
    .eq("id", personaId)
    .single();

  if (error) {
    console.error("Error fetching candidato detail:", error);
    return null;
  }

  if (!data) return null;

  return data as unknown as PersonDetailCandidate;
}

interface GetPersonasParams {
  search: string;
  limit?: number;
  skip?: number;
}

export async function getPersonas({
  search,
  limit = 10,
  skip = 0,
}: GetPersonasParams): Promise<PersonWithActivePeriod[]> {
  const supabase = await createClient();

  // Limpiamos la búsqueda para evitar espacios vacíos
  const searchTerm = search.trim();

  if (!searchTerm) return [];

  const { data, error } = await supabase
    .from("person")
    .select("*")
    .ilike("fullname", `%${searchTerm}%`)
    .order("fullname", { ascending: true })
    .range(skip, skip + limit - 1);

  if (error) {
    console.error("Error searching personas:", error);
    return [];
  }

  // Retornamos los datos.
  // Nota: Hacemos el cast porque PersonWithActivePeriod suele tener campos extras
  // que aquí no estamos calculando, pero para el "Selector" la info básica basta.
  return (data || []) as unknown as PersonWithActivePeriod[];
}
