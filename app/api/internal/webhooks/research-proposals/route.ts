import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { revalidateTag, revalidatePath } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { BackgroundStatus, BackgroundType } from "@/interfaces/background";
import { Prisma } from "@/prisma/generated/client";
import { normalizeFindingData } from "@/interfaces/research";

function revalidatePersonEcosystem() {
  revalidatePath("/admin/personas");
  revalidatePath("/admin/candidatos");
  revalidatePath("/admin/candidatos/revisiones");
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

    // 1. Si este candidato se está reintentando, eliminar registros previos de error en este lote
    const personBatchPairs = Array.from(
      new Set(
        proposals
          .filter((p) => p.person_id && p.batch_run_id)
          .map((p) => `${p.person_id}:::${p.batch_run_id}`),
      ),
    );

    const cleanupOps = personBatchPairs.map((pair) => {
      const [person_id, batch_run_id] = pair.split(":::");
      return prisma.research_proposals.deleteMany({
        where: {
          person_id,
          batch_run_id,
          OR: [{ action: "ERROR" }, { status: "FAILED" }],
        },
      });
    });

    const createOps = proposals.map((p) => {
      const rawData = (p.proposed_data || {}) as Record<string, unknown>;
      const normalizedData = normalizeFindingData(rawData);
      const action = String(p.action || "INSERT").toUpperCase();

      // Determinar status seguro: IGNORE nunca puede ser PENDING
      let status = String(p.status || "PENDING").toUpperCase();
      if (action === "IGNORE") {
        status = "REJECTED";
      } else if (
        action !== "NONE" &&
        action !== "ERROR" &&
        normalizedData.title === "Hallazgo Web" &&
        normalizedData.summary === "Sin resumen"
      ) {
        // Descartar automáticamente registros vacíos / basura
        status = "REJECTED";
      }

      return prisma.research_proposals.create({
        data: {
          id: createId(),
          person_id: String(p.person_id),
          batch_run_id: p.batch_run_id ? String(p.batch_run_id) : null,
          action: action,
          target_id: p.target_id ? String(p.target_id) : null,
          reason: String(p.reason || ""),
          confidence: typeof p.confidence === "number" ? p.confidence : 0.8,
          status: status,
          proposed_data: normalizedData as unknown as Prisma.InputJsonValue,
        },
      });
    });

    const txResults = await prisma.$transaction([...cleanupOps, ...createOps]);

    const createdProposals = txResults.slice(cleanupOps.length);

    // Si vienen propuestas auto-aprobadas con acción real
    for (const prop of createdProposals) {
      if (
        prop &&
        "status" in prop &&
        prop.status === "APPROVED" &&
        "action" in prop &&
        prop.action !== "NONE" &&
        prop.action !== "ERROR"
      ) {
        await applyProposalDirect(
          prop as Parameters<typeof applyProposalDirect>[0],
        );
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
  const rawData = (proposal.proposed_data || {}) as Record<string, unknown>;
  const normalized = normalizeFindingData(rawData);
  const isBackground = ["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(
    normalized.type,
  );

  if (isBackground) {
    const typeEnum = normalized.type as BackgroundType;
    const statusEnum = (
      [
        "EN_INVESTIGACION",
        "SENTENCIADO",
        "SANCIONADO",
        "ARCHIVADO",
        "ABSUELTO",
        "PRESCRITO",
      ].includes(normalized.status)
        ? normalized.status
        : "EN_INVESTIGACION"
    ) as BackgroundStatus;

    if (proposal.action === "INSERT") {
      const bgId = createId();
      await prisma.background.create({
        data: {
          id: bgId,
          person_id: proposal.person_id,
          publication_date: normalized.publication_date,
          type: typeEnum,
          status: statusEnum,
          summary: normalized.summary,
          sanction: normalized.sanction,
          source: normalized.source,
          source_url: normalized.source_url,
          title: normalized.title,
        },
      });
      await prisma.research_proposals.update({
        where: { id: proposal.id },
        data: { target_id: bgId },
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
              normalized.publication_date || existing.publication_date,
            type: typeEnum,
            status: statusEnum,
            summary: normalized.summary || existing.summary,
            sanction: normalized.sanction || existing.sanction,
            source: normalized.source || existing.source,
            source_url: normalized.source_url || existing.source_url,
            title: normalized.title || existing.title,
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
        ? [...(person.posturas as Record<string, unknown>[])]
        : [];

      const postureId = proposal.target_id || createId();

      const newItem = {
        id: postureId,
        title: normalized.title,
        type: normalized.type,
        date: normalized.publication_date || "",
        description: normalized.summary,
        source: normalized.source,
        source_url: normalized.source_url,
      };

      if (proposal.action === "INSERT") {
        bio.push(newItem);
        await prisma.research_proposals.update({
          where: { id: proposal.id },
          data: { target_id: postureId },
        });
      } else if (proposal.action === "UPDATE") {
        const idx = bio.findIndex(
          (b) =>
            (proposal.target_id && b.id === proposal.target_id) ||
            (newItem.source_url && b.source_url === newItem.source_url),
        );
        if (idx >= 0) {
          bio[idx] = { ...bio[idx], ...newItem };
        } else {
          bio.push(newItem);
        }
      }

      await prisma.person.update({
        where: { id: proposal.person_id },
        data: {
          posturas: bio as Prisma.InputJsonValue[],
          updated_at: new Date(),
        },
      });
    }
  }

  revalidatePersonEcosystem();
}
