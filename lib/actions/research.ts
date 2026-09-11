"use server";

import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { serverRequireAdmin } from "@/lib/auth-actions";
import { API_BASE_URL } from "@/lib/config";
import { extractErrorMessage } from "@/lib/error-handler";
import { isBlockedSourceUrl } from "@/lib/blocked-sources";
import { BackgroundBase } from "@/interfaces/background";
import { BiographyDetail } from "@/interfaces/person";
import { Prisma } from "@/prisma/generated/client";
import { revalidatePersonEcosystem } from "@/lib/cache-revalidate";

/**
 * Encola la investigación batch de un conjunto de personas en el servicio Python.
 * Solo editores/admins: el pipeline corre en la máquina del operador (IP residencial).
 */
export async function queueBatchResearch(
  personIds: string[],
  workflowId?: string,
) {
  await serverRequireAdmin();
  try {
    const batch_run_id = createId();

    let compressor_prompt = "";
    let compressor_model = "gemini-3.5-flash-lite";
    let validator_prompt = "";
    let validator_model = "gemini-3.6-flash";
    let include_news = true;
    let include_youtube = false;

    if (workflowId) {
      const wf = await prisma.ai_workflow.findUnique({
        where: { id: workflowId },
      });
      if (wf) {
        compressor_prompt = wf.compressor_prompt || "";
        compressor_model = wf.compressor_model || "gemini-3.5-flash-lite";
        validator_prompt = wf.validator_prompt || "";
        validator_model = wf.validator_model || "gemini-3.6-flash";
        include_news =
          wf.sources.includes("search_web") ||
          wf.sources.includes("search_jne");
        include_youtube = wf.sources.includes("search_youtube");
      }
    }

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
        compressor_prompt,
        compressor_model,
        validator_prompt,
        validator_model,
        include_news,
        include_youtube,
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
      select: { person_id: true, status: true, action: true },
    });

    const allPersonIds = new Set(proposals.map((p) => p.person_id));
    const failedPersonIds = new Set(
      proposals
        .filter((p) => p.status === "FAILED" || p.action === "ERROR")
        .map((p) => p.person_id),
    );
    const successPersonIds = Array.from(allPersonIds).filter(
      (id) => !failedPersonIds.has(id),
    );

    return {
      success: true,
      processedCount: allPersonIds.size,
      completedCount: successPersonIds.length,
      failedCount: failedPersonIds.size,
      failedPersonIds: Array.from(failedPersonIds),
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

        // 1. Usar directamente la decisión del motor de deduplicación si viene provista
        let action = ant.action;
        let target_id =
          ant.target_id || (ant.id && ant.id !== "" ? ant.id : null);
        let reason = ant.reason;

        // 2. Fallback solo si no vino clasificado desde Python
        if (!action) {
          const antUrls = cleanUrl
            ? cleanUrl
                .split(",")
                .map((u) => u.trim().toLowerCase())
                .filter(Boolean)
            : [];

          const matchedBg = existingBgs.find((ex) => {
            if (antUrls.length > 0 && ex.source_url) {
              const exUrls = ex.source_url
                .split(",")
                .map((u) => u.trim().toLowerCase())
                .filter(Boolean);
              if (antUrls.some((u) => exUrls.includes(u))) return true;
            }
            if (
              cleanTitle &&
              ex.title &&
              ex.title.trim().toLowerCase() === cleanTitle
            )
              return true;
            return false;
          });

          action = matchedBg ? "UPDATE" : "INSERT";
          target_id = matchedBg ? matchedBg.id : null;
        }

        const titleVal = ant.title || "Hallazgo Web";
        const summaryVal = ant.summary || "";
        const typeVal = ant.type as string;
        const statusVal = ant.status as string;
        const sanctionVal = ant.sanction || null;
        const sourceVal = ant.source || "Web";
        const dateVal = ant.publication_date || null;

        if (!reason) {
          reason =
            action === "UPDATE"
              ? `Actualización de antecedente existente — ${sourceVal}`
              : `Investigación individual IA — ${sourceVal}`;
        }

        return {
          person_id: personId,
          batch_run_id,
          action,
          target_id,
          reason,
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

        // 1. Usar directamente la decisión del motor de deduplicación si viene provista
        let action = pos.action;
        let target_id =
          pos.target_id || (pos.id && pos.id !== "" ? pos.id : null);
        let reason = pos.reason;

        // 2. Fallback solo si no vino clasificado desde Python
        if (!action) {
          const posUrls = cleanUrl
            ? cleanUrl
                .split(",")
                .map((u) => u.trim().toLowerCase())
                .filter(Boolean)
            : [];

          const matchedPos = existingPosturas.find((ex) => {
            const exUrlStr = String(ex.source_url || ex.fuente_url || "")
              .trim()
              .toLowerCase();
            const exUrls = exUrlStr
              ? exUrlStr
                  .split(",")
                  .map((u) => u.trim())
                  .filter(Boolean)
              : [];
            const exTitle = String(ex.title || ex.titulo || "")
              .trim()
              .toLowerCase();
            const exDesc = String(
              ex.description || ex.redaccion_final || ex.hecho || "",
            )
              .trim()
              .toLowerCase();

            if (
              posUrls.length > 0 &&
              exUrls.length > 0 &&
              posUrls.some((u) => exUrls.includes(u))
            )
              return true;
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

          action = matchedPos ? "UPDATE" : "INSERT";
          target_id =
            matchedPos && typeof matchedPos.id === "string"
              ? matchedPos.id
              : null;
        }

        const titleVal =
          pos.title ||
          (pos.type
            ? `${pos.type} - ${pos.date || "Declaración"}`
            : "Noticia / Declaración");
        const summaryVal = pos.description || "";
        const typeVal = pos.type || "NOTICIA";
        const sourceVal = pos.source || "Web";
        const dateVal = pos.date || null;

        if (!reason) {
          reason =
            action === "UPDATE"
              ? `Actualización de noticia existente — ${sourceVal}`
              : `Noticia detectada por IA — ${sourceVal}`;
        }

        return {
          person_id: personId,
          batch_run_id,
          action,
          target_id,
          reason,
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

    const validProposals = allProposals.filter((p) => {
      const data = (p.proposed_data || {}) as Record<string, unknown>;
      const title = String(data.title || data.titulo || "").trim();
      const summary = String(
        data.summary || data.redaccion_final || data.description || "",
      ).trim();

      if (
        !title ||
        title.toLowerCase() === "hallazgo web" ||
        title.toLowerCase() === "sin título" ||
        title.toLowerCase() === "sin titulo"
      ) {
        return false;
      }
      if (
        !summary ||
        summary.toLowerCase() === "sin resumen" ||
        summary.length < 15
      ) {
        return false;
      }
      return true;
    });

    if (validProposals.length === 0) {
      return {
        success: false,
        error:
          "No hay hallazgos con contenido sustantivo válido para enviar a revisión.",
      };
    }

    await prisma.research_proposals.createMany({ data: validProposals });

    revalidatePersonEcosystem();

    return {
      success: true,
      count: validProposals.length,
      batch_run_id,
    };
  } catch (error) {
    console.error("Error en queueResearchProposals:", error);
    return { success: false, error: extractErrorMessage(error) };
  }
}
