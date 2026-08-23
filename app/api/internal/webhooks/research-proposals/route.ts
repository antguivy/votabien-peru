import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { revalidateTag, revalidatePath } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { BackgroundStatus, BackgroundType } from "@/interfaces/background";
import { Prisma } from "@/prisma/generated/client";

function revalidatePersonEcosystem() {
  revalidatePath("/admin/personas");
  revalidatePath("/admin/personas/revisiones");
  revalidateTag(TAGS.persons, "max");
  revalidateTag(TAGS.candidates, "max");
  revalidateTag(TAGS.legislators, "max");
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const secretKey = process.env.API_SECRET_KEY;

    if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { proposals } = body;

    if (!proposals || !Array.isArray(proposals)) {
      return NextResponse.json(
        { error: "Payload inválido: se esperaba un array 'proposals'" },
        { status: 400 },
      );
    }

    const createdProposals = await prisma.$transaction(
      proposals.map((p) =>
        prisma.research_proposals.create({
          data: {
            id: createId(),
            person_id: String(p.person_id),
            batch_run_id: p.batch_run_id ? String(p.batch_run_id) : null,
            action: String(p.action || "INSERT"),
            target_id: p.target_id ? String(p.target_id) : null,
            reason: String(p.reason || ""),
            confidence: typeof p.confidence === "number" ? p.confidence : 0.8,
            status: String(p.status || "PENDING"),
            proposed_data: (p.proposed_data || {}) as Prisma.InputJsonValue,
          },
        }),
      ),
    );

    // Si vienen propuestas auto-aprobadas con acción real
    for (const prop of createdProposals) {
      if (prop.status === "APPROVED" && prop.action !== "NONE") {
        await applyProposalDirect(prop);
      }
    }

    return NextResponse.json({
      success: true,
      count: createdProposals.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno";
    console.error("Error en webhook de research-proposals:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}

async function applyProposalDirect(proposal: {
  id: string;
  person_id: string;
  action: string;
  target_id: string | null;
  proposed_data: unknown;
}) {
  const data = (proposal.proposed_data || {}) as Record<string, unknown>;
  const rawType = String(data.type || data.tipo || "")
    .toUpperCase()
    .trim();
  const isBackground = ["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(
    rawType,
  );

  if (isBackground) {
    const typeEnum = rawType as BackgroundType;
    const rawStatus = String(data.status || data.estado || "EN_INVESTIGACION")
      .toUpperCase()
      .trim();
    const statusEnum = (
      [
        "EN_INVESTIGACION",
        "SENTENCIADO",
        "SANCIONADO",
        "ARCHIVADO",
        "ABSUELTO",
        "PRESCRITO",
      ].includes(rawStatus)
        ? rawStatus
        : "EN_INVESTIGACION"
    ) as BackgroundStatus;

    if (proposal.action === "INSERT") {
      await prisma.background.create({
        data: {
          id: createId(),
          person_id: proposal.person_id,
          publication_date:
            data.publication_date || data.fecha
              ? String(data.publication_date || data.fecha)
              : null,
          type: typeEnum,
          status: statusEnum,
          summary: String(
            data.summary || data.redaccion_final || data.descripcion || "",
          ),
          sanction:
            data.sanction || data.sancion
              ? String(data.sanction || data.sancion)
              : null,
          source: String(
            data.source || data.fuente_normalizada || data.fuente || "Web",
          ),
          source_url:
            data.source_url || data.fuente_url
              ? String(data.source_url || data.fuente_url)
              : null,
          title: String(data.title || data.titulo || "Hallazgo Web"),
        },
      });
    } else if (proposal.action === "UPDATE" && proposal.target_id) {
      const existing = await prisma.background.findUnique({
        where: { id: proposal.target_id },
      });
      if (existing) {
        await prisma.background.update({
          where: { id: proposal.target_id },
          data: {
            publication_date:
              data.publication_date || data.fecha
                ? String(data.publication_date || data.fecha)
                : existing.publication_date,
            type: typeEnum,
            status: statusEnum,
            summary: String(
              data.summary ||
                data.redaccion_final ||
                data.descripcion ||
                existing.summary,
            ),
            sanction:
              data.sanction || data.sancion
                ? String(data.sanction || data.sancion)
                : existing.sanction,
            source: String(
              data.source ||
                data.fuente_normalizada ||
                data.fuente ||
                existing.source,
            ),
            source_url:
              data.source_url || data.fuente_url
                ? String(data.source_url || data.fuente_url)
                : existing.source_url,
            title: String(data.title || data.titulo || existing.title),
            previous_version: existing as unknown as Prisma.InputJsonValue,
            updated_at: new Date(),
          },
        });
      }
    }

    // Recalcular flags penales y éticos de la persona
    const allBgs = await prisma.background.findMany({
      where: { person_id: proposal.person_id },
      select: { type: true, status: true },
    });

    const has_criminal_record = allBgs.some(
      (b) =>
        b.type === "PENAL" &&
        ["EN_INVESTIGACION", "SENTENCIADO"].includes(b.status),
    );
    const has_penal_sentence = allBgs.some(
      (b) => b.type === "PENAL" && b.status === "SENTENCIADO",
    );
    const has_sanction = allBgs.some(
      (b) =>
        ["ETICA", "ADMINISTRATIVO"].includes(b.type) &&
        b.status === "SANCIONADO",
    );
    const is_under_investigation = allBgs.some(
      (b) => b.status === "EN_INVESTIGACION",
    );

    await prisma.person.update({
      where: { id: proposal.person_id },
      data: {
        has_criminal_record,
        has_penal_sentence,
        has_sanction,
        is_under_investigation,
        updated_at: new Date(),
      },
    });
  } else {
    // Es noticia o postura
    const person = await prisma.person.findUnique({
      where: { id: proposal.person_id },
      select: { posturas: true },
    });
    if (person) {
      const bio = Array.isArray(person.posturas)
        ? [...(person.posturas as Prisma.InputJsonValue[])]
        : [];
      bio.push({
        type: String(data.tema || data.type || "NOTICIA"),
        date: String(data.fecha || data.date || ""),
        description: String(
          data.redaccion_final || data.description || data.summary || "",
        ),
        source: String(data.fuente_normalizada || data.source || "Web"),
        source_url:
          data.fuente_url || data.source_url
            ? String(data.fuente_url || data.source_url)
            : null,
      });

      await prisma.person.update({
        where: { id: proposal.person_id },
        data: { posturas: bio, updated_at: new Date() },
      });
    }
  }

  revalidatePersonEcosystem();
}
