"use server";

import { createId } from "@paralleldrive/cuid2";
import { revalidatePath, revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { serverRequireAdmin } from "@/lib/auth-actions";
import { TAGS } from "@/lib/cache-tags";
import { API_BASE_URL } from "@/lib/config";
import { extractErrorMessage } from "@/lib/error-handler";
import { isBlockedSourceUrl } from "@/lib/blocked-sources";
import { BackgroundBase } from "@/interfaces/background";
import { BiographyDetail } from "@/interfaces/person";
import { Prisma } from "@/prisma/generated/client";

function revalidatePersonEcosystem() {
  revalidatePath("/admin/personas");
  revalidatePath("/admin/candidatos");
  revalidatePath("/admin/candidatos/revisiones");
  revalidateTag(TAGS.persons, "max");
  revalidateTag(TAGS.candidates, "max");
  revalidateTag(TAGS.legislators, "max");
}

/**
 * Encola la investigación batch de un conjunto de personas en el servicio Python.
 * Solo editores/admins: el pipeline corre en la máquina del operador (IP residencial).
 */
export async function queueBatchResearch(personIds: string[]) {
  await serverRequireAdmin();
  try {
    const batch_run_id = createId();
    const persons = await prisma.person.findMany({
      where: { id: { in: personIds } },
      select: {
        id: true,
        fullname: true,
        posturas: true,
        background: {
          select: {
            id: true,
            type: true,
            status: true,
            title: true,
            summary: true,
            sanction: true,
            publication_date: true,
            source: true,
            source_url: true,
          },
        },
      },
    });

    const candidates = persons.map((p) => ({
      person_id: p.id,
      fullname: p.fullname,
      existing_backgrounds: p.background,
      existing_posturas: p.posturas || [],
    }));

    const response = await fetch(`${API_BASE_URL}/api/v1/research/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
      },
      body: JSON.stringify({
        batch_run_id,
        candidates,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return { success: true, batch_run_id };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function getBatchResearchProgress(batch_run_id: string) {
  await serverRequireAdmin();
  try {
    const proposals = await prisma.research_proposals.findMany({
      where: { batch_run_id },
      select: { person_id: true },
    });

    // Group by person to know how many distinct persons have generated proposals
    const processedPersonIds = new Set(proposals.map((p) => p.person_id));

    return {
      success: true,
      processedCount: processedPersonIds.size,
      totalProposals: proposals.length,
    };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

/**
 * Guarda los resultados del research INDIVIDUAL como propuestas PENDING
 * en la bandeja de revisiones (/admin/candidatos/revisiones).
 * No escribe directo al perfil público: siempre pasa por revisión humana.
 */
export async function queueResearchProposals(
  personId: string,
  backgrounds: BackgroundBase[],
  biography: BiographyDetail[],
) {
  await serverRequireAdmin();
  try {
    const batch_run_id = createId();

    const existingPerson = await prisma.person.findUnique({
      where: { id: personId },
      select: {
        background: {
          select: {
            id: true,
            title: true,
            source_url: true,
            type: true,
            status: true,
          },
        },
        posturas: true,
      },
    });

    const existingBgs = existingPerson?.background || [];
    const existingPosturas = Array.isArray(existingPerson?.posturas)
      ? (existingPerson?.posturas as Record<string, unknown>[])
      : [];

    const backgroundProposals = backgrounds
      .filter((b) => !isBlockedSourceUrl(b.source_url))
      .map((ant) => {
        const cleanUrl = ant.source_url?.trim() || "";
        const cleanTitle = (ant.title || "").trim().toLowerCase();

        // Detectar si ya existe en BD para proponer UPDATE en vez de INSERT
        const matchedBg = existingBgs.find((ex) => {
          if (cleanUrl && ex.source_url && ex.source_url.trim() === cleanUrl)
            return true;
          if (
            cleanTitle &&
            ex.title &&
            ex.title.trim().toLowerCase() === cleanTitle
          )
            return true;
          return false;
        });

        const action = matchedBg ? "UPDATE" : "INSERT";
        const target_id = matchedBg ? matchedBg.id : null;
        const titleVal = ant.title || "Hallazgo Web";
        const summaryVal = ant.summary || "";
        const typeVal = ant.type as string;
        const statusVal = ant.status as string;
        const sanctionVal = ant.sanction || null;
        const sourceVal = ant.source || "Web";
        const dateVal = ant.publication_date || null;

        return {
          person_id: personId,
          batch_run_id,
          action,
          target_id,
          reason: matchedBg
            ? `Actualización de antecedente existente — ${sourceVal}`
            : `Investigación individual IA — ${sourceVal}`,
          confidence: 0.85,
          status: "PENDING",
          proposed_data: {
            title: titleVal,
            titulo: titleVal,
            type: typeVal,
            tipo: typeVal,
            status: statusVal,
            estado: statusVal,
            summary: summaryVal,
            descripcion: summaryVal,
            description: summaryVal,
            redaccion_final: summaryVal,
            sanction: sanctionVal,
            sancion: sanctionVal,
            source: sourceVal,
            fuente: sourceVal,
            fuente_normalizada: sourceVal,
            source_url: cleanUrl || null,
            fuente_url: cleanUrl || null,
            publication_date: dateVal,
            fecha: dateVal,
            date: dateVal,
          } as Prisma.InputJsonValue,
        };
      });

    const newsProposals = biography
      .filter((n) => !isBlockedSourceUrl(n.source_url))
      .map((pos) => {
        const cleanUrl = pos.source_url?.trim() || "";
        const cleanTitle = (pos.title || "").trim().toLowerCase();
        const cleanDesc = (pos.description || "").trim().toLowerCase();

        // Detectar si ya existe en posturas
        const matchedPos = existingPosturas.find((ex) => {
          const exUrl = String(ex.source_url || ex.fuente_url || "").trim();
          const exTitle = String(ex.title || ex.titulo || "")
            .trim()
            .toLowerCase();
          const exDesc = String(
            ex.description || ex.redaccion_final || ex.hecho || "",
          )
            .trim()
            .toLowerCase();

          if (cleanUrl && exUrl && cleanUrl === exUrl) return true;
          if (cleanTitle && exTitle && cleanTitle === exTitle) return true;
          if (
            cleanDesc &&
            exDesc &&
            cleanDesc.length > 30 &&
            (cleanDesc === exDesc || exDesc.includes(cleanDesc))
          )
            return true;
          return false;
        });

        const action = matchedPos ? "UPDATE" : "INSERT";
        const target_id =
          matchedPos && typeof matchedPos.id === "string"
            ? matchedPos.id
            : null;
        const titleVal =
          pos.title ||
          (pos.type
            ? `${pos.type} - ${pos.date || "Declaración"}`
            : "Noticia / Declaración");
        const summaryVal = pos.description || "";
        const typeVal = pos.type || "NOTICIA";
        const sourceVal = pos.source || "Web";
        const dateVal = pos.date || null;

        return {
          person_id: personId,
          batch_run_id,
          action,
          target_id,
          reason: matchedPos
            ? `Actualización de noticia existente — ${sourceVal}`
            : `Noticia detectada por IA — ${sourceVal}`,
          confidence: 0.85,
          status: "PENDING",
          proposed_data: {
            title: titleVal,
            titulo: titleVal,
            type: typeVal,
            tipo: typeVal,
            tema: typeVal,
            summary: summaryVal,
            descripcion: summaryVal,
            description: summaryVal,
            redaccion_final: summaryVal,
            source: sourceVal,
            fuente: sourceVal,
            fuente_normalizada: sourceVal,
            source_url: cleanUrl || null,
            fuente_url: cleanUrl || null,
            publication_date: dateVal,
            fecha: dateVal,
            date: dateVal,
          } as Prisma.InputJsonValue,
        };
      });

    const allProposals = [...backgroundProposals, ...newsProposals];

    if (allProposals.length === 0) {
      return {
        success: false,
        error: "No hay hallazgos válidos para enviar a revisión.",
      };
    }

    await prisma.research_proposals.createMany({ data: allProposals });

    revalidatePersonEcosystem();

    return {
      success: true,
      count: allProposals.length,
      batch_run_id,
    };
  } catch (error) {
    console.error("Error en queueResearchProposals:", error);
    return { success: false, error: extractErrorMessage(error) };
  }
}
