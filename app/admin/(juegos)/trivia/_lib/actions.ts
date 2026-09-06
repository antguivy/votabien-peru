"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  triviaSchema,
  type TriviaFormValues,
  topicSchema,
  type TopicFormValues,
  audienceSchema,
  type AudienceFormValues,
} from "./validation";
import { extractErrorMessage } from "@/lib/error-handler";
import { serverRequireEditor, serverRequireReviewer } from "@/lib/auth-actions";
import { Prisma } from "@/prisma/generated/client";

// =========================================================================
// 1. TRIVIA QUESTIONS CRUD
// =========================================================================

export async function createTrivia(data: TriviaFormValues) {
  const { user } = await serverRequireReviewer();
  const canPublishDirectly = Boolean(
    user?.role &&
      ["lead", "editor", "admin", "super_admin"].includes(user.role),
  );

  const validation = triviaSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const { audience_ids, ...fields } = validation.data;

    const personId =
      fields.display_type === "PERSON"
        ? fields.correct_answer_id
        : fields.person_id || null;
    const politicalPartyId =
      fields.display_type === "PARTY"
        ? fields.correct_answer_id
        : fields.political_party_id || null;

    const created = await prisma.triviagame.create({
      data: {
        topic_id: fields.topic_id || null,
        quote: fields.quote,
        title: fields.title || null,
        category: fields.category,
        difficulty: fields.difficulty,
        display_type: fields.display_type,
        correct_answer_id: fields.correct_answer_id,
        global_index: BigInt(fields.global_index),
        explanation: fields.explanation || null,
        source_url: fields.source_url || null,
        image_url: fields.image_url || null,
        is_published: canPublishDirectly ? fields.is_published : false,
        options: fields.options as Prisma.InputJsonValue,
        person_id: personId,
        political_party_id: politicalPartyId,
      },
    });

    if (audience_ids && audience_ids.length > 0) {
      await prisma.triviagame_audience.createMany({
        data: audience_ids.map((audId) => ({
          question_id: created.id,
          audience_id: audId,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/admin/trivia");
    revalidatePath("/trivia");
    return {
      success: true,
      message: "Pregunta creada correctamente",
      id: Number(created.id),
    };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function updateTrivia(id: number, data: TriviaFormValues) {
  const { user } = await serverRequireReviewer();
  const canPublishDirectly = Boolean(
    user?.role &&
      ["lead", "editor", "admin", "super_admin"].includes(user.role),
  );

  const validation = triviaSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const { audience_ids, ...fields } = validation.data;

    const personId =
      fields.display_type === "PERSON"
        ? fields.correct_answer_id
        : fields.person_id || null;
    const politicalPartyId =
      fields.display_type === "PARTY"
        ? fields.correct_answer_id
        : fields.political_party_id || null;

    await prisma.triviagame.update({
      where: { id: BigInt(id) },
      data: {
        topic_id: fields.topic_id || null,
        quote: fields.quote,
        title: fields.title || null,
        category: fields.category,
        difficulty: fields.difficulty,
        display_type: fields.display_type,
        correct_answer_id: fields.correct_answer_id,
        global_index: BigInt(fields.global_index),
        explanation: fields.explanation || null,
        source_url: fields.source_url || null,
        image_url: fields.image_url || null,
        is_published: canPublishDirectly ? fields.is_published : false,
        options: fields.options as Prisma.InputJsonValue,
        person_id: personId,
        political_party_id: politicalPartyId,
      },
    });

    // Sincronizar audiencias
    await prisma.triviagame_audience.deleteMany({
      where: { question_id: BigInt(id) },
    });

    if (audience_ids && audience_ids.length > 0) {
      await prisma.triviagame_audience.createMany({
        data: audience_ids.map((audId) => ({
          question_id: BigInt(id),
          audience_id: audId,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/admin/trivia");
    revalidatePath("/trivia");
    return { success: true, message: "Pregunta actualizada correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function togglePublishTrivia(id: number, is_published: boolean) {
  const { user } = await serverRequireReviewer();
  const canPublishDirectly = Boolean(
    user?.role &&
      ["lead", "editor", "admin", "super_admin"].includes(user.role),
  );
  if (!canPublishDirectly) {
    return {
      success: false,
      error:
        "Solo el equipo de coordinación o moderación puede cambiar el estado de publicación.",
    };
  }

  try {
    await prisma.triviagame.update({
      where: { id: BigInt(id) },
      data: { is_published },
    });
    revalidatePath("/admin/trivia");
    revalidatePath("/trivia");
    return {
      success: true,
      message: is_published
        ? "Pregunta publicada"
        : "Pregunta movida a borrador",
    };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function bulkPublishTrivias(ids: number[]) {
  const { user } = await serverRequireReviewer();
  const canPublishDirectly = Boolean(
    user?.role &&
      ["lead", "editor", "admin", "super_admin"].includes(user.role),
  );
  if (!canPublishDirectly) {
    return {
      success: false,
      error:
        "Solo el equipo de coordinación o moderación puede aprobar y publicar preguntas.",
    };
  }

  try {
    if (!ids || ids.length === 0) {
      return { success: false, error: "No se seleccionaron preguntas" };
    }
    const bigIntIds = ids.map((id) => BigInt(id));
    await prisma.triviagame.updateMany({
      where: { id: { in: bigIntIds } },
      data: { is_published: true },
    });
    revalidatePath("/admin/trivia");
    revalidatePath("/trivia");
    return {
      success: true,
      message: `Se publicaron y aprobaron ${ids.length} preguntas correctamente`,
    };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function bulkUnpublishTrivias(ids: number[]) {
  const { user } = await serverRequireReviewer();
  const canPublishDirectly = Boolean(
    user?.role &&
      ["lead", "editor", "admin", "super_admin"].includes(user.role),
  );
  if (!canPublishDirectly) {
    return {
      success: false,
      error:
        "Solo el equipo de coordinación o moderación puede mover preguntas a borrador.",
    };
  }

  try {
    if (!ids || ids.length === 0) {
      return { success: false, error: "No se seleccionaron preguntas" };
    }
    const bigIntIds = ids.map((id) => BigInt(id));
    await prisma.triviagame.updateMany({
      where: { id: { in: bigIntIds } },
      data: { is_published: false },
    });
    revalidatePath("/admin/trivia");
    revalidatePath("/trivia");
    return {
      success: true,
      message: `Se movieron ${ids.length} preguntas a borrador`,
    };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function duplicateTrivia(id: number) {
  await serverRequireReviewer();
  try {
    const original = await prisma.triviagame.findUnique({
      where: { id: BigInt(id) },
      include: {
        audiences: true,
      },
    });

    if (!original) {
      return { success: false, error: "Pregunta no encontrada" };
    }

    // Obtener siguiente global_index
    const maxIndex = await prisma.triviagame.aggregate({
      _max: { global_index: true },
    });
    const nextIndex = (maxIndex._max.global_index ?? BigInt(0)) + BigInt(1);

    const created = await prisma.triviagame.create({
      data: {
        topic_id: original.topic_id,
        quote: `${original.quote} (Copia)`,
        title: original.title ? `${original.title} (Copia)` : null,
        category: original.category,
        difficulty: original.difficulty,
        display_type: original.display_type,
        correct_answer_id: original.correct_answer_id,
        global_index: nextIndex,
        explanation: original.explanation,
        source_url: original.source_url,
        image_url: original.image_url,
        is_published: false, // Inicia como borrador
        options: original.options as Prisma.InputJsonValue,
        person_id: original.person_id,
        political_party_id: original.political_party_id,
      },
    });

    if (original.audiences.length > 0) {
      await prisma.triviagame_audience.createMany({
        data: original.audiences.map((a) => ({
          question_id: created.id,
          audience_id: a.audience_id,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/admin/trivia");
    revalidatePath("/trivia");
    return { success: true, message: "Pregunta duplicada como borrador" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function deleteTrivia(id: number) {
  await serverRequireEditor();
  try {
    await prisma.triviagame.delete({ where: { id: BigInt(id) } });
    revalidatePath("/admin/trivia");
    revalidatePath("/trivia");
    return { success: true, message: "Pregunta eliminada" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export interface BulkImportFailure {
  index: number; // índice en el JSON de origen (0-based)
  preview: string; // fragmento del enunciado para ubicar la fila
  error: string; // motivo de validación
}

export async function bulkImportTrivias(
  questionsList: TriviaFormValues[],
  targetTopicId?: string,
  targetAudienceIds?: string[],
  isPublished = false, // por defecto se importa como BORRADOR para revisión
) {
  await serverRequireReviewer();
  try {
    const failures: BulkImportFailure[] = [];
    let createdCount = 0;
    const maxIndexAgg = await prisma.triviagame.aggregate({
      _max: { global_index: true },
    });
    let currentIndex = Number(maxIndexAgg._max.global_index ?? 0);

    for (const [rowIndex, q] of questionsList.entries()) {
      const validation = triviaSchema.safeParse({
        ...q,
        topic_id: targetTopicId || q.topic_id,
        audience_ids:
          targetAudienceIds && targetAudienceIds.length > 0
            ? targetAudienceIds
            : q.audience_ids,
        global_index: currentIndex + 1,
      });

      if (!validation.success) {
        failures.push({
          index: rowIndex,
          preview: String(q.quote || q.title || "(sin enunciado)").slice(0, 80),
          error:
            validation.error.issues[0]?.message ||
            "Validación fallida sin detalle",
        });
        continue;
      }

      currentIndex += 1;
      const data = validation.data;

      const personId =
        data.display_type === "PERSON"
          ? data.correct_answer_id
          : data.person_id || null;
      const politicalPartyId =
        data.display_type === "PARTY"
          ? data.correct_answer_id
          : data.political_party_id || null;

      const created = await prisma.triviagame.create({
        data: {
          topic_id: data.topic_id || null,
          quote: data.quote,
          title: data.title || null,
          category: data.category,
          difficulty: data.difficulty,
          display_type: data.display_type,
          correct_answer_id: data.correct_answer_id,
          global_index: BigInt(currentIndex),
          explanation: data.explanation || null,
          source_url: data.source_url || null,
          image_url: data.image_url || null,
          is_published: isPublished,
          options: data.options as Prisma.InputJsonValue,
          person_id: personId,
          political_party_id: politicalPartyId,
        },
      });

      const audIds = data.audience_ids || [];
      if (audIds.length > 0) {
        await prisma.triviagame_audience.createMany({
          data: audIds.map((audId) => ({
            question_id: created.id,
            audience_id: audId,
          })),
          skipDuplicates: true,
        });
      }

      createdCount += 1;
    }

    revalidatePath("/admin/trivia");
    revalidatePath("/trivia");

    const estadoMsg = isPublished ? "publicadas" : "guardadas como borrador";
    let message: string;
    if (failures.length === 0) {
      message = `Se importaron ${createdCount} preguntas ${estadoMsg}.`;
    } else {
      message = `${createdCount} importadas ${estadoMsg}, ${failures.length} descartadas por errores (ver detalle).`;
    }

    return {
      success: createdCount > 0 || failures.length === 0,
      message,
      count: createdCount,
      failedCount: failures.length,
      failures,
    };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

// =========================================================================
// 2. TOPICS CRUD
// =========================================================================

export async function createTopic(data: TopicFormValues) {
  await serverRequireReviewer();
  const validation = topicSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const { audience_ids, ...fields } = validation.data;

    const topic = await prisma.triviatopic.create({
      data: {
        slug: fields.slug,
        title: fields.title,
        description: fields.description || null,
        icon: fields.icon || null,
        badge_color: fields.badge_color || null,
        banner_url: fields.banner_url || null,
        order_index: fields.order_index,
        is_active: fields.is_active,
      },
    });

    if (audience_ids && audience_ids.length > 0) {
      await prisma.triviatopic_audience.createMany({
        data: audience_ids.map((audId) => ({
          topic_id: topic.id,
          audience_id: audId,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/admin/trivia");
    revalidatePath("/trivia");
    return { success: true, message: "Tema creado correctamente", topic };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function updateTopic(id: string, data: TopicFormValues) {
  await serverRequireReviewer();
  const validation = topicSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const { audience_ids, ...fields } = validation.data;

    await prisma.triviatopic.update({
      where: { id },
      data: {
        slug: fields.slug,
        title: fields.title,
        description: fields.description || null,
        icon: fields.icon || null,
        badge_color: fields.badge_color || null,
        banner_url: fields.banner_url || null,
        order_index: fields.order_index,
        is_active: fields.is_active,
      },
    });

    await prisma.triviatopic_audience.deleteMany({
      where: { topic_id: id },
    });

    if (audience_ids && audience_ids.length > 0) {
      await prisma.triviatopic_audience.createMany({
        data: audience_ids.map((audId) => ({
          topic_id: id,
          audience_id: audId,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/admin/trivia");
    revalidatePath("/trivia");
    return { success: true, message: "Tema actualizado correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function deleteTopic(id: string) {
  await serverRequireEditor();
  try {
    await prisma.triviatopic.delete({ where: { id } });
    revalidatePath("/admin/trivia");
    revalidatePath("/trivia");
    return { success: true, message: "Tema eliminado" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

// =========================================================================
// 3. AUDIENCES CRUD
// =========================================================================

export async function createAudience(data: AudienceFormValues) {
  await serverRequireReviewer();
  const validation = audienceSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const audience = await prisma.triviaaudience.create({
      data: validation.data,
    });

    revalidatePath("/admin/trivia");
    revalidatePath("/trivia");
    return {
      success: true,
      message: "Audiencia creada correctamente",
      audience,
    };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function updateAudience(id: string, data: AudienceFormValues) {
  await serverRequireReviewer();
  const validation = audienceSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    await prisma.triviaaudience.update({
      where: { id },
      data: validation.data,
    });

    revalidatePath("/admin/trivia");
    revalidatePath("/trivia");
    return { success: true, message: "Audiencia actualizada correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function deleteAudience(id: string) {
  await serverRequireEditor();
  try {
    await prisma.triviaaudience.delete({ where: { id } });
    revalidatePath("/admin/trivia");
    revalidatePath("/trivia");
    return { success: true, message: "Audiencia eliminada" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}
