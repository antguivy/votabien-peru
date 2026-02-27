"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hitoSchema, type HitoFormValues } from "./validation";
import { extractErrorMessage } from "@/lib/error-handler";

export async function createTeamPhoto(data: HitoFormValues) {
  const supabase = await createClient();

  const validation = hitoSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const payload = {
      date: data.date,
      location: data.location,
      photo_url: data.photo_url || null,
      photo_description: data.photo_description,
      index: data.index,
      quote: data.quote,
      label: data.label || null,
    };

    const { error } = await supabase.from("hito").insert(payload);
    if (error) throw error;

    revalidatePath("/admin/hito");
    return { success: true, message: "Hito creado correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function updateTeamPhoto(id: number, data: HitoFormValues) {
  const supabase = await createClient();

  const validation = hitoSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const payload = {
      date: data.date,
      location: data.location,
      photo_url: data.photo_url || null,
      photo_description: data.photo_description,
      index: data.index,
      quote: data.quote,
      label: data.label || null,
    };

    const { error } = await supabase.from("hito").update(payload).eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/hito");
    return { success: true, message: "Hito actualizada correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function deleteHito(id: number) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("hito").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/hito");
    return { success: true };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}
