"use server";

import { prisma } from "@/lib/prisma";
import { serverRequireReviewer } from "@/lib/auth-actions";
import { createId } from "@paralleldrive/cuid2";
import { BackgroundStatus, BackgroundType } from "@/interfaces/background";
import { Prisma } from "@/prisma/generated/client";

import { normalizeFindingData } from "@/interfaces/research";
import { revalidatePersonEcosystem } from "@/lib/cache-revalidate";

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

    if (
      !finding ||
      (finding.status !== "PENDING" && finding.status !== "APPROVED")
    ) {
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

      if (finding.target_id) {
        const existing = await prisma.background.findUnique({
          where: { id: finding.target_id },
        });

        if (existing) {
          // Consolidar fuentes y URLs para preservar trazabilidad completa
          const allSources = new Set<string>();
          if (existing.source) {
            existing.source.split(",").forEach((s) => {
              const trimmed = s.trim();
              if (trimmed) allSources.add(trimmed);
            });
          }
          if (normalized.source) {
            normalized.source.split(",").forEach((s) => {
              const trimmed = s.trim();
              if (trimmed) allSources.add(trimmed);
            });
          }
          const finalSource =
            allSources.size > 0
              ? Array.from(allSources).join(", ")
              : normalized.source || existing.source;

          const allUrls = new Set<string>();
          if (existing.source_url) {
            existing.source_url.split(",").forEach((u) => {
              const trimmed = u.trim();
              if (trimmed) allUrls.add(trimmed);
            });
          }
          if (normalized.source_url) {
            normalized.source_url.split(",").forEach((u) => {
              const trimmed = u.trim();
              if (trimmed) allUrls.add(trimmed);
            });
          }
          const finalSourceUrl =
            allUrls.size > 0
              ? Array.from(allUrls).join(", ")
              : normalized.source_url || existing.source_url;

          await prisma.background.update({
            where: { id: finding.target_id },
            data: {
              publication_date:
                normalized.publication_date || existing.publication_date,
              type: typeEnum,
              status: statusEnum,
              summary: normalized.summary || existing.summary,
              sanction: normalized.sanction || existing.sanction,
              source: finalSource,
              source_url: finalSourceUrl,
              title: normalized.title || existing.title,
              previous_version: existing as unknown as Prisma.InputJsonValue,
              updated_at: new Date(),
            },
          });
        } else {
          // Fallback por si el registro original fue removido: crear como nuevo
          const bgId = finding.target_id || createId();
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
        }
      } else {
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

        if (finding.target_id) {
          // El servicio indicó UPDATE con target_id, o es una edición de un registro ya aprobado
          const existingIdx = bio.findIndex((b) => b.id === finding.target_id);
          const updatedItem = {
            id: finding.target_id,
            title: normalized.title,
            type: normalized.type,
            date: normalized.publication_date || "",
            description: normalized.summary,
            source: normalized.source,
            source_url: normalized.source_url,
          };

          if (existingIdx >= 0) {
            bio[existingIdx] = { ...bio[existingIdx], ...updatedItem };
          } else {
            bio.push(updatedItem);
          }
          finalTargetId = finding.target_id;
        } else {
          // El servicio determinó INSERT: la deduplicación ya se hizo en el servicio,
          // aquí en la UI solo se aprueba/modera e inserta directamente.
          const postureId = createId();
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
        ...(customData
          ? { proposed_data: customData as Prisma.InputJsonValue }
          : {}),
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

    if (
      !finding ||
      (finding.status !== "APPROVED" && finding.status !== "REJECTED")
    ) {
      throw new Error(
        "El hallazgo no se encuentra en estado aprobado o rechazado.",
      );
    }

    // Si estaba rechazado, simplemente vuelve a PENDING sin tener que retirar datos de BD
    if (finding.status === "APPROVED") {
      const rawData = finding.proposed_data as Record<string, unknown>;
      const normalized = normalizeFindingData(rawData);
      const isBackground = [
        "PENAL",
        "ETICA",
        "CIVIL",
        "ADMINISTRATIVO",
      ].includes(normalized.type);

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
          const filteredBio = finding.target_id
            ? bio.filter((p) => p.id !== finding.target_id)
            : bio;

          await prisma.person.update({
            where: { id: finding.person_id },
            data: {
              posturas: filteredBio as Prisma.InputJsonValue[],
              updated_at: new Date(),
            },
          });
        }
      }
    }

    // Revertir propuesta a PENDING
    await prisma.research_proposals.update({
      where: { id: findingId },
      data: {
        status: "PENDING",
        target_id: finding.action === "INSERT" ? null : finding.target_id,
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

// ============================================
// AUDITORÍA Y DESCARTE DE HOMONIMIA
// ============================================

export interface HomonimiaItemResult {
  proposal_id: string;
  candidato: string;
  title: string;
  decision: "REJECT" | "KEEP";
  capa: string;
  motivo: string;
  confidence: number;
  url: string;
}

export interface HomonimiaAuditResponse {
  success: boolean;
  dry_run?: boolean;
  total_analyzed?: number;
  rejected_count?: number;
  kept_count?: number;
  applied_count?: number;
  layers_breakdown?: {
    capa_1_slug: number;
    capa_2_metadatos: number;
    capa_3_contenido: number;
  };
  excel_filename?: string;
  excel_base64?: string;
  results?: HomonimiaItemResult[];
  error?: string;
}

export interface HomonimiaJobProgress {
  current: number;
  total: number;
  percent: number;
  fase: string;
  detalles: string;
}

export interface HomonimiaJobStatusResponse {
  success: boolean;
  job_id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  dry_run?: boolean;
  skip_capa3?: boolean;
  progress?: HomonimiaJobProgress;
  result?: HomonimiaAuditResponse;
  error?: string;
}

export async function auditHomonimiaProposals(params: {
  findingIds?: string[];
  candidateId?: string;
  candidateName?: string;
  dryRun?: boolean;
  skipCapa3?: boolean;
  limit?: number;
}): Promise<HomonimiaAuditResponse> {
  const { user } = await serverRequireReviewer();
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  if (params.dryRun === false && !isAdmin) {
    return {
      success: false,
      error:
        "Permiso denegado: Solo los administradores pueden aplicar descartes definitivos en la base de datos.",
    };
  }

  try {
    // 1. Consultar propuestas pendientes y sus candidatos mediante Prisma
    const proposals = await prisma.research_proposals.findMany({
      where: {
        status: "PENDING",
        ...(params.findingIds && params.findingIds.length > 0
          ? { id: { in: params.findingIds } }
          : {}),
        person: {
          candidate: {
            some: {
              active: true,
              electoralprocess: { active: true },
              ...(params.candidateId ? { id: params.candidateId } : {}),
            },
          },
          ...(params.candidateName
            ? {
                OR: [
                  {
                    fullname: {
                      contains: params.candidateName,
                      mode: "insensitive",
                    },
                  },
                  {
                    lastname: {
                      contains: params.candidateName,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),
        },
      },
      include: {
        person: {
          select: {
            id: true,
            fullname: true,
            name: true,
            lastname: true,
            dni: true,
            profession: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
      ...(params.limit && params.limit > 0 ? { take: params.limit } : {}),
    });

    if (!proposals || proposals.length === 0) {
      return {
        success: true,
        dry_run: params.dryRun !== false,
        total_analyzed: 0,
        rejected_count: 0,
        kept_count: 0,
        applied_count: 0,
        layers_breakdown: {
          capa_1_slug: 0,
          capa_2_metadatos: 0,
          capa_3_contenido: 0,
        },
        results: [],
      };
    }

    // 2. Agrupar propuestas por candidato para el microservicio
    const candidatesMap = new Map<
      string,
      {
        person_id: string;
        fullname: string;
        name: string;
        lastname: string;
        dni: string;
        profession: string;
        proposals: {
          id: string;
          title: string;
          source_url: string;
          summary: string;
          publication_date: string;
        }[];
      }
    >();

    for (const p of proposals) {
      const person = p.person;
      if (!person) continue;

      if (!candidatesMap.has(person.id)) {
        candidatesMap.set(person.id, {
          person_id: person.id,
          fullname: person.fullname || "",
          name: person.name || "",
          lastname: person.lastname || "",
          dni: person.dni || "",
          profession: person.profession || "",
          proposals: [],
        });
      }

      let parsedData: Record<string, unknown> = {};
      if (typeof p.proposed_data === "string") {
        try {
          parsedData = JSON.parse(p.proposed_data) as Record<string, unknown>;
        } catch {}
      } else if (p.proposed_data && typeof p.proposed_data === "object") {
        parsedData = p.proposed_data as Record<string, unknown>;
      }

      candidatesMap.get(person.id)!.proposals.push({
        id: p.id,
        title: (parsedData.title || parsedData.titulo || "").toString(),
        source_url: (
          parsedData.source_url ||
          parsedData.fuente_url ||
          ""
        ).toString(),
        summary: (
          parsedData.summary ||
          parsedData.redaccion_final ||
          parsedData.description ||
          ""
        ).toString(),
        publication_date: (
          parsedData.publication_date ||
          parsedData.fecha ||
          ""
        ).toString(),
      });
    }

    const candidateList = Array.from(candidatesMap.values());

    // 3. Invocar al microservicio Python como función pura en memoria
    const baseUrl =
      process.env.API_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";
    const secretKey = process.env.API_SECRET_KEY || "";

    const res = await fetch(`${baseUrl}/api/v1/homonimia/audit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        candidates: candidateList,
        skip_capa3: params.skipCapa3 ?? false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Error del servicio: ${errText}` };
    }

    const data = await res.json();

    // 4. Si no es dry_run, aplicar los descartes en PostgreSQL mediante Prisma
    let appliedCount = 0;
    if (params.dryRun === false && data.results && data.results.length > 0) {
      const toReject = data.results.filter(
        (r: { decision?: string }) => r.decision === "REJECT",
      );
      if (toReject.length > 0) {
        const now = new Date();
        const reviewerName = user.email || user.name || user.id;

        await prisma.$transaction(
          toReject.map(
            (item: { proposal_id: string; capa?: string; motivo?: string }) =>
              prisma.research_proposals.updateMany({
                where: {
                  id: item.proposal_id,
                  status: "PENDING",
                },
                data: {
                  status: "REJECTED",
                  reviewed_at: now,
                  reviewed_by: reviewerName,
                  reason: `DESCARTADO_HOMONIMIA [${item.capa}]: ${item.motivo}`,
                },
              }),
          ),
        );

        appliedCount = toReject.length;
        revalidatePersonEcosystem();
      }
    }

    return {
      success: true,
      dry_run: params.dryRun !== false,
      total_analyzed: data.total_analyzed,
      rejected_count: data.rejected_count,
      kept_count: data.kept_count,
      applied_count: appliedCount,
      layers_breakdown: data.layers_breakdown,
      excel_filename: data.excel_filename,
      excel_base64: data.excel_base64,
      results: data.results,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Error al procesar auditoría de homonimia";
    return { success: false, error: message };
  }
}

export async function startHomonimiaAuditJob(params: {
  findingIds?: string[];
  candidateId?: string;
  candidateName?: string;
  dryRun?: boolean;
  skipCapa3?: boolean;
  limit?: number;
}): Promise<{
  success: boolean;
  jobId?: string;
  totalProposals?: number;
  error?: string;
}> {
  const { user } = await serverRequireReviewer();
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  if (params.dryRun === false && !isAdmin) {
    return {
      success: false,
      error:
        "Permiso denegado: Solo los administradores pueden aplicar descartes definitivos en la base de datos.",
    };
  }

  try {
    const proposals = await prisma.research_proposals.findMany({
      where: {
        status: "PENDING",
        ...(params.findingIds && params.findingIds.length > 0
          ? { id: { in: params.findingIds } }
          : {}),
        person: {
          candidate: {
            some: {
              active: true,
              electoralprocess: { active: true },
              ...(params.candidateId ? { id: params.candidateId } : {}),
            },
          },
          ...(params.candidateName
            ? {
                OR: [
                  {
                    fullname: {
                      contains: params.candidateName,
                      mode: "insensitive",
                    },
                  },
                  {
                    lastname: {
                      contains: params.candidateName,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),
        },
      },
      include: {
        person: {
          select: {
            id: true,
            fullname: true,
            name: true,
            lastname: true,
            dni: true,
            profession: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
      ...(params.limit && params.limit > 0 ? { take: params.limit } : {}),
    });

    if (!proposals || proposals.length === 0) {
      return {
        success: false,
        error:
          "No hay propuestas pendientes para auditar con los filtros seleccionados.",
      };
    }

    const candidatesMap = new Map<
      string,
      {
        person_id: string;
        fullname: string;
        name: string;
        lastname: string;
        dni: string;
        profession: string;
        proposals: {
          id: string;
          title: string;
          source_url: string;
          summary: string;
          publication_date: string;
        }[];
      }
    >();

    for (const p of proposals) {
      const person = p.person;
      if (!person) continue;

      if (!candidatesMap.has(person.id)) {
        candidatesMap.set(person.id, {
          person_id: person.id,
          fullname: person.fullname || "",
          name: person.name || "",
          lastname: person.lastname || "",
          dni: person.dni || "",
          profession: person.profession || "",
          proposals: [],
        });
      }

      let parsedData: Record<string, unknown> = {};
      if (typeof p.proposed_data === "string") {
        try {
          parsedData = JSON.parse(p.proposed_data) as Record<string, unknown>;
        } catch {}
      } else if (p.proposed_data && typeof p.proposed_data === "object") {
        parsedData = p.proposed_data as Record<string, unknown>;
      }

      candidatesMap.get(person.id)!.proposals.push({
        id: p.id,
        title: (parsedData.title || parsedData.titulo || "").toString(),
        source_url: (
          parsedData.source_url ||
          parsedData.fuente_url ||
          ""
        ).toString(),
        summary: (
          parsedData.summary ||
          parsedData.redaccion_final ||
          parsedData.description ||
          ""
        ).toString(),
        publication_date: (
          parsedData.publication_date ||
          parsedData.fecha ||
          ""
        ).toString(),
      });
    }

    const candidateList = Array.from(candidatesMap.values());

    const baseUrl =
      process.env.API_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";
    const secretKey = process.env.API_SECRET_KEY || "";

    const res = await fetch(`${baseUrl}/api/v1/homonimia/audit/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        candidates: candidateList,
        skip_capa3: params.skipCapa3 ?? false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        error: `Error al iniciar trabajo en el servicio: ${errText}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      jobId: data.job_id,
      totalProposals: data.total_proposals,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Error al despachar trabajo de auditoría";
    return { success: false, error: message };
  }
}

export async function getHomonimiaAuditJobStatus(
  jobId: string,
): Promise<HomonimiaJobStatusResponse> {
  await serverRequireReviewer();
  const baseUrl =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";
  const secretKey = process.env.API_SECRET_KEY || "";

  try {
    const res = await fetch(`${baseUrl}/api/v1/homonimia/audit/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, job_id: jobId, status: "FAILED", error: err };
    }

    const data = await res.json();
    return {
      success: true,
      job_id: data.job_id,
      status: data.status,
      dry_run: data.dry_run,
      skip_capa3: data.skip_capa3,
      progress: data.progress,
      result: data.result,
      error: data.error,
    };
  } catch (err: unknown) {
    return {
      success: false,
      job_id: jobId,
      status: "FAILED",
      error:
        err instanceof Error
          ? err.message
          : "Error de conexión al consultar estado del job",
    };
  }
}

export async function applyHomonimiaSelectedRejections(
  items: { proposalId: string; motivo: string; capa: string }[],
) {
  const { user } = await serverRequireReviewer();
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  if (!isAdmin) {
    return {
      success: false,
      error:
        "Permiso denegado: Solo los administradores pueden aplicar descartes definitivos.",
    };
  }

  if (!items || items.length === 0) {
    return {
      success: false,
      error: "No hay propuestas seleccionadas para descartar.",
    };
  }

  try {
    const now = new Date();
    const reviewerName = user.email || user.name || user.id;

    await prisma.$transaction(
      items.map((item) =>
        prisma.research_proposals.updateMany({
          where: {
            id: item.proposalId,
            status: "PENDING",
          },
          data: {
            status: "REJECTED",
            reviewed_at: now,
            reviewed_by: reviewerName,
            reason: `DESCARTADO_HOMONIMIA [${item.capa}]: ${item.motivo}`,
          },
        }),
      ),
    );

    revalidatePersonEcosystem();
    return { success: true, count: items.length };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Error al aplicar descartes seleccionados";
    return { success: false, error: message };
  }
}

export async function revertHomonimiaExcel(formData: FormData) {
  const { user } = await serverRequireReviewer();
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  if (!isAdmin) {
    return {
      success: false,
      error:
        "Permiso denegado: Solo los administradores pueden revertir auditorías.",
    };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No se seleccionó ningún archivo Excel." };
  }

  const baseUrl =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";
  const secretKey = process.env.API_SECRET_KEY || "";

  try {
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const res = await fetch(`${baseUrl}/api/v1/homonimia/parse-revert-excel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      body: backendFormData,
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Error al procesar Excel: ${errText}` };
    }

    const data = await res.json();
    const proposalIds: string[] = data.proposal_ids || [];

    if (proposalIds.length === 0) {
      return {
        success: true,
        reverted_count: 0,
        message: "No se encontraron propuestas para revertir en el archivo.",
      };
    }

    // Ejecutar rollback directamente en PostgreSQL mediante Prisma
    const updated = await prisma.research_proposals.updateMany({
      where: {
        id: { in: proposalIds },
        status: "REJECTED",
      },
      data: {
        status: "PENDING",
        reviewed_at: null,
        reviewed_by: null,
      },
    });

    revalidatePersonEcosystem();
    return {
      success: true,
      reverted_count: updated.count,
      proposal_ids: proposalIds,
      message: `Rollback completado: se restauraron ${updated.count} propuestas a estado PENDING.`,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al revertir desde Excel";
    return { success: false, error: message };
  }
}
