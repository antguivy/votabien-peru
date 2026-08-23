"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import {
  CreateExecutiveRequest,
  UpdateExecutiveRequest,
} from "@/interfaces/executive";
import { extractErrorMessage } from "@/lib/error-handler";
import { serverRequireEditor } from "@/lib/auth-actions";

const handleError = (error: unknown, msg: string) => {
  console.error(msg, error);
  return {
    success: false,
    error: extractErrorMessage(error),
  };
};

export async function createExecutive(data: CreateExecutiveRequest) {
  await serverRequireEditor();
  try {
    const dbData = {
      id: createId(),
      person_id: data.person_id,
      role: data.role,
      ministry: data.ministry ?? null,
      start_date: new Date(data.start_date),
      end_date: data.end_date ? new Date(data.end_date) : null,
      end_reason:
        (data.end_reason as
          | "RENUNCIA"
          | "REMOCION"
          | "FALLECIMIENTO"
          | "VACANCIA"
          | "PERIODO_FINALIZADO"
          | "DESCONOCIDO") ?? null,
      legislative_period_id: data.legislative_period_id ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await prisma.executive.create({ data: dbData });

    revalidatePath("/admin/ejecutivo");
    revalidateTag(TAGS.executives, "max");

    return { success: true };
  } catch (error: unknown) {
    return handleError(error, "Error al crear miembro del ejecutivo");
  }
}

export async function updateExecutive(data: UpdateExecutiveRequest) {
  await serverRequireEditor();
  try {
    const { id, ...updateBody } = data;

    const payload: Record<string, unknown> = {
      ...updateBody,
      start_date: updateBody.start_date
        ? new Date(updateBody.start_date)
        : undefined,
      end_date:
        updateBody.end_date === null
          ? null
          : updateBody.end_date
            ? new Date(updateBody.end_date)
            : undefined,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    await prisma.executive.update({
      where: { id },
      data: payload,
    });

    revalidatePath("/admin/ejecutivo");
    revalidateTag(TAGS.executives, "max");

    return { success: true };
  } catch (error: unknown) {
    return handleError(error, "Error al actualizar miembro del ejecutivo");
  }
}

export async function bulkUpdateExecutives(input: {
  ids: string[];
  active: boolean;
}) {
  await serverRequireEditor();
  try {
    const data = await prisma.executive.updateMany({
      where: { id: { in: input.ids } },
      data: { active: input.active },
    });

    revalidatePath("/admin/ejecutivo");
    revalidateTag(TAGS.executives, "max");

    return {
      data: { count: data.count, message: `Actualizados ${data.count}` },
      error: null,
    };
  } catch (error) {
    return handleError(error, "Error al actualizar ejecutivos");
  }
}
