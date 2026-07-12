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
      errors: [] as string[],
    };

    for (const data of payload) {
      try {
        if (!data.number || !data.legislator_id || !data.submission_date) {
          results.errors.push(
            `Faltan campos obligatorios en el proyecto: ${data.number || "desconocido"}`,
          );
          continue;
        }

        const existingBill = await prisma.bill.findUnique({
          where: { number: data.number },
        });

        if (existingBill) {
          await prisma.bill.update({
            where: { number: data.number },
            data: {
              title: data.title,
              summary: data.summary,
              approval_status:
                data.approval_status || existingBill.approval_status,
              approval_date: data.approval_date
                ? new Date(data.approval_date)
                : null,
              committees: data.committees,
              document_url: data.document_url,
              title_ai: data.title_ai,
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
              submission_date: new Date(data.submission_date),
              approval_status: data.approval_status || "PRESENTADO",
              approval_date: data.approval_date
                ? new Date(data.approval_date)
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
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error desconocido";
        results.errors.push(
          `Error procesando proyecto ${data.number}: ${message}`,
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
