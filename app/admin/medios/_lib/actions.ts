"use server";

import { prisma } from "@/lib/prisma";
import { serverRequireReviewer } from "@/lib/auth-actions";
import { revalidatePath } from "next/cache";

export interface PressSourceItem {
  id: string;
  name: string;
  domain: string;
  scope: "NACIONAL" | "REGIONAL" | "LOCAL";
  active: boolean;
  electoraldistrict_id: string | null;
  district_name?: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function getPressSources(): Promise<PressSourceItem[]> {
  await serverRequireReviewer();

  const sources = await prisma.press_source.findMany({
    include: {
      electoraldistrict: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ scope: "asc" }, { name: "asc" }],
  });

  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    domain: s.domain,
    scope: s.scope as "NACIONAL" | "REGIONAL" | "LOCAL",
    active: s.active,
    electoraldistrict_id: s.electoraldistrict_id,
    district_name: s.electoraldistrict?.name || null,
    created_at: s.created_at,
    updated_at: s.updated_at,
  }));
}

export async function getRegionalDistrictsList(): Promise<
  { id: string; name: string }[]
> {
  await serverRequireReviewer();

  const districts = await prisma.electoraldistrict.findMany({
    where: { parent_id: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return districts;
}

export async function createPressSource(data: {
  name: string;
  domain: string;
  scope: "NACIONAL" | "REGIONAL" | "LOCAL";
  electoraldistrict_id?: string | null;
}) {
  const { user } = await serverRequireReviewer();
  const isAdmin =
    user.role === "admin" ||
    user.role === "super_admin" ||
    user.role === "editor";

  if (!isAdmin) {
    return {
      success: false,
      error: "No tienes permisos para registrar medios.",
    };
  }

  const cleanDomain = data.domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");

  try {
    const created = await prisma.press_source.create({
      data: {
        name: data.name.trim(),
        domain: cleanDomain,
        scope: data.scope,
        electoraldistrict_id:
          data.scope === "NACIONAL" ? null : data.electoraldistrict_id || null,
        active: true,
      },
    });

    revalidatePath("/admin/medios");
    return { success: true, data: created };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Error al registrar medio.";
    return { success: false, error: msg };
  }
}

export async function togglePressSourceActive(id: string, active: boolean) {
  const { user } = await serverRequireReviewer();
  const isAdmin =
    user.role === "admin" ||
    user.role === "super_admin" ||
    user.role === "editor";

  if (!isAdmin) {
    return {
      success: false,
      error: "No tienes permisos para modificar medios.",
    };
  }

  try {
    await prisma.press_source.update({
      where: { id },
      data: { active },
    });

    revalidatePath("/admin/medios");
    return { success: true };
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "Error al actualizar estado del medio.";
    return { success: false, error: msg };
  }
}

export async function deletePressSource(id: string) {
  const { user } = await serverRequireReviewer();
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  if (!isAdmin) {
    return {
      success: false,
      error: "Solo los administradores pueden eliminar medios.",
    };
  }

  try {
    await prisma.press_source.delete({
      where: { id },
    });

    revalidatePath("/admin/medios");
    return { success: true };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Error al eliminar medio.";
    return { success: false, error: msg };
  }
}
