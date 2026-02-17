"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { CandidacyType } from "@/interfaces/politics";
import { createId } from "@paralleldrive/cuid2";
import {
  type Database,
  type TablesInsert,
  type TablesUpdate,
} from "@/interfaces/supabase";
import { BulkUpdateCandidatesRequest } from "./types";
import {
  CreateCandidatePeriodRequest,
  UpdateCandidatePeriodRequest,
} from "@/interfaces/candidate";
import { extractErrorMessage } from "@/lib/error-handler";

// Helper para manejo de errores tipado
const handleError = (error: unknown, msg: string) => {
  console.error(msg, error);
  return {
    success: false,
    error: error instanceof Error ? error.message : msg,
  };
};

const EXECUTIVE_TYPES = new Set<CandidacyType>([
  CandidacyType.PRESIDENTE,
  CandidacyType.VICEPRESIDENTE_1,
  CandidacyType.VICEPRESIDENTE_2,
]);

function isExecutiveType(type: CandidacyType): boolean {
  return EXECUTIVE_TYPES.has(type);
}

/**
 * Verifica si la combinación de candidaturas está permitida
 * REGLA: Solo PRESIDENTE/VICE pueden ser también SENADOR (Nacional)
 */
function isCombinationAllowed(
  existingType: CandidacyType,
  newType: CandidacyType,
): boolean {
  if (existingType === newType) return false;

  if (
    (isExecutiveType(existingType) && newType === CandidacyType.SENADOR) ||
    (isExecutiveType(existingType) && newType === CandidacyType.DIPUTADO)
  ) {
    return true;
  }

  if (existingType === CandidacyType.SENADOR && isExecutiveType(newType)) {
    return true;
  }

  return false;
}

// ============= VALIDACIONES =============
async function checkCandidacyOverlap(
  supabase: SupabaseClient<Database>,
  personId: string,
  processId: string,
  type: CandidacyType,
  districtId: string,
  excludeCandidateId?: string,
) {
  const { data: nationalDistrict } = await supabase
    .from("electoraldistrict")
    .select("id")
    .ilike("name", "%nacional%")
    .single();

  const nationalDistrictId = nationalDistrict?.id || "";

  let query = supabase
    .from("candidate")
    .select("id, type, electoral_district_id")
    .eq("active", true)
    .eq("person_id", personId)
    .eq("electoral_process_id", processId);

  if (excludeCandidateId) {
    query = query.neq("id", excludeCandidateId);
  }

  const { data: existingCandidates, error } = await query;

  if (error) throw new Error(error.message);

  if (!existingCandidates || existingCandidates.length === 0) {
    return; // No hay candidaturas previas, OK
  }

  // 3. Verificar si ya tiene una candidatura del mismo tipo
  const sameTypeExists = existingCandidates.some((c) => c.type === type);
  if (sameTypeExists) {
    throw new Error(
      `Esta persona ya está registrada como ${type} en este proceso electoral.`,
    );
  }

  // 4. Verificar combinaciones permitidas
  for (const existing of existingCandidates) {
    const isAllowed = isCombinationAllowed(
      existing.type as CandidacyType,
      type,
    );

    if (!isAllowed) {
      throw new Error(
        `Esta persona ya tiene una candidatura como ${existing.type}. ` +
          `Solo las candidaturas de PRESIDENTE/VICEPRESIDENTE pueden combinarse con SENADOR (Distrito Nacional).`,
      );
    }
  }
}

export async function createCandidatePeriod(
  data: CreateCandidatePeriodRequest,
) {
  const supabase = await createClient();
  try {
    await checkCandidacyOverlap(
      supabase,
      data.person_id,
      data.electoral_process_id,
      data.type,
      data.electoral_district_id,
    );

    const { data: districtExists } = await supabase
      .from("electoraldistrict")
      .select("id")
      .eq("id", data.electoral_district_id)
      .single();

    if (!districtExists) {
      throw new Error(
        "El distrito electoral seleccionado no existe o fue eliminado",
      );
    }

    const dbData: TablesInsert<"candidate"> = {
      id: createId(),
      person_id: data.person_id,
      type: data.type,
      electoral_district_id: data.electoral_district_id,
      political_party_id: data.political_party_id,
      status: data.status,
      list_number: data.list_number,
      active: data.active,
      electoral_process_id: data.electoral_process_id,
    };

    const { data: result, error } = await supabase
      .from("candidate")
      .insert(dbData)
      .select()
      .single();

    if (error) {
      if (error.code === "23503") {
        throw new Error(
          "Uno de los datos seleccionados no es válido. Verifique el distrito electoral, partido político y proceso electoral.",
        );
      }
      throw error;
    }

    revalidatePath("/admin/candidatos");
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}

export async function updateCandidatePeriod(
  data: UpdateCandidatePeriodRequest,
) {
  const supabase = await createClient();
  try {
    const { id, ...updateBody } = data;

    if (
      updateBody.person_id &&
      updateBody.electoral_process_id &&
      updateBody.type &&
      updateBody.electoral_district_id
    ) {
      await checkCandidacyOverlap(
        supabase,
        updateBody.person_id,
        updateBody.electoral_process_id,
        updateBody.type,
        updateBody.electoral_district_id,
        id,
      );
    }

    const payload: TablesUpdate<"candidate"> = updateBody;

    const { data: result, error } = await supabase
      .from("candidate")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23503") {
        throw new Error(
          "Uno de los datos seleccionados no es válido. Verifique el distrito electoral, partido político y proceso electoral.",
        );
      }
      throw error;
    }

    revalidatePath("/admin/candidatos");
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error),
    };
  }
}

export async function deleteCandidatePeriod(candidateId: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("candidate")
      .delete()
      .eq("id", candidateId);

    if (error) throw error;

    revalidatePath("/admin/candidatos");
    return { success: true, data: { deleted_id: candidateId } };
  } catch (error) {
    return handleError(error, "Error al eliminar candidato");
  }
}

export async function bulkUpdateCandidates(input: BulkUpdateCandidatesRequest) {
  const supabase = await createClient();
  try {
    const payload: TablesUpdate<"candidate"> = { active: input.active };

    const { data, error } = await supabase
      .from("candidate")
      .update(payload)
      .in("id", input.ids)
      .select();

    if (error) throw error;

    revalidatePath("/admin/candidatos");

    return {
      data: { count: data.length, message: `Actualizados ${data.length}` },
      error: null,
    };
  } catch (error) {
    return handleError(error, "Error al actualizar candidatos");
  }
}
