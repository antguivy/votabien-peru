"use server";

import {
  BackgroundBase,
  BackgroundStatus,
  BackgroundType,
} from "@/interfaces/background";
import { BillBasic } from "@/interfaces/bill";
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
        attendances:attendance(*),
        parliamentary_memberships:parliamentarymembership(
          *,
          parliamentary_group:parliamentarygroup(*)
        )
      )
    `,
    )
    .eq("id", personaId)
    .eq("legislative_periods.active", true)
    .single();

  if (error || !data) {
    console.error("Error fetching legislador:", error);
    return null;
  }

  // 1. Casteamos 'data.legislative_periods' a nuestro tipo intermedio 'Raw'
  // para que TS sepa que tiene 'bill_authorships' y podamos hacer map() seguro.
  const rawPeriods =
    data.legislative_periods as unknown as RawLegislatorPeriod[];

  // 2. Realizamos solo las transformaciones necesarias (lógica de negocio)
  const periodsWithLogic = rawPeriods.map((period) => ({
    ...period,
    // Calculamos el status_group (colores del dashboard)
    bill_authorships: period.bill_authorships?.map((bill) => ({
      ...bill,
      status_group: getBillStatusGroup(bill.approval_status),
    })),
    // Ordenamos bancadas por fecha descendente
    parliamentary_memberships: period.parliamentary_memberships?.sort(
      (a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
    ),
  }));

  // 3. Construimos el resultado final usando spread operator (...)
  // Esto evita tener que escribir work_experience: data.work_experience, etc.
  const result = {
    ...data,
    legislative_periods: periodsWithLogic,
  };

  // 4. Doble cast seguro: "Esto es desconocido, pero confío en que coincide con la interfaz"
  return result as unknown as PersonDetailLegislator;
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
      active_candidacy:candidate!inner(
        *,
        electoral_process:electoralprocess(*),
        political_party:politicalparty(*),
        electoral_district:electoraldistrict(*)
      )
    `,
    )
    .eq("id", personaId)
    .eq("active_candidacy.active", true)
    .single();

  if (error) {
    console.error("Error fetching candidato detail:", error);
    return null;
  }

  if (!data) return null;
  const result = {
    ...data,
    active_candidacy: Array.isArray(data.active_candidacy)
      ? data.active_candidacy[0]
      : data.active_candidacy,
  };
  return result as unknown as PersonDetailCandidate;
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

  return (data || []) as unknown as PersonWithActivePeriod[];
}
