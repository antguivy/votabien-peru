"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { triviaSchema, type TriviaFormValues } from "./validation";
import { extractErrorMessage } from "@/lib/error-handler";
import { serverRequireEditor } from "@/lib/auth-actions";

import { Prisma } from "@/prisma/generated/client";

export async function createTrivia(data: TriviaFormValues) {
  await serverRequireEditor();
  const validation = triviaSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const payload = {
      quote: data.quote,
      category: data.category,
      difficulty: data.difficulty,

      global_index: data.global_index,
      explanation: data.explanation || null,
      source_url: data.source_url || null,

      options: data.options as Prisma.InputJsonValue,

      person_id: data.target_type === "PERSON" ? data.correct_answer_id : null,
      political_party_id:
        data.target_type === "PARTY" ? data.correct_answer_id : null,
    };

    await prisma.triviagame.create({ data: payload });

    revalidatePath("/admin/trivia");
    return { success: true, message: "Trivia creada correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function updateTrivia(id: number, data: TriviaFormValues) {
  await serverRequireEditor();
  const validation = triviaSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const payload = {
      quote: data.quote,
      category: data.category,
      difficulty: data.difficulty,

      global_index: data.global_index,
      explanation: data.explanation || null,
      source_url: data.source_url || null,

      options: data.options as Prisma.InputJsonValue,

      person_id: data.target_type === "PERSON" ? data.correct_answer_id : null,
      political_party_id:
        data.target_type === "PARTY" ? data.correct_answer_id : null,
    };

    await prisma.triviagame.update({ where: { id: id }, data: payload });

    revalidatePath("/admin/trivia");
    return { success: true, message: "Trivia actualizada correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function deleteTrivia(id: number) {
  await serverRequireEditor();
  try {
    await prisma.triviagame.delete({ where: { id: id } });
    revalidatePath("/admin/trivia");
    return { success: true };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}
