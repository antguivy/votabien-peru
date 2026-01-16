"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { BulkUpdateLegislatorsRequest } from "./types";
import { CreatePersonRequest, UpdatePersonRequest } from "@/interfaces/person";
import {
  CreateLegislatorPeriodRequest,
  UpdateLegislatorPeriodRequest,
} from "@/interfaces/legislator";
import { ChamberType, GroupChangeReason } from "@/interfaces/politics";
import { createId } from "@paralleldrive/cuid2";
import {
  type Database,
  type TablesInsert,
  type TablesUpdate,
} from "@/interfaces/supabase";
import z from "zod";

// Helper para manejo de errores tipado
const handleError = (error: unknown, msg: string) => {
  console.error(msg, error);
  return {
    success: false,
    error: error instanceof Error ? error.message : msg,
  };
};

// ============= PERSONAS =============

export async function createPerson(data: CreatePersonRequest) {
  const supabase = await createClient();
  try {
    const now = new Date().toISOString();
    const payload: TablesInsert<"person"> = {
      ...data,
      id: createId(),
      fullname: `${data.name} ${data.lastname}`,
      created_at: now,
      updated_at: now,
      detailed_biography: data.detailed_biography
        ? JSON.parse(JSON.stringify(data.detailed_biography))
        : undefined,
      work_experience: data.work_experience
        ? JSON.parse(JSON.stringify(data.work_experience))
        : undefined,
    };

    const { data: result, error } = await supabase
      .from("person")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/legisladores");
    return { success: true, data: result };
  } catch (error) {
    return handleError(error, "Error al crear persona");
  }
}

export async function updatePerson(
  personId: string,
  data: UpdatePersonRequest,
) {
  const supabase = await createClient();
  try {
    const payload: TablesUpdate<"person"> = {
      ...data,
      detailed_biography: data.detailed_biography
        ? JSON.parse(JSON.stringify(data.detailed_biography))
        : undefined,
      work_experience: data.work_experience
        ? JSON.parse(JSON.stringify(data.work_experience))
        : undefined,
    };

    const { data: result, error } = await supabase
      .from("person")
      .update(payload)
      .eq("id", personId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/legisladores");
    return { success: true, data: result };
  } catch (error) {
    return handleError(error, "Error al actualizar persona");
  }
}

// ============= LEGISLADORES =============
async function checkLegislatorOverlap(
  supabase: SupabaseClient<Database>,
  personId: string,
  chamber: ChamberType | undefined,
  startDate: string | undefined,
  endDate: string | null | undefined,
  excludeId?: string,
) {
  let query = supabase
    .from("legislator")
    .select("start_date, end_date")
    .eq("person_id", personId);

  if (chamber) {
    query = query.eq("chamber", chamber);
  }

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data: existingPeriods, error } = await query;

  if (error) throw error;

  if (existingPeriods && existingPeriods.length > 0) {
    if (!startDate) {
      throw new Error(
        "La fecha de inicio es requerida para validar solapamientos.",
      );
    }
    const newStart = new Date(startDate).getTime();
    const newEnd = endDate ? new Date(endDate).getTime() : 32503680000000; // Año ~3000

    for (const period of existingPeriods) {
      const pStart = new Date(period.start_date).getTime();
      const pEnd = period.end_date
        ? new Date(period.end_date).getTime()
        : 32503680000000;

      if (newStart <= pEnd && newEnd >= pStart) {
        throw new Error(
          `Ya existe un periodo legislativo que se solapa (${period.start_date} - ${period.end_date || "Presente"})`,
        );
      }
    }
  }
}

export async function createLegislatorPeriod(
  data: CreateLegislatorPeriodRequest,
) {
  const supabase = await createClient();
  try {
    await checkLegislatorOverlap(
      supabase,
      data.person_id,
      data.chamber,
      data.start_date,
      data.end_date,
    );

    // Tipado estricto para el insert
    const now = new Date().toISOString();
    const dbData: TablesInsert<"legislator"> = {
      id: createId(),
      person_id: data.person_id,
      chamber: data.chamber,
      electoral_district_id: data.electoral_district_id,
      elected_by_party_id: data.elected_by_party_id,
      condition: data.condition,
      start_date: data.start_date,
      end_date: data.end_date,
      institutional_email: data.institutional_email,
      active: data.active,
      created_at: now,
      updated_at: now,
    };

    const { data: result, error } = await supabase
      .from("legislator")
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/legisladores");
    return { success: true, data: result };
  } catch (error) {
    return handleError(error, "Error al crear periodo legislativo");
  }
}

export async function updateLegislatorPeriod(
  data: UpdateLegislatorPeriodRequest,
) {
  const supabase = await createClient();
  try {
    if (data.person_id) {
      await checkLegislatorOverlap(
        supabase,
        data.person_id,
        data.chamber,
        data.start_date,
        data.end_date,
        data.id,
      );
    }

    const { id, ...updateBody } = data;

    // Casting parcial seguro para update
    const payload: TablesUpdate<"legislator"> = updateBody;

    const { data: result, error } = await supabase
      .from("legislator")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/legisladores");
    return { success: true, data: result };
  } catch (error) {
    return handleError(error, "Error al actualizar periodo legislativo");
  }
}

export async function deleteLegislatorPeriod(legislatorId: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("legislator")
      .delete()
      .eq("id", legislatorId);

    if (error) throw error;

    revalidatePath("/admin/legisladores");
    return { success: true, data: { deleted_id: legislatorId } };
  } catch (error) {
    return handleError(error, "Error al eliminar periodo legislativo");
  }
}

