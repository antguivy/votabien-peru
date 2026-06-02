"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hitoSchema, type HitoFormValues } from "./validation";
import { extractErrorMessage } from "@/lib/error-handler";
import { serverRequireAdmin } from "@/lib/auth-actions";
import { TAGS } from "@/lib/cache-tags";

export async function createTeamPhoto(data: HitoFormValues) {
  await serverRequireAdmin();
  const validation = hitoSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const payload = {
      title: data.title,
      date: data.date,
      description: data.description || null,
      location: data.location || null,
      label: data.label || null,
      photo_url: data.photo_url || null,
      registration_url: data.registration_url || null,
      is_published: data.is_published,
      index: data.index || 0,
    };

    await prisma.hito.create({ data: payload });

    revalidatePath("/admin/hito");
    // @ts-expect-error Next.js 16 revalidateTag typing bug
    revalidateTag(TAGS.hitos);
    return { success: true, message: "Evento creado correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function updateTeamPhoto(id: number, data: HitoFormValues) {
  await serverRequireAdmin();
  const validation = hitoSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
    const payload = {
      title: data.title,
      date: data.date,
      description: data.description || null,
      location: data.location || null,
      label: data.label || null,
      photo_url: data.photo_url || null,
      registration_url: data.registration_url || null,
      is_published: data.is_published,
      index: data.index || 0,
    };

    await prisma.hito.update({ where: { id: id }, data: payload });

    revalidatePath("/admin/hito");
    // @ts-expect-error Next.js 16 revalidateTag typing bug
    revalidateTag(TAGS.hitos);
    return { success: true, message: "Evento actualizado correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function deleteHito(id: number) {
  await serverRequireAdmin();
  try {
    await prisma.hito.delete({ where: { id: id } });

    revalidatePath("/admin/hito");
    // @ts-expect-error Next.js 16 revalidateTag typing bug
    revalidateTag(TAGS.hitos);
    return { success: true };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}
