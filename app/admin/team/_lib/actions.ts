"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { teamSchema, type TeamFormValues } from "./validation";
import { extractErrorMessage } from "@/lib/error-handler"; // Asumo que tienes esto
import { createId } from "@paralleldrive/cuid2";

export async function createTeam(data: TeamFormValues) {
  const supabase = await createClient();

  const validation = teamSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    // Convertir strings vacíos a null para la BD
    const payload = {
      id: createId(),
      first_name: data.first_name,
      last_name: data.last_name,
      image_url: data.image_url || null,
      role: data.role,
      email: data.email || null,
      phrase: data.phrase || null,
      linkedin_url: data.linkedin_url || null,
      portfolio_url: data.portfolio_url || null,
      is_principal: data.is_principal,
    };

    const { error } = await supabase.from("team").insert(payload);

    if (error) throw error;

    revalidatePath("/admin/team"); // Ajusta la ruta si es diferente
    return { success: true, message: "Miembro creado correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function updateTeam(id: string, data: TeamFormValues) {
  const supabase = await createClient();

  const validation = teamSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      image_url: data.image_url || null,
      role: data.role,
      email: data.email || null,
      phrase: data.phrase || null,
      linkedin_url: data.linkedin_url || null,
      portfolio_url: data.portfolio_url || null,
      is_principal: data.is_principal,
    };

    const { error } = await supabase.from("team").update(payload).eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/team");
    return { success: true, message: "Miembro actualizado correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function deleteTeam(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("team").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/team");
    return { success: true };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}
