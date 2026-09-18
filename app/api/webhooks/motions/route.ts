import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/webhooks/motions?period=2026-2031&chamber=DIPUTADOS
 * Devuelve un mapa compacto de mociones guardadas para el diffing del servicio Python.
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

    const motions = await prisma.motion.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      select: {
        number: true,
        chamber: true,
        period: true,
        legislative_session: true,
        procedural_status: true,
        motion_type: true,
        is_greeting: true,
        legislator_id: true,
        parliamentary_group_id: true,
      },
    });

    const map: Record<string, unknown> = {};
    for (const m of motions) {
      map[m.number] = m;
    }

    return NextResponse.json({
      success: true,
      count: motions.length,
      motions: map,
    });
  } catch (error) {
    console.error("Error en GET motions snapshot:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/webhooks/motions
 * Recibe lotes de mociones procesadas por el servicio Python,
 * hace upsert en la tabla `motion` y actualiza los agregados en `legislatormetrics`.
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
        { error: "El payload debe ser un array de mociones" },
        { status: 400 },
      );
    }

    const results = {
      inserted: 0,
      updated: 0,
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
            `Faltan campos obligatorios en la moción: ${data.number || "desconocido"}`,
          );
          continue;
        }

        const existingMotion = await prisma.motion.findUnique({
          where: { number: data.number },
        });

        if (existingMotion) {
          const finalLegislatorId =
            data.legislator_id || existingMotion.legislator_id;

          if (
            existingMotion.legislator_id &&
            finalLegislatorId &&
            existingMotion.legislator_id !== finalLegislatorId
          ) {
            affectedLegislatorIds.add(existingMotion.legislator_id);
          }
          if (finalLegislatorId) {
            affectedLegislatorIds.add(finalLegislatorId);
          }

          await prisma.motion.update({
            where: { number: data.number },
            data: {
              chamber: data.chamber || existingMotion.chamber,
              period: data.period || existingMotion.period,
              legislative_session:
                data.legislative_session || existingMotion.legislative_session,
              submission_date: parseDateSafe(data.submission_date),
              motion_type: data.motion_type || existingMotion.motion_type,
              is_greeting:
                data.is_greeting !== undefined
                  ? Boolean(data.is_greeting)
                  : existingMotion.is_greeting,
              purpose: data.purpose ?? existingMotion.purpose,
              procedural_status:
                data.procedural_status || existingMotion.procedural_status,
              summary: data.summary || existingMotion.summary,
              observations: data.observations ?? existingMotion.observations,
              coauthors_raw: data.coauthors_raw ?? existingMotion.coauthors_raw,
              adherents_raw: data.adherents_raw ?? existingMotion.adherents_raw,
              document_url: data.document_url || existingMotion.document_url,
              legislator_id: finalLegislatorId,
              parliamentary_group_id:
                data.parliamentary_group_id ||
                existingMotion.parliamentary_group_id,
            },
          });
          results.updated++;
        } else {
          if (data.legislator_id) {
            affectedLegislatorIds.add(data.legislator_id);
          }

          await prisma.motion.create({
            data: {
              number: data.number,
              chamber: data.chamber || "DIPUTADOS",
              period: data.period || "2026-2031",
              legislative_session: data.legislative_session || null,
              submission_date: parseDateSafe(data.submission_date),
              motion_type: data.motion_type || "Moción Ordinaria",
              is_greeting: Boolean(data.is_greeting),
              purpose: data.purpose || null,
              procedural_status: data.procedural_status || "PRESENTADO",
              summary: data.summary || "",
              observations: data.observations || null,
              coauthors_raw: data.coauthors_raw || null,
              adherents_raw: data.adherents_raw || null,
              document_url: data.document_url || null,
              legislator_id: data.legislator_id || null,
              parliamentary_group_id: data.parliamentary_group_id || null,
            },
          });
          results.inserted++;
        }
      } catch (err) {
        console.error(`Error procesando moción ${data.number}:`, err);
        results.errors.push(
          `Error en moción ${data.number}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Recalcular métricas de mociones para legisladores afectados
    for (const legislatorId of affectedLegislatorIds) {
      try {
        const motions = await prisma.motion.findMany({
          where: { legislator_id: legislatorId },
          select: { motion_type: true, is_greeting: true },
        });

        const total_motions = motions.length;
        const motions_greeting = motions.filter((m) => m.is_greeting).length;
        const motions_interpellation = motions.filter((m) =>
          m.motion_type.toLowerCase().includes("interpelaci"),
        ).length;
        const motions_censure = motions.filter((m) =>
          m.motion_type.toLowerCase().includes("censura"),
        ).length;

        // Upsert en legislatormetrics para asegurar consistencia
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
            total_motions,
            motions_greeting,
            motions_interpellation,
            motions_censure,
            total_information_requests: 0,
            last_updated: new Date(),
          },
          update: {
            total_motions,
            motions_greeting,
            motions_interpellation,
            motions_censure,
            last_updated: new Date(),
          },
        });
      } catch (metricsErr) {
        console.error(
          `Error actualizando métricas de mociones para legislador ${legislatorId}:`,
          metricsErr,
        );
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error en POST webhooks/motions:", error);
    return NextResponse.json(
      { error: "Error interno procesando mociones" },
      { status: 500 },
    );
  }
}
