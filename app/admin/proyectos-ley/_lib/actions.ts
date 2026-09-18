"use server";

import prisma from "@/lib/prisma";
import { serverRequireAdmin, serverRequireEditor } from "@/lib/auth-actions";
import { revalidatePath } from "next/cache";
import { BillApprovalStatusType } from "./validation";
import { executeBatchRecalculateLegislatorMetrics } from "@/lib/services/legislator-metrics";

const PYTHON_SERVICE_URL =
  process.env.API_INTERNAL_URL ||
  process.env.PYTHON_SERVICE_URL ||
  "http://localhost:8000";

/**
 * Recalcula y sincroniza las métricas estadísticas del legislador asociadas a sus proyectos de ley
 * utilizando el servicio centralizado de métricas.
 */
async function syncLegislatorBillMetrics(legislatorId: string) {
  if (!legislatorId) return;

  try {
    await executeBatchRecalculateLegislatorMetrics({
      legislatorIds: [legislatorId],
    });
  } catch (err) {
    console.error("Error al sincronizar métricas del legislador:", err);
  }
}

export async function updateBillAction(
  id: string,
  data: {
    title_ai?: string | null;
    summary?: string | null;
    approval_status?: BillApprovalStatusType;
    document_url?: string | null;
    committees?: string | null;
  },
) {
  await serverRequireEditor();

  try {
    const updated = await prisma.bill.update({
      where: { id },
      data: {
        title_ai: data.title_ai,
        summary: data.summary,
        approval_status: data.approval_status,
        document_url: data.document_url,
        committees: data.committees,
        updated_at: new Date(),
      },
      select: {
        id: true,
        legislator_id: true,
        approval_status: true,
      },
    });

    // Sincronizar métricas del congresista si se modificó el estado
    if (data.approval_status && updated.legislator_id) {
      await syncLegislatorBillMetrics(updated.legislator_id);
    }

    revalidatePath("/admin/proyectos-ley");
    revalidatePath("/admin/legisladores");
    return { success: true, data: updated };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al actualizar";
    console.error("Error al actualizar proyecto de ley:", error);
    return { success: false, error: message };
  }
}

export async function regenerateBillTitleAction(id: string) {
  const { user } = await serverRequireEditor();

  try {
    const bill = await prisma.bill.findUnique({
      where: { id },
      select: { id: true, title: true, summary: true },
    });

    if (!bill || !bill.title) {
      return {
        success: false,
        error: "Proyecto no encontrado o sin título oficial.",
      };
    }

    const secretKey = process.env.API_SECRET_KEY || "";
    let response: Response;

    try {
      response = await fetch(
        `${PYTHON_SERVICE_URL}/api/v1/bills/generate-title`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secretKey}`,
            "X-User-Id": user.id,
            "X-User-Role": user.role,
          },
          body: JSON.stringify({
            titulo_oficial: bill.title,
            sumilla: bill.summary || "",
          }),
          signal: AbortSignal.timeout(45000), // Timeout defensivo de 45s
        },
      );
    } catch (fetchErr: unknown) {
      console.error("Fallo de conexión con servicio Python:", fetchErr);
      return {
        success: false,
        error:
          "No se pudo conectar con el servicio local de IA. Asegúrate de que el contenedor Docker esté iniciado en " +
          PYTHON_SERVICE_URL,
      };
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Fallo en el servicio de IA (${response.status}): ${errText}`,
      );
    }

    const aiResult = await response.json();
    const title_ai = aiResult.title_ai || bill.title;
    const summary = aiResult.summary || bill.summary;

    const updated = await prisma.bill.update({
      where: { id },
      data: {
        title_ai,
        summary,
        updated_at: new Date(),
      },
    });

    revalidatePath("/admin/proyectos-ley");
    return { success: true, data: updated };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al generar título con IA";
    console.error("Error regenerando título con IA:", error);
    return { success: false, error: message };
  }
}

export async function deleteBillAction(id: string) {
  await serverRequireAdmin();

  try {
    const bill = await prisma.bill.findUnique({
      where: { id },
      select: { legislator_id: true },
    });

    if (!bill) {
      return { success: false, error: "Proyecto no encontrado" };
    }

    await prisma.bill.delete({ where: { id } });

    // Recalcular métricas del legislador
    if (bill.legislator_id) {
      await syncLegislatorBillMetrics(bill.legislator_id);
    }

    revalidatePath("/admin/proyectos-ley");
    revalidatePath("/admin/legisladores");
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al eliminar";
    console.error("Error al eliminar proyecto de ley:", error);
    return { success: false, error: message };
  }
}
