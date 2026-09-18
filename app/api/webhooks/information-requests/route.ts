import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    // Recalcular total_information_requests para legisladores afectados
    for (const legislatorId of affectedLegislatorIds) {
      try {
        const total_requests = await prisma.information_request.count({
          where: { legislator_id: legislatorId },
        });

        await prisma.legislatormetrics.upsert({
          where: { legislator_id: legislatorId },
          create: {
            legislator_id: legislatorId,
            total_bills: 0,
            bills_presentado: 0,
            bills_en_comision: 0,
            bills_aprobado: 0,
            bills_rechazado: 0,
            bills_retirado_por_autor: 0,
            bills_en_proceso: 0,
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
            total_motions: 0,
            motions_greeting: 0,
            motions_interpellation: 0,
            motions_censure: 0,
            total_information_requests: total_requests,
            last_updated: new Date(),
          },
          update: {
            total_information_requests: total_requests,
            last_updated: new Date(),
          },
        });
      } catch (metricErr) {
        console.error(
          `Error actualizando métricas de pedidos para legislador ${legislatorId}:`,
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
