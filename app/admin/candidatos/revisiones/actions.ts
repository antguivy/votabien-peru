"use server";

import { prisma } from "@/lib/prisma";
import { serverRequireReviewer } from "@/lib/auth-actions";
import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { createId } from "@paralleldrive/cuid2";
import { BackgroundStatus, BackgroundType } from "@/interfaces/background";
import { Prisma } from "@/prisma/generated/client";

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

    const data = (customData || finding.proposed_data) as Record<
      string,
      unknown
    >;
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

      if (finding.action === "INSERT") {
        await prisma.background.create({
          data: {
            id: createId(),
            person_id: finding.person_id,
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
      } else if (finding.action === "UPDATE" && finding.target_id) {
        const existing = await prisma.background.findUnique({
          where: { id: finding.target_id },
        });

        if (existing) {
          await prisma.background.update({
            where: { id: finding.target_id },
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
        const titleVal = String(
          data.title ||
            data.titulo ||
            (data.tema
              ? `${data.tema} - Declaración`
              : "Noticia / Declaración"),
        );
        const newItem = {
          id: finding.target_id || createId(),
          title: titleVal,
          type: String(data.tema || data.type || data.tipo || "NOTICIA"),
          date: String(data.fecha || data.date || data.publication_date || ""),
          description: String(
            data.redaccion_final ||
              data.description ||
              data.summary ||
              data.descripcion ||
              data.hecho ||
              "",
          ),
          source: String(
            data.fuente_normalizada || data.source || data.fuente || "Web",
          ),
          source_url:
            data.fuente_url || data.source_url
              ? String(data.fuente_url || data.source_url)
              : null,
        };

        if (finding.action === "INSERT") {
          bio.push(newItem);
        } else if (finding.action === "UPDATE") {
          const idx = bio.findIndex(
            (b) =>
              (finding.target_id && b.id === finding.target_id) ||
              (newItem.source_url && b.source_url === newItem.source_url),
          );
          if (idx >= 0) {
            bio[idx] = { ...bio[idx], ...newItem };
          } else {
            bio.push(newItem);
          }
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
