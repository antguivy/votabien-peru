"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Asignar manualmente legislador y/o grupo a un asiento
export async function updateSeatAssignment(
  seatId: string,
  legislatorId: string | null,
  groupId: string | null = null,
) {
  try {
    if (legislatorId) {
      await prisma.seatparliamentary.updateMany({
        where: { legislator_id: legislatorId },
        data: { legislator_id: null },
      });
    }

    const updatedSeat = await prisma.seatparliamentary.update({
      where: { id: seatId },
      data: {
        legislator_id: legislatorId,
        ...(groupId !== null && { parliamentary_group_id: groupId }),
      },
    });

    revalidatePath("/", "layout");
    return { success: true, seat: updatedSeat };
  } catch (error) {
    console.error("Error updating seat:", error);
    return { success: false, error: "Error updating seat" };
  }
}

// 2. Pintar asientos en bloque para una bancada
export async function batchAssignGroupToSeats(
  seatIds: string[],
  groupId: string | null,
) {
  try {
    await prisma.seatparliamentary.updateMany({
      where: { id: { in: seatIds } },
      data: { parliamentary_group_id: groupId },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error batch assigning seats:", error);
    return { success: false, error: "Error batch assigning seats" };
  }
}

// 3. Auto-asignar legisladores de una bancada a los asientos marcados para esa bancada
export async function autoAssignLegislators(
  groupId: string,
  chamber: "SENADO" | "DIPUTADOS" | "CONGRESO",
  periodId?: string,
) {
  try {
    // 1. Obtener los asientos asignados a este grupo que NO tienen legislador
    const emptySeats = await prisma.seatparliamentary.findMany({
      where: {
        parliamentary_group_id: groupId,
        chamber: chamber,
        legislator_id: null,
        ...(periodId && { legislative_period_id: periodId }),
      },
      orderBy: [{ row: "asc" }, { number_seat: "asc" }],
    });

    if (emptySeats.length === 0) {
      return {
        success: true,
        message: "No hay asientos vacíos para esta bancada.",
      };
    }

    // 2. Obtener legisladores de este grupo que NO tienen asiento
    // Primero obtenemos todos los que están en el grupo
    const groupMemberships = await prisma.parliamentarymembership.findMany({
      where: {
        parliamentary_group_id: groupId,
        end_date: null,
        legislator: {
          chamber: chamber,
          active: true,
        },
      },
      select: { legislator_id: true },
    });

    const memberIds = groupMemberships.map((m) => m.legislator_id);

    // Luego, filtrar aquellos que ya están en algún asiento en el periodo
    const occupiedSeats = await prisma.seatparliamentary.findMany({
      where: {
        legislator_id: { in: memberIds },
        ...(periodId && { legislative_period_id: periodId }),
      },
      select: { legislator_id: true },
    });

    const assignedLegislatorIds = new Set(
      occupiedSeats.map((s) => s.legislator_id).filter(Boolean),
    );
    const unassignedLegislatorIds = memberIds.filter(
      (id) => !assignedLegislatorIds.has(id),
    );

    if (unassignedLegislatorIds.length === 0) {
      return {
        success: true,
        message: "Todos los legisladores de la bancada ya tienen asiento.",
      };
    }

    // 3. Emparejar y actualizar
    const updates = [];
    const iterations = Math.min(
      emptySeats.length,
      unassignedLegislatorIds.length,
    );

    for (let i = 0; i < iterations; i++) {
      updates.push(
        prisma.seatparliamentary.update({
          where: { id: emptySeats[i].id },
          data: { legislator_id: unassignedLegislatorIds[i] },
        }),
      );
    }

    await prisma.$transaction(updates);

    revalidatePath("/", "layout");
    return { success: true, assignedCount: iterations };
  } catch (error) {
    console.error("Error auto-assigning legislators:", error);
    return { success: false, error: "Error auto-assigning legislators" };
  }
}

export async function generateSeatsForPeriod(
  periodId: string,
  chamber: "SENADO" | "DIPUTADOS" | "CONGRESO",
) {
  try {
    const existing = await prisma.seatparliamentary.count({
      where: { legislative_period_id: periodId, chamber },
    });

    if (existing > 0) {
      return {
        success: false,
        error: "Ya existen escaños para esta cámara en este periodo.",
      };
    }

    const seatsToCreate = [];

    // Configuración típica de escaños
    let totalSeats = 130;
    let rowsConfig = [32, 29, 26, 23, 20]; // Diputados/Congreso

    if (chamber === "SENADO") {
      totalSeats = 60;
      rowsConfig = [25, 20, 15]; // Senado
    }

    let seatNumber = 1;
    for (let rowIndex = 0; rowIndex < rowsConfig.length; rowIndex++) {
      const seatsInRow = rowsConfig[rowIndex];
      for (let i = 0; i < seatsInRow; i++) {
        if (seatNumber > totalSeats) break;
        seatsToCreate.push({
          id: crypto.randomUUID(),
          chamber,
          row: rowIndex + 1,
          number_seat: seatNumber,
          legislative_period_id: periodId,
          created_at: new Date(),
          updated_at: new Date(),
        });
        seatNumber++;
      }
    }

    await prisma.seatparliamentary.createMany({
      data: seatsToCreate,
    });

    revalidatePath("/", "layout");
    return { success: true, count: seatsToCreate.length };
  } catch (error) {
    console.error("Error generating seats:", error);
    return { success: false, error: "Error generating seats" };
  }
}
