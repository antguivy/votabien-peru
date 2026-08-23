"use server";

import prisma from "@/lib/prisma";
import { serverRequireAdmin, serverRequireEditor } from "@/lib/auth-actions";
import { revalidatePath } from "next/cache";
import { BillApprovalStatusType } from "./validation";

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

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
    });

    revalidatePath("/admin/proyectos-ley");
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
    const response = await fetch(
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
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Fallo en el servicio de IA: ${errText}`);
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
      const remainingBills = await prisma.bill.findMany({
        where: { legislator_id: bill.legislator_id },
        select: { approval_status: true },
      });

      const total_bills = remainingBills.length;
      const bills_presentado = remainingBills.filter(
        (b) => b.approval_status === "PRESENTADO",
      ).length;
      const bills_en_comision = remainingBills.filter(
        (b) => b.approval_status === "EN_COMISION",
      ).length;
      const bills_aprobado = remainingBills.filter((b) =>
        [
          "APROBADO",
          "PUBLICADO",
          "AUTOGRAFA",
          "APROBADO_PRIMERA_VOTACION",
        ].includes(b.approval_status),
      ).length;
      const bills_rechazado = remainingBills.filter((b) =>
        ["AL_ARCHIVO", "DECRETO_ARCHIVO"].includes(b.approval_status),
      ).length;
      const bills_retirado_por_autor = remainingBills.filter(
        (b) => b.approval_status === "RETIRADO_POR_AUTOR",
      ).length;
      const bills_en_proceso =
        total_bills -
        bills_aprobado -
        bills_rechazado -
        bills_retirado_por_autor;

      await prisma.legislatormetrics.upsert({
        where: { legislator_id: bill.legislator_id },
        create: {
          legislator_id: bill.legislator_id,
          total_bills,
          bills_presentado,
          bills_en_comision,
          bills_aprobado,
          bills_rechazado,
          bills_retirado_por_autor,
          bills_en_proceso: Math.max(0, bills_en_proceso),
          total_sessions: 0,
          sessions_present: 0,
          sessions_absent: 0,
          sessions_justified: 0,
          sessions_license: 0,
          attendance_rate: 0,
          total_party_changes: 0,
          is_defector: false,
          total_legal_records: 0,
          penal_records: 0,
          ethical_records: 0,
          civil_records: 0,
          administrative_records: 0,
          last_updated: new Date(),
        },
        update: {
          total_bills,
          bills_presentado,
          bills_en_comision,
          bills_aprobado,
          bills_rechazado,
          bills_retirado_por_autor,
          bills_en_proceso: Math.max(0, bills_en_proceso),
          last_updated: new Date(),
        },
      });
    }

    revalidatePath("/admin/proyectos-ley");
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al eliminar";
    console.error("Error al eliminar proyecto de ley:", error);
    return { success: false, error: message };
  }
}
