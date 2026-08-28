"use server";

import { prisma } from "@/lib/prisma";
import { serverRequireReviewer } from "@/lib/auth-actions";
import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { createId } from "@paralleldrive/cuid2";
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

export async function getExistingBackgroundForDiff(targetId: string) {
  await serverRequireReviewer();
  try {
    const bg = await prisma.background.findUnique({
      where: { id: targetId },
    });
    return { success: true, data: bg };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al obtener antecedente";
    return { success: false, error: message };
  }
}

export async function rejectResearchFinding(findingId: string) {
  const { user } = await serverRequireReviewer();

  try {
    await prisma.research_proposals.update({
      where: { id: findingId },
      data: {
        status: "REJECTED",
        reviewed_at: new Date(),
        reviewed_by: user.email || user.id,
      },
    });

    revalidatePersonEcosystem();
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al rechazar hallazgo";
    return { success: false, error: message };
  }
}

export async function bulkRejectFindings(findingIds: string[]) {
  const { user } = await serverRequireReviewer();

  if (!findingIds || findingIds.length === 0) {
    return {
      success: false,
      error: "No se seleccionaron hallazgos para rechazar.",
    };
  }

  try {
    await prisma.research_proposals.updateMany({
      where: {
        id: { in: findingIds },
        status: "PENDING",
      },
      data: {
        status: "REJECTED",
        reviewed_at: new Date(),
        reviewed_by: user.email || user.id,
      },
    });

    revalidatePersonEcosystem();
    return { success: true, count: findingIds.length };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error en rechazo masivo";
    return { success: false, error: message };
  }
}

