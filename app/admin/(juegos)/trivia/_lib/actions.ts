"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { triviaSchema, type TriviaFormValues } from "./validation";
import { TablesInsert, TablesUpdate } from "@/interfaces/supabase";
import { extractErrorMessage } from "@/lib/error-handler";

export async function createTrivia(data: TriviaFormValues) {
  const supabase = await createClient();

  const validation = triviaSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const payload: TablesInsert<"triviagame"> = {
      quote: data.quote,
      category: data.category,
      difficulty: data.difficulty,

      // Nuevos campos
      global_index: data.global_index,
      explanation: data.explanation || null,
      source_url: data.source_url || null,

      options: data.options,

      person_id: data.target_type === "PERSON" ? data.correct_answer_id : null,
      political_party_id:
        data.target_type === "PARTY" ? data.correct_answer_id : null,
    };

    const { error } = await supabase.from("triviagame").insert(payload);

    if (error) throw error;

    revalidatePath("/admin/trivia");
    return { success: true, message: "Trivia creada correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function updateTrivia(id: number, data: TriviaFormValues) {
  const supabase = await createClient();

  const validation = triviaSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const payload: TablesUpdate<"triviagame"> = {
      quote: data.quote,
      category: data.category,
      difficulty: data.difficulty,

      // Nuevos campos
      global_index: data.global_index,
      explanation: data.explanation || null,
      source_url: data.source_url || null,

      options: data.options,

      person_id: data.target_type === "PERSON" ? data.correct_answer_id : null,
      political_party_id:
        data.target_type === "PARTY" ? data.correct_answer_id : null,
    };

    const { error } = await supabase
      .from("triviagame")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/trivia");
    return { success: true, message: "Trivia actualizada correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function deleteTrivia(id: number) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("triviagame").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/trivia");
    return { success: true };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}
