"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { teamSchema, type TeamFormValues } from "./validation";
import { extractErrorMessage } from "@/lib/error-handler";
import { createId } from "@paralleldrive/cuid2";
import { serverRequireAdmin } from "@/lib/auth-actions";

export async function createTeam(data: TeamFormValues) {
  await serverRequireAdmin();
  const validation = teamSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  try {
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

    await prisma.team.create({ data: payload });

    revalidatePath("/admin/team");
    return { success: true, message: "Miembro creado correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function updateTeam(id: string, data: TeamFormValues) {
  await serverRequireAdmin();
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

    await prisma.team.update({ where: { id: id }, data: payload });

    revalidatePath("/admin/team");
    return { success: true, message: "Miembro actualizado correctamente" };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function deleteTeam(id: string) {
  await serverRequireAdmin();
  try {
    await prisma.team.delete({ where: { id: id } });
    revalidatePath("/admin/team");
    return { success: true };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}
