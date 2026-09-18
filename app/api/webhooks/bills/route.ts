import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { executeBatchRecalculateLegislatorMetrics } from "@/lib/services/legislator-metrics";

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
        parliamentary_group_id: true,
        legislative_session: true,
        committees: true,
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

        const existingBill = await prisma.bill.findUnique({
          where: { number: data.number },
        });

        if (existingBill) {
          const finalLegislatorId =
            data.legislator_id || existingBill.legislator_id;

          if (
            existingBill.legislator_id &&
            finalLegislatorId &&
            existingBill.legislator_id !== finalLegislatorId
          ) {
            affectedLegislatorIds.add(existingBill.legislator_id);
          }
          if (finalLegislatorId) {
            affectedLegislatorIds.add(finalLegislatorId);
          }

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
              sponsor: data.sponsor || existingBill.sponsor,
              legislator_id: finalLegislatorId,
              committees: data.committees || existingBill.committees,
              document_url: data.document_url || existingBill.document_url,
              title_ai: data.title_ai || existingBill.title_ai,
              parliamentary_group_id:
                data.parliamentary_group_id ||
                existingBill.parliamentary_group_id,
              legislative_session:
                data.legislative_session || existingBill.legislative_session,
              coauthors: data.coauthors || existingBill.coauthors,
              cosponsors: data.cosponsors || existingBill.cosponsors,
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
              legislator_id: data.legislator_id || null,
              parliamentary_group_id: data.parliamentary_group_id,
              coauthors: data.coauthors,
              cosponsors: data.cosponsors,
            },
          });
          results.inserted++;
          if (data.legislator_id) {
            affectedLegislatorIds.add(data.legislator_id);
          }
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error desconocido";
        results.errors.push(
          `Error procesando proyecto ${data.number}: ${message}`,
        );
      }
    }

    // Recalcular métricas consolidadas de los legisladores afectados mediante la fuente única de verdad
    if (affectedLegislatorIds.size > 0) {
      try {
        await executeBatchRecalculateLegislatorMetrics({
          legislatorIds: Array.from(affectedLegislatorIds),
        });
      } catch (metricsErr) {
        console.error(
          "Error actualizando métricas consolidadas en webhook de bills:",
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
