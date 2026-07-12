import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";

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

    const body = await request.json();
    const { attendances, metrics } = body;

    if (!Array.isArray(attendances) || !Array.isArray(metrics)) {
      return NextResponse.json(
        {
          error:
            "Payload inválido. Se requieren arrays 'attendances' y 'metrics'",
        },
        { status: 400 },
      );
    }

    const results = {
      attendances_added: 0,
      metrics_updated: 0,
      errors: [] as string[],
    };

    // Transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Insert attendances
      for (const record of attendances) {
        if (
          !record.legislator_id ||
          !record.date ||
          !record.session_type ||
          !record.attendance_status
        ) {
          results.errors.push(
            `Registro de asistencia inválido para legislator: ${record.legislator_id}`,
          );
          continue;
        }

        await tx.attendance.create({
          data: {
            id: createId(),
            legislator_id: record.legislator_id,
            date: new Date(record.date),
            session_type: record.session_type,
            attendance_status: record.attendance_status,
            notes: record.notes,
          },
        });
        results.attendances_added++;
      }

      // 2. Update metrics
      for (const metric of metrics) {
        if (!metric.legislator_id) continue;

        await tx.legislatormetrics.updateMany({
          where: { legislator_id: metric.legislator_id },
          data: {
            total_sessions: metric.total_sessions,
            sessions_present: metric.sessions_present,
            sessions_absent: metric.sessions_absent,
            sessions_justified: metric.sessions_justified,
            sessions_license: metric.sessions_license,
            attendance_rate: metric.attendance_rate,
            last_updated: new Date(),
          },
        });
        results.metrics_updated++;
      }
    });

    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (error) {
    console.error("Error en webhook de attendance:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