export async function applyResearchFinding(
  findingId: string,
  customData?: Record<string, unknown>,
) {
  const { user } = await serverRequireReviewer();

  try {
    const finding = await prisma.research_proposals.findUnique({
      where: { id: findingId },
    });

    if (!finding || finding.status !== "PENDING") {
      throw new Error("El hallazgo no es válido o ya fue procesado.");
    }

    const rawData = (customData || finding.proposed_data) as Record<
      string,
      unknown
    >;
    const normalized = normalizeFindingData(rawData);
    const isBackground = ["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(
      normalized.type,
    );

    let finalTargetId = finding.target_id;

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

      if (finding.action === "INSERT") {
        const bgId = createId();
        finalTargetId = bgId;

        await prisma.background.create({
          data: {
            id: bgId,
            person_id: finding.person_id,
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
      } else if (finding.action === "UPDATE" && finding.target_id) {
        const existing = await prisma.background.findUnique({
          where: { id: finding.target_id },
        });

        if (existing) {
          await prisma.background.update({
            where: { id: finding.target_id },
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

      // Recalcular Flags Penales y Éticos en Person
      const allBgs = await prisma.background.findMany({
        where: { person_id: finding.person_id },
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
        where: { id: finding.person_id },
        data: {
          has_criminal_record,
          has_penal_sentence,
          has_sanction,
          is_under_investigation,
          updated_at: new Date(),
        },
      });
    } else {
      // Es una Noticia o Postura
      const person = await prisma.person.findUnique({
        where: { id: finding.person_id },
        select: { posturas: true },
      });

      if (person) {
        const bio = Array.isArray(person.posturas)
          ? [...(person.posturas as Record<string, unknown>[])]
          : [];

        const postureId = finding.target_id || createId();
        finalTargetId = postureId;

        const newItem = {
          id: postureId,
          title: normalized.title,
          type: normalized.type,
          date: normalized.publication_date || "",
          description: normalized.summary,
          source: normalized.source,
          source_url: normalized.source_url,
        };

        // Deduplicación inteligente: por ID o por URL de fuente
        const existingIdx = bio.findIndex(
          (b) =>
            b.id === postureId ||
            (newItem.source_url &&
              b.source_url &&
              b.source_url === newItem.source_url),
        );

        if (existingIdx >= 0) {
          bio[existingIdx] = { ...bio[existingIdx], ...newItem };
        } else {
          bio.push(newItem);
        }

        await prisma.person.update({
          where: { id: finding.person_id },
          data: {
            posturas: bio as Prisma.InputJsonValue[],
            updated_at: new Date(),
          },
        });
      }
    }

    await prisma.research_proposals.update({
      where: { id: findingId },
      data: {
        status: "APPROVED",
        target_id: finalTargetId,
        reviewed_at: new Date(),
        reviewed_by: user.email || user.id,
      },
    });

    revalidatePersonEcosystem();
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al aplicar hallazgo";
    console.error("Error en applyResearchFinding:", error);
    return { success: false, error: message };
  }
}

export async function revertResearchFinding(findingId: string) {
  await serverRequireReviewer();

  try {
    const finding = await prisma.research_proposals.findUnique({
      where: { id: findingId },
    });

    if (!finding || finding.status !== "APPROVED") {
      throw new Error("El hallazgo no se encuentra en estado aprobado.");
    }

    const rawData = finding.proposed_data as Record<string, unknown>;
    const normalized = normalizeFindingData(rawData);
    const isBackground = ["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(
      normalized.type,
    );

    if (isBackground) {
      if (finding.action === "INSERT" && finding.target_id) {
        // Eliminar antecedente creado
        await prisma.background.deleteMany({
          where: { id: finding.target_id },
        });
      } else if (finding.action === "UPDATE" && finding.target_id) {
        // Restaurar versión previa si existía
        const existingBg = await prisma.background.findUnique({
          where: { id: finding.target_id },
        });
        if (existingBg && existingBg.previous_version) {
          const prev = existingBg.previous_version as Record<string, unknown>;
          await prisma.background.update({
            where: { id: finding.target_id },
            data: {
              title: String(prev.title || existingBg.title),
              summary: String(prev.summary || existingBg.summary),
              type: prev.type as BackgroundType,
              status: prev.status as BackgroundStatus,
              publication_date: prev.publication_date
                ? String(prev.publication_date)
                : null,
              sanction: prev.sanction ? String(prev.sanction) : null,
              source: String(prev.source || existingBg.source),
              source_url: prev.source_url ? String(prev.source_url) : null,
              previous_version: Prisma.DbNull,
              updated_at: new Date(),
            },
          });
        }
      }

      // Recalcular flags penales de la persona
      const allBgs = await prisma.background.findMany({
        where: { person_id: finding.person_id },
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
        where: { id: finding.person_id },
        data: {
          has_criminal_record,
          has_penal_sentence,
          has_sanction,
          is_under_investigation,
          updated_at: new Date(),
        },
      });
    } else {
      // Revertir Postura / Noticia
      const person = await prisma.person.findUnique({
        where: { id: finding.person_id },
        select: { posturas: true },
      });

      if (person && Array.isArray(person.posturas)) {
        const bio = person.posturas as Record<string, unknown>[];
        const filteredBio = bio.filter((p) => {
          if (finding.target_id && p.id === finding.target_id) return false;
          if (normalized.source_url && p.source_url === normalized.source_url)
            return false;
          return true;
        });

        await prisma.person.update({
          where: { id: finding.person_id },
          data: {
            posturas: filteredBio as Prisma.InputJsonValue[],
            updated_at: new Date(),
          },
        });
      }
    }

    // Revertir propuesta a PENDING
    await prisma.research_proposals.update({
      where: { id: findingId },
      data: {
        status: "PENDING",
        reviewed_at: null,
        reviewed_by: null,
      },
    });

    revalidatePersonEcosystem();
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al revertir hallazgo";
    console.error("Error en revertResearchFinding:", error);
    return { success: false, error: message };
  }
}

export async function bulkApplyFindings(findingIds: string[]) {
  await serverRequireReviewer();

  if (!findingIds || findingIds.length === 0) {
    return {
      success: false,
      error: "No se seleccionaron hallazgos para aprobar.",
    };
  }

  try {
    let appliedCount = 0;
    const errors: string[] = [];

    for (const id of findingIds) {
      const res = await applyResearchFinding(id);
      if (res.success) {
        appliedCount++;
      } else {
        errors.push(`ID ${id}: ${res.error}`);
      }
    }

    revalidatePersonEcosystem();
    return {
      success: appliedCount > 0,
      count: appliedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error en aprobación masiva";
    return { success: false, error: message };
  }
}
