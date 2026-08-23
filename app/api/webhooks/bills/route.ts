import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";

/**
 * GET /api/webhooks/bills?period=2026-2031
 * Devuelve un mapa compacto de proyectos guardados para el diffing de Python.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const secretKey = process.env.API_SECRET_KEY;

    if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");

    const bills = await prisma.bill.findMany({
      where: period ? { period } : undefined,
      select: {
        number: true,
        approval_status: true,
        title_ai: true,
        summary: true,
        document_url: true,
        legislator_id: true,
      },
    });

    const map: Record<string, unknown> = {};
    for (const b of bills) {
      map[b.number] = b;
    }

    return NextResponse.json({
      success: true,
      count: bills.length,
      bills: map,
    });
  } catch (error) {
    console.error("Error en GET bills snapshot:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/webhooks/bills
 * Recibe lotes de proyectos scrapeados, hace upsert y recalcula métricas.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const secretKey = process.env.API_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "API_SECRET_KEY no configurada en el servidor" },
        { status: 500 },
      );
    }

    if (!authHeader || authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await request.json();

    if (!Array.isArray(payload)) {
      return NextResponse.json(
        { error: "El payload debe ser un array de proyectos de ley" },
        { status: 400 },
      );
    }

    const results = {
      inserted: 0,
      updated: 0,
      skipped_sin_autor: 0,
      errors: [] as string[],
    };

    const affectedLegislatorIds = new Set<string>();

    function parseDateSafe(dateVal: unknown): Date {
      if (!dateVal) return new Date();
      const str = String(dateVal).trim();
      if (str.includes("/")) {
        const parts = str.split("/");
        if (parts.length === 3) {
          const [day, month, year] = parts;
          const parsed = new Date(
            `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`,
          );
          if (!isNaN(parsed.getTime())) return parsed;
        }
      }
      const d = new Date(str);
      return isNaN(d.getTime()) ? new Date() : d;
    }

    for (const data of payload) {
      try {
        if (!data.number || !data.submission_date) {
          results.errors.push(
            `Faltan campos obligatorios en el proyecto: ${data.number || "desconocido"}`,
          );
          continue;
        }

        // Si no tiene legislator_id, no se puede insertar por la FK obligatoria
        if (!data.legislator_id) {
          results.skipped_sin_autor++;
          continue;
        }

        const existingBill = await prisma.bill.findUnique({
          where: { number: data.number },
        });

        if (existingBill) {
          await prisma.bill.update({
            where: { number: data.number },
            data: {
              title: data.title || existingBill.title,
              summary: data.summary || existingBill.summary,
              approval_status:
                data.approval_status || existingBill.approval_status,
              approval_date: data.approval_date
                ? parseDateSafe(data.approval_date)
                : existingBill.approval_date,
              committees: data.committees || existingBill.committees,
              document_url: data.document_url || existingBill.document_url,
              title_ai: data.title_ai || existingBill.title_ai,
              parliamentary_group_id:
                data.parliamentary_group_id ||
                existingBill.parliamentary_group_id,
              coauthors: data.coauthors || existingBill.coauthors,
              updated_at: new Date(),
            },
          });
          results.updated++;
        } else {
          await prisma.bill.create({
            data: {
              id: createId(),
              number: data.number,
              title: data.title,
              summary: data.summary,
              submission_date: parseDateSafe(data.submission_date),
              approval_status: data.approval_status || "PRESENTADO",
              approval_date: data.approval_date
                ? parseDateSafe(data.approval_date)
                : null,
              sponsor: data.sponsor,
              period: data.period,
              legislative_session: data.legislative_session,
              committees: data.committees,
              document_url: data.document_url,
              title_ai: data.title_ai,
              legislator_id: data.legislator_id,
              parliamentary_group_id: data.parliamentary_group_id,
              coauthors: data.coauthors,
              cosponsors: data.cosponsors,
            },
          });
          results.inserted++;
        }

        if (data.legislator_id) {
          affectedLegislatorIds.add(data.legislator_id);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error desconocido";
        results.errors.push(
          `Error procesando proyecto ${data.number}: ${message}`,
        );
      }
    }

    // Recalcular métricas para los legisladores afectados
    for (const legislatorId of affectedLegislatorIds) {
      try {
        const bills = await prisma.bill.findMany({
          where: { legislator_id: legislatorId },
          select: { approval_status: true },
        });

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
        const bills_en_proceso =
          total_bills -
          bills_aprobado -
          bills_rechazado -
          bills_retirado_por_autor;

        await prisma.legislatormetrics.upsert({
          where: { legislator_id: legislatorId },
          create: {
            legislator_id: legislatorId,
            total_bills,
            bills_presentado,
            bills_en_comision,
            bills_aprobado,
            bills_rechazado,
            bills_retirado_por_autor,
            bills_en_proceso: bills_en_proceso > 0 ? bills_en_proceso : 0,
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
            bills_en_proceso: bills_en_proceso > 0 ? bills_en_proceso : 0,
            last_updated: new Date(),
          },
        });
      } catch (metricsErr) {
        console.error(
          `Error actualizando métricas para legislador ${legislatorId}:`,
          metricsErr,
        );
      }
    }

    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (error) {
    console.error("Error en webhook de bills:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