export async function bulkUpdateLegislators(
  input: BulkUpdateLegislatorsRequest,
) {
  const supabase = await createClient();
  try {
    const payload: TablesUpdate<"legislator"> = { active: input.active };

    const { data, error } = await supabase
      .from("legislator")
      .update(payload)
      .in("id", input.ids)
      .select();

    if (error) throw error;

    revalidatePath("/admin/legisladores");

    return {
      data: { count: data.length, message: `Actualizados ${data.length}` },
      error: null,
    };
  } catch (error) {
    return handleError(error, "Error al actualizar legisladores");
  }
}

// ============= MEMBRESIAS PARLAMENTARIAS =============

const createSchema = z.object({
  parliamentary_group_id: z.string(),
  start_date: z.string(),
  change_reason: z.enum(GroupChangeReason),
  source_url: z.string().optional(),
});

type CreateMembershipInput = z.infer<typeof createSchema>;

export async function createParliamentaryMembership(
  legislator_id: string,
  rawData: CreateMembershipInput,
) {
  const supabase = await createClient();

  const validation = createSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Datos inválidos: " + validation.error.message,
    };
  }
  const data = validation.data;

  try {
    const { data: currentMembership } = await supabase
      .from("parliamentarymembership")
      .select("id")
      .eq("legislator_id", legislator_id)
      .is("end_date", null)
      .maybeSingle();

    let updatedRecord = null;

    if (currentMembership) {
      const { data: updated, error: updateError } = await supabase
        .from("parliamentarymembership")
        .update({ end_date: data.start_date })
        .eq("id", currentMembership.id)
        // Usamos el alias correcto para que el frontend reciba 'parliamentary_group'
        .select("*, parliamentary_group:parliamentarygroup(*)")
        .single();

      if (updateError)
        throw new Error(
          "Error al cerrar bancada anterior: " + updateError.message,
        );
      updatedRecord = updated;
    }

    const payload: TablesInsert<"parliamentarymembership"> = {
      id: createId(),
      legislator_id: legislator_id,
      parliamentary_group_id: data.parliamentary_group_id,
      start_date: data.start_date,
      change_reason: data.change_reason,
      source_url: data.source_url || null,
      end_date: null,
    };

    const { data: createdRecord, error: createError } = await supabase
      .from("parliamentarymembership")
      .insert(payload)
      .select("*, parliamentary_group:parliamentarygroup(*)")
      .single();

    if (createError) {
      console.error("Supabase Create Error:", createError);
      throw new Error(createError.message);
    }

    revalidatePath(`/admin/legisladores`);

    return {
      success: true,
      data: {
        created: createdRecord,
        updated: updatedRecord,
      },
    };
  } catch (error: unknown) {
    console.error("Error creating membership:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al crear membresía",
    };
  }
}

const updateSchema = z.object({
  id: z.string(),
  parliamentary_group_id: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  change_reason: z.enum(GroupChangeReason),
  source_url: z.union([z.string(), z.literal(""), z.null()]).optional(),
});

export async function updateParliamentaryMembership(
  legislator_id: string,
  rawData: z.infer<typeof updateSchema>,
) {
  const supabase = await createClient();

  const validation = updateSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Datos inválidos: " + validation.error.message,
    };
  }
  const data = validation.data;

  try {
    const payload: TablesUpdate<"parliamentarymembership"> = {
      parliamentary_group_id: data.parliamentary_group_id,
      start_date: data.start_date,
      end_date: data.end_date,
      change_reason: data.change_reason,
      source_url: data.source_url || null,
    };

    const { data: result, error } = await supabase
      .from("parliamentarymembership")
      .update(payload)
      .eq("id", data.id)
      .eq("legislator_id", legislator_id)
      // alias parliamentary_group para el frontend
      .select("*, parliamentary_group:parliamentarygroup(*)")
      .single();

    if (error) throw error;

    revalidatePath("/admin/legisladores");

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Error updating membership:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar",
    };
  }
}

export async function deleteParliamentaryMembership(
  legislator_id: string,
  membership_id: string,
) {
  const supabase = await createClient();

  try {
    const { data: membershipToDelete, error: fetchError } = await supabase
      .from("parliamentarymembership")
      .select("start_date, end_date")
      .eq("id", membership_id)
      .single();

    if (fetchError) throw new Error("No se encontró el registro a eliminar");

    const { error: deleteError } = await supabase
      .from("parliamentarymembership")
      .delete()
      .eq("id", membership_id)
      .eq("legislator_id", legislator_id);

    if (deleteError) throw deleteError;

    // Reabrir el anterior si el eliminado era el actual
    if (!membershipToDelete.end_date) {
      const { data: previousMembership } = await supabase
        .from("parliamentarymembership")
        .select("id")
        .eq("legislator_id", legislator_id)
        .order("start_date", { ascending: false })
        .limit(1)
        .single();

      if (previousMembership) {
        await supabase
          .from("parliamentarymembership")
          .update({ end_date: null })
          .eq("id", previousMembership.id);
      }
    }

    revalidatePath(`/admin/legisladores/${legislator_id}`);

    return { success: true, message: "Eliminado exitosamente" };
  } catch (error: unknown) {
    console.error("Error deleting membership:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar",
    };
  }
}
