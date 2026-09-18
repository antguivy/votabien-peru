import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { executeBatchRecalculateLegislatorMetrics } from "@/lib/services/legislator-metrics";

/**
 * GET /api/webhooks/information-requests?period=2026-2031&chamber=DIPUTADOS
 * Devuelve un mapa compacto de pedidos de información existentes para diffing en el servicio Python.
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
    const chamber = searchParams.get("chamber");

    const whereClause: Record<string, unknown> = {};
    if (period) whereClause.period = period;
    if (chamber) whereClause.chamber = chamber;

    const requests = await prisma.information_request.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      select: {
        number: true,
        chamber: true,
        period: true,
        legislative_session: true,
        document_code: true,
        document_date: true,
        target_entity: true,
        legislator_id: true,
      },
    });

    const map: Record<string, unknown> = {};
    for (const r of requests) {
      map[r.number] = r;
    }

    return NextResponse.json({
      success: true,
      count: requests.length,
      requests: map,
    });
  } catch (error) {
    console.error("Error en GET information-requests snapshot:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/webhooks/information-requests
 * Recibe lotes de pedidos de información procesados, realiza upsert
 * y actualiza `total_information_requests` en `legislatormetrics`.
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
        { error: "El payload debe ser un array de pedidos de información" },
        { status: 400 },
      );
    }

    const results = {
      inserted: 0,
      updated: 0,
      errors: [] as string[],
    };

    const affectedLegislatorIds = new Set<string>();

    function parseDateSafe(dateVal: unknown): Date | null {
      if (!dateVal) return null;
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
      return isNaN(d.getTime()) ? null : d;
    }

    for (const data of payload) {
      try {
        if (!data.number || !data.summary || !data.target_entity) {
          results.errors.push(
            `Faltan campos obligatorios en pedido: ${data.number || "desconocido"}`,
          );
          continue;
        }

        const chamberVal = data.chamber || "DIPUTADOS";

        const existing = await prisma.information_request.findUnique({
          where: { number: data.number },
        });

        if (existing) {
          const finalLegislatorId =
            data.legislator_id || existing.legislator_id;

          if (
            existing.legislator_id &&
            finalLegislatorId &&
            existing.legislator_id !== finalLegislatorId
          ) {
            affectedLegislatorIds.add(existing.legislator_id);
          }
          if (finalLegislatorId) {
            affectedLegislatorIds.add(finalLegislatorId);
          }

          await prisma.information_request.update({
            where: { number: data.number },
            data: {
              chamber: chamberVal,
              period: data.period || existing.period,
              legislative_year:
                data.legislative_year ?? existing.legislative_year,
              legislative_session:
                data.legislative_session ?? existing.legislative_session,
              document_code: data.document_code ?? existing.document_code,
              document_date:
                parseDateSafe(data.document_date) ?? existing.document_date,
              origin: data.origin ?? existing.origin,
              summary: data.summary || existing.summary,
              target_entity: data.target_entity || existing.target_entity,
              target_position: data.target_position ?? existing.target_position,
              target_person: data.target_person ?? existing.target_person,
              reception_date:
                parseDateSafe(data.reception_date) ?? existing.reception_date,
              due_date: parseDateSafe(data.due_date) ?? existing.due_date,
              coauthors_raw: data.coauthors_raw ?? existing.coauthors_raw,
              document_url: data.document_url ?? existing.document_url,
              legislator_id: finalLegislatorId,
            },
          });
          results.updated++;
        } else {
          if (data.legislator_id) {
            affectedLegislatorIds.add(data.legislator_id);
          }

          await prisma.information_request.create({
            data: {
              number: data.number,
              chamber: chamberVal,
              period: data.period || "2026-2031",
              legislative_year: data.legislative_year || null,
              legislative_session: data.legislative_session || null,
              document_code: data.document_code || null,
              document_date: parseDateSafe(data.document_date),
              origin: data.origin || null,
              summary: data.summary,
              target_entity: data.target_entity,
              target_position: data.target_position || null,
              target_person: data.target_person || null,
              reception_date: parseDateSafe(data.reception_date),
              due_date: parseDateSafe(data.due_date),
              coauthors_raw: data.coauthors_raw || null,
              document_url: data.document_url || null,
              legislator_id: data.legislator_id || null,
            },
          });
          results.inserted++;
        }
      } catch (itemErr) {
        console.error(`Error procesando pedido ${data.number}:`, itemErr);
        results.errors.push(
          `Error en pedido ${data.number}: ${itemErr instanceof Error ? itemErr.message : String(itemErr)}`,
        );
      }
    }

    // Recalcular métricas consolidadas de los legisladores afectados mediante la fuente única de verdad
    if (affectedLegislatorIds.size > 0) {
      try {
        await executeBatchRecalculateLegislatorMetrics({
          legislatorIds: Array.from(affectedLegislatorIds),
        });
      } catch (metricErr) {
        console.error(
          "Error actualizando métricas consolidadas en webhook de information-requests:",
          metricErr,
        );
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error en POST webhooks/information-requests:", error);
    return NextResponse.json(
      { error: "Error interno procesando pedidos de información" },
      { status: 500 },
    );
  }
}
