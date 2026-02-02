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

// Helper para manejo de errores tipado
const handleError = (error: unknown, msg: string) => {
  console.error(msg, error);
  return {
    success: false,
    error: error instanceof Error ? error.message : msg,
  };
};

// ============= LEGISLADORES =============
async function checkLegislatorOverlap(
  supabase: SupabaseClient<Database>,
  personId: string,
  type: CandidacyType | undefined,
) {
  let query = supabase
    .from("candidate")
    .select("status, active")
    .eq("active", true)
    .eq("person_id", personId);

  if (type) {
    query = query.eq("type", type);
  }

  const { data: existingCandidate, error } = await query;

  if (error) throw error;

  if (existingCandidate && existingCandidate.length > 0) {
    for (const cand of existingCandidate) {
      if (cand.active && cand.status === status) {
        throw new Error(`Ya existe una Candidatura activa que se solapa.`);
      }
    }
  }
}

export async function createCandidatePeriod(
  data: CreateCandidatePeriodRequest,
) {
  const supabase = await createClient();
  try {
    await checkLegislatorOverlap(supabase, data.person_id, data.type);

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

    if (error) throw error;

    revalidatePath("/admin/candidatos");
    return { success: true, data: result };
  } catch (error) {
    return handleError(error, "Error al crear periodo legislativo");
  }
}

export async function updateCandidatePeriod(
  data: UpdateCandidatePeriodRequest,
) {
  const supabase = await createClient();
  try {
    const { id, ...updateBody } = data;

    const payload: TablesUpdate<"candidate"> = updateBody;

    const { data: result, error } = await supabase
      .from("candidate")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/candidatos");
    return { success: true, data: result };
  } catch (error) {
    return handleError(error, "Error al actualizar candidatura");
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
