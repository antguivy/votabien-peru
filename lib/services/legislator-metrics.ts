import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";

export interface RecalculateMetricsOptions {
  periodId?: string;
  legislatorIds?: string[];
}

export interface RecalculateMetricsResult {
  success: true;
  count: number;
  period: string;
}

/**
 * Servicio centralizado para el cálculo y reconciliación de métricas de legisladores.
 * Fuente única de verdad matemática:
 * - Si recibe `legislatorIds`, procesa únicamente los legisladores afectados (ejecución ultrarrápida, ~15ms, para webhooks).
 * - Si no recibe `legislatorIds`, reconcilia todo el periodo activo en lotes concurrentes (para Cron y botón Admin).
 */
export async function executeBatchRecalculateLegislatorMetrics(
  options?: RecalculateMetricsOptions,
): Promise<RecalculateMetricsResult> {
  const targetPeriod = options?.periodId
    ? await prisma.legislativeperiod.findUnique({
        where: { id: options.periodId },
      })
    : await prisma.legislativeperiod.findFirst({
        where: { active: true },
        orderBy: { start_date: "desc" },
      });

  const whereClause: Prisma.legislatorWhereInput = {
    ...(options?.legislatorIds && options.legislatorIds.length > 0
      ? { id: { in: options.legislatorIds } }
      : {
          active: true,
          ...(targetPeriod ? { legislative_period_id: targetPeriod.id } : {}),
        }),
  };

  const legislators = await prisma.legislator.findMany({
    where: whereClause,
    select: {
      id: true,
      bill: {
        select: {
          approval_status: true,
        },
      },
      motions: {
        select: {
          motion_type: true,
          is_greeting: true,
        },
      },
      information_requests: {
        select: {
          id: true,
        },
      },
      parliamentarymembership: {
        select: {
          id: true,
          start_date: true,
          end_date: true,
        },
        orderBy: {
          start_date: "asc",
        },
      },
      attendance: {
        select: {
          attendance_status: true,
        },
      },
      person: {
        select: {
          background: {
            select: {
              type: true,
              status: true,
            },
          },
        },
      },
    },
  });

  const now = new Date();
  const batchUpdates: Prisma.legislatormetricsUpsertArgs[] = [];

  for (const leg of legislators) {
    // 1. Proyectos de ley
    const bills = leg.bill || [];
    const total_bills = bills.length;
    const bills_presentado = bills.filter(
      (b) => b.approval_status === "PRESENTADO",
    ).length;
    const bills_en_comision = bills.filter(
      (b) => b.approval_status === "EN_COMISION",
    ).length;
    const bills_aprobado = bills.filter((b) =>
      [
        "APROBADO",
        "PUBLICADO",
        "AUTOGRAFA",
        "APROBADO_PRIMERA_VOTACION",
      ].includes(b.approval_status),
    ).length;
    const bills_rechazado = bills.filter((b) =>
      ["AL_ARCHIVO", "DECRETO_ARCHIVO"].includes(b.approval_status),
    ).length;
    const bills_retirado_por_autor = bills.filter(
      (b) => b.approval_status === "RETIRADO_POR_AUTOR",
    ).length;
    const bills_en_proceso = Math.max(
      0,
      total_bills - bills_aprobado - bills_rechazado - bills_retirado_por_autor,
    );
    const approval_rate =
      total_bills > 0
        ? Number(((bills_aprobado / total_bills) * 100).toFixed(2))
        : null;

    // 2. Mociones
    const motions = leg.motions || [];
    const total_motions = motions.length;
    const motions_greeting = motions.filter((m) => m.is_greeting).length;
    const motions_interpellation = motions.filter((m) =>
      (m.motion_type || "").toLowerCase().includes("interpelaci"),
    ).length;
    const motions_censure = motions.filter((m) =>
      (m.motion_type || "").toLowerCase().includes("censura"),
    ).length;

    // 3. Pedidos de información
    const total_information_requests = leg.information_requests?.length || 0;

    // 4. Membresías y transfuguismo
    const memberships = leg.parliamentarymembership || [];
    const total_party_changes = Math.max(0, memberships.length - 1);
    const is_defector = total_party_changes > 0;
    let days_in_current_group: number | null = null;
    const currentMembership =
      memberships.find((m) => !m.end_date) ||
      memberships[memberships.length - 1];
    if (currentMembership?.start_date) {
      const start = new Date(currentMembership.start_date).getTime();
      days_in_current_group = Math.max(
        0,
        Math.floor((now.getTime() - start) / (1000 * 60 * 60 * 24)),
      );
    }

    // 5. Asistencia: si no hay sesiones registradas, total_sessions = 0 y attendance_rate = null (NUNCA 0%)
    const attendances = leg.attendance || [];
    const total_sessions = attendances.length;
    const sessions_present = attendances.filter(
      (a) =>
        a.attendance_status === "ASISTENCIA" ||
        a.attendance_status === "COMISION_OFICIAL",
    ).length;
    const sessions_absent = attendances.filter(
      (a) => a.attendance_status === "FALTA",
    ).length;
    const sessions_justified = attendances.filter(
      (a) => a.attendance_status === "FALTA_JUSTIFICADA",
    ).length;
    const sessions_license = attendances.filter(
      (a) => a.attendance_status === "LICENCIA",
    ).length;
    const attendance_rate =
      total_sessions > 0
        ? Number(((sessions_present / total_sessions) * 100).toFixed(2))
        : null;

    // 6. Antecedentes (penales, éticos, civiles, administrativos)
    const backgrounds = leg.person?.background || [];
    const activeBackgrounds = backgrounds.filter(
      (b) =>
        b.status !== "ARCHIVADO" &&
        b.status !== "ABSUELTO" &&
        b.status !== "PRESCRITO",
    );
    const penal_records = activeBackgrounds.filter(
      (b) => b.type === "PENAL",
    ).length;
    const ethical_records = activeBackgrounds.filter(
      (b) => b.type === "ETICA",
    ).length;
    const civil_records = activeBackgrounds.filter(
      (b) => b.type === "CIVIL",
    ).length;
    const administrative_records = activeBackgrounds.filter(
      (b) => b.type === "ADMINISTRATIVO",
    ).length;
    const total_legal_records =
      penal_records + ethical_records + civil_records + administrative_records;

    batchUpdates.push({
      where: { legislator_id: leg.id },
      create: {
        legislator_id: leg.id,
        total_bills,
        bills_presentado,
        bills_en_comision,
        bills_aprobado,
        bills_rechazado,
        bills_retirado_por_autor,
        bills_en_proceso,
        approval_rate,
        total_sessions,
        sessions_present,
        sessions_absent,
        sessions_justified,
        sessions_license,
        attendance_rate,
        total_party_changes,
        days_in_current_group,
        is_defector,
        total_legal_records,
        penal_records,
        ethical_records,
        civil_records,
        administrative_records,
        total_motions,
        motions_greeting,
        motions_interpellation,
        motions_censure,
        total_information_requests,
        last_updated: now,
      },
      update: {
        total_bills,
        bills_presentado,
        bills_en_comision,
        bills_aprobado,
        bills_rechazado,
        bills_retirado_por_autor,
        bills_en_proceso,
        approval_rate,
        total_sessions,
        sessions_present,
        sessions_absent,
        sessions_justified,
        sessions_license,
        attendance_rate,
        total_party_changes,
        days_in_current_group,
        is_defector,
        total_legal_records,
        penal_records,
        ethical_records,
        civil_records,
        administrative_records,
        total_motions,
        motions_greeting,
        motions_interpellation,
        motions_censure,
        total_information_requests,
        last_updated: now,
      },
    });
  }

  // Ejecutar en lotes concurrentes (concurrency = 15) para evitar saturación del pooler de Supabase
  const CONCURRENCY_BATCH = 15;
  for (let i = 0; i < batchUpdates.length; i += CONCURRENCY_BATCH) {
    const chunk = batchUpdates.slice(i, i + CONCURRENCY_BATCH);
    await Promise.all(
      chunk.map((item) => prisma.legislatormetrics.upsert(item)),
    );
  }

  return {
    success: true,
    count: batchUpdates.length,
    period: targetPeriod?.name || "Periodo Activo",
  };
}
