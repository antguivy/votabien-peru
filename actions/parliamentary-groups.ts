"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ParliamentaryGroupData {
  name: string;
  acronym: string | null;
  color_hex: string | null;
  logo_url: string | null;
  government_audio_url: string | null;
  description: string | null;
  active?: boolean;
}

export async function createParliamentaryGroup(data: ParliamentaryGroupData) {
  try {
    const newGroup = await prisma.parliamentarygroup.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        acronym: data.acronym,
        color_hex: data.color_hex,
        logo_url: data.logo_url,
        government_audio_url: data.government_audio_url,
        description: data.description,
        active: data.active ?? true,
      },
    });

    revalidatePath("/admin/bancadas");
    return { success: true, group: newGroup };
  } catch (error) {
    console.error("Error creating parliamentary group:", error);
    return { success: false, error: "Failed to create parliamentary group" };
  }
}

export async function updateParliamentaryGroup(
  id: string,
  data: ParliamentaryGroupData,
) {
  try {
    const updatedGroup = await prisma.parliamentarygroup.update({
      where: { id },
      data: {
        name: data.name,
        acronym: data.acronym,
        color_hex: data.color_hex,
        logo_url: data.logo_url,
        government_audio_url: data.government_audio_url,
        description: data.description,
        active: data.active,
      },
    });

    revalidatePath("/", "layout"); // Bancada colors affect seats and portada
    return { success: true, group: updatedGroup };
  } catch (error) {
    console.error("Error updating parliamentary group:", error);
    return { success: false, error: "Failed to update parliamentary group" };
  }
}

export async function toggleParliamentaryGroupActive(
  id: string,
  active: boolean,
) {
  try {
    await prisma.parliamentarygroup.update({
      where: { id },
      data: { active },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error toggling parliamentary group:", error);
    return { success: false, error: "Failed to toggle status" };
  }
}
