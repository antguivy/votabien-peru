import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { API_BASE_URL } from "@/lib/config";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ personId: string }> },
) {
  try {
    const sessionResponse = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionResponse || !sessionResponse.session) {
      return NextResponse.json({ detail: "No autorizado" }, { status: 401 });
    }

    const { personId } = await context.params;

    const candidate = await prisma.candidate.findFirst({
      where: { person_id: personId, active: true },
      include: {
        person: {
          include: { background: true },
        },
        politicalparty: true,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { detail: "Candidato activo no encontrado para este person_id" },
        { status: 404 },
      );
    }

    const person = candidate.person;
    const party = candidate.politicalparty;

    const payload = {
      person_id: personId,
      fullname: person?.fullname || "Candidato Desconocido",
      party_name: party?.name || "Partido Desconocido",
      detailed_biography: Array.isArray(person?.detailed_biography)
        ? person.detailed_biography
        : [],
      backgrounds: Array.isArray(person?.background) ? person.background : [],
      government_plan: Array.isArray(party?.government_plan_summary)
        ? party.government_plan_summary
        : [],
    };

    const embedRes = await fetch(`${API_BASE_URL}/api/v1/ai/embed_builder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!embedRes.ok) {
      const txt = await embedRes.text();
      return NextResponse.json(
        { detail: `Error de IA: ${txt}` },
        { status: 500 },
      );
    }

    const { data: embeddingsToInsert } = await embedRes.json();

    if (!embeddingsToInsert || embeddingsToInsert.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No hay datos para vectorizar en ${payload.fullname}`,
      });
    }

    // Delete old
    await prisma.person_embeddings.deleteMany({
      where: { person_id: personId },
    });

    // Insert new using raw query because of vector type
    for (const item of embeddingsToInsert) {
      const rawVector = `[${item.embedding.join(",")}]`;
      const metadataStr = JSON.stringify(item.metadata || {});

      await prisma.$executeRawUnsafe(
        `
        INSERT INTO person_embeddings (person_id, content, chunk_type, metadata, embedding)
        VALUES ($1, $2, $3, $4::jsonb, $5::vector)
      `,
        personId,
        item.content,
        item.chunk_type,
        metadataStr,
        rawVector,
      );
    }

    return NextResponse.json({
      success: true,
      message: `Se generaron y guardaron ${embeddingsToInsert.length} vectores para ${payload.fullname}.`,
    });
  } catch (error: unknown) {
    console.error("Error generating embeddings:", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { detail: `Error interno: ${message}` },
      { status: 500 },
    );
  }
}
