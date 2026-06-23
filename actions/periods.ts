"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- ELECTORAL PROCESS ---

export async function createElectoralProcess(data: {
  name: string;
  year: number;
  election_date: string;
  active: boolean;
}) {
  try {
    if (data.active) {
      await prisma.electoralprocess.updateMany({ data: { active: false } });
    }

    const newProcess = await prisma.electoralprocess.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        year: data.year,
        election_date: new Date(data.election_date),
        active: data.active,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    revalidatePath("/admin/periodos");
    revalidatePath("/");
    return { success: true, process: newProcess };
  } catch (error) {
    console.error("Error creating electoral process:", error);
    return { success: false, error: "Error creating electoral process" };
  }
}

export async function updateElectoralProcess(
  id: string,
  data: { name: string; year: number; election_date: string; active: boolean },
) {
  try {
    if (data.active) {
      await prisma.electoralprocess.updateMany({
        where: { id: { not: id } },
        data: { active: false },
      });
    }

    const updated = await prisma.electoralprocess.update({
      where: { id },
      data: {
        name: data.name,
        year: data.year,
        election_date: new Date(data.election_date),
        active: data.active,
        updated_at: new Date(),
      },
    });

    revalidatePath("/admin/periodos");
    revalidatePath("/");
    return { success: true, process: updated };
  } catch (error) {
    console.error("Error updating electoral process:", error);
    return { success: false, error: "Error updating electoral process" };
  }
}

// --- LEGISLATIVE PERIOD --- (Moved from seats.ts)

export async function createLegislativePeriod(data: {
  name: string;
  start_date: string;
  end_date: string;
  active: boolean;
}) {
  try {
    if (data.active) {
      await prisma.legislativeperiod.updateMany({ data: { active: false } });
    }

    const period = await prisma.legislativeperiod.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        active: data.active,
      },
    });

    revalidatePath("/admin/periodos");
    revalidatePath("/admin/seats");
    revalidatePath("/");
    return { success: true, period };
  } catch (error) {
    console.error("Error creating legislative period:", error);
    return { success: false, error: "Error creating period" };
  }
}

export async function updateLegislativePeriod(
  id: string,
  data: { name: string; start_date: string; end_date: string; active: boolean },
) {
  try {
    if (data.active) {
      await prisma.legislativeperiod.updateMany({
        where: { id: { not: id } },
        data: { active: false },
      });
    }

    const updated = await prisma.legislativeperiod.update({
      where: { id },
      data: {
        name: data.name,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        active: data.active,
        updated_at: new Date(),
      },
    });

    revalidatePath("/admin/periodos");
    revalidatePath("/admin/seats");
    revalidatePath("/");
    return { success: true, period: updated };
  } catch (error) {
    console.error("Error updating legislative period:", error);
    return { success: false, error: "Error updating period" };
  }
}
