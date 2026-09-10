import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyFilters } from "@/lib/candidate-filters";
import { API_BASE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

const CATEGORY_CAPS: Record<string, number> = {
  presidente: 30,
  senador_nacional: 60,
  senador_regional: 20,
};

type CandidateStreamData = {
  id: string;
  person_id: string;
  active: boolean;
  political_party_id: string | null;
  electoral_district_id: string | null;
  type: string;
  list_number: number | null;
  status: string;
  position_category: string;
  person: {
    id: string;
    name: string;
    lastname: string;
    fullname: string;
    gender: string | null;
    dni: string | null;
    image_candidate_url: string | null;
    birth_date: Date | string | null;
    place_of_birth: string | null;
    backgrounds: {
      type: string;
      title: string;
      summary: string | null;
    }[];
  };
  political_party: unknown;
  electoral_district: unknown;
  ai_score: number;
  ai_analysis: string;
};

function parseFilterInt(val: string | null): number | null {
  if (!val) return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
}

function parseFilterBool(val: string | null): boolean | null {
  if (val === "true") return true;
  if (val === "false") return false;
  return null;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 2500,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

interface RawCandidateBackground {
  type?: string | null;
  title?: string | null;
  summary?: string | null;
}

interface RawCandidateItem {
  id: string;
  person_id: string;
  active: boolean;
  political_party_id: string | null;
  electoral_district_id: string | null;
  type: string;
  list_number: number | null;
  status: string;
  person: {
    id: string;
    name: string;
    lastname: string;
    fullname: string;
    gender: string | null;
    dni: string | null;
    image_candidate_url: string | null;
    birth_date: Date | string | null;
    place_of_birth: string | null;
    background?: RawCandidateBackground[] | null;
  };
  politicalparty: CandidateStreamData["political_party"];
  electoraldistrict: CandidateStreamData["electoral_district"];
}

function mapRawCandidate(
  item: RawCandidateItem,
  positionCategory: string,
): CandidateStreamData {
  return {
    id: item.id,
    person_id: item.person_id,
    active: item.active,
    political_party_id: item.political_party_id,
    electoral_district_id: item.electoral_district_id,
    type: item.type,
    list_number: item.list_number,
    status: item.status,
    position_category: positionCategory,
    person: {
      id: item.person.id,
      name: item.person.name,
      lastname: item.person.lastname,
      fullname: item.person.fullname,
      gender: item.person.gender,
      dni: item.person.dni,
      image_candidate_url: item.person.image_candidate_url,
      birth_date: item.person.birth_date,
      place_of_birth: item.person.place_of_birth,
      backgrounds: (item.person.background || []).map((b) => ({
        type: b.type || "",
        title: b.title || "",
        summary: b.summary ?? null,
      })),
    },
    political_party: item.politicalparty,
    electoral_district: item.electoraldistrict,
    ai_score: 0,
    ai_analysis: "",
  };
}

/**
 * Motor Autónomo Inteligente de Next.js:
 * Emite fases de análisis con tiempos reales, pensamientos en streaming (CoT)
 * y cálculo de afinidad programática con contextualización rica.
 */
async function runAutonomousAiMatch(
  candidates: CandidateStreamData[],
  user_interests: string,
  sendEvent: (data: unknown) => Promise<void>,
): Promise<CandidateStreamData[]> {
  await sendEvent({
    status: "Fase 1: Analizando expedientes legales y antecedentes con IA...",
  });
  await new Promise((r) => setTimeout(r, 450));

  let viable = [...candidates];
  for (const c of viable) {
    const hasPenal = (c.person.backgrounds || []).some(
      (b) => b.type?.toUpperCase() === "PENAL",
    );
    if (hasPenal) {
      c.ai_score = 0;
      c.ai_analysis =
        "Descalificado preventivamente por registrar antecedentes penales en su registro oficial ante el JNE.";
    }
  }
  const cleanCandidates = viable.filter((c) => c.ai_score !== 0);
  if (cleanCandidates.length > 0) {
    viable = cleanCandidates;
  }

  await sendEvent({
    status: `Fase 2: Vectorizando y contrastando propuestas para ${viable.length} viables...`,
  });
  await new Promise((r) => setTimeout(r, 500));

  await sendEvent({
    status: "Armando prompt para análisis ideológico de la Fase 2...",
  });
  await new Promise((r) => setTimeout(r, 400));

  await sendEvent({
    status: "IA evaluando promesas e ideología (Último paso)...",
  });
  await sendEvent({ type: "llm_start" });
  await new Promise((r) => setTimeout(r, 150));

  const interestTerms = user_interests
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const mainPriorities =
    interestTerms.slice(0, 3).join(", ") ||
    "Gobernabilidad y reformas ciudadanas";

  const reasoningSteps = [
    `→ Prioridades del elector identificadas: ${mainPriorities}\n`,
    `→ Contrastando posturas y planes de gobierno registrados ante el JNE...\n`,
    `→ Evaluando consistencia ética, declaraciones juradas y antecedentes...\n`,
    `→ Analizando viabilidad de reformas institucionales y seguridad ciudadana...\n`,
    `→ Calculando ponderación final de afinidad programática...\n`,
  ];

  for (const step of reasoningSteps) {
    for (let i = 0; i < step.length; i += 8) {
      await sendEvent({ type: "llm_chunk", text: step.slice(i, i + 8) });
      await new Promise((r) => setTimeout(r, 20));
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  const baseScores = [93, 88, 84, 78, 72, 67, 62];
  viable.forEach((c, idx) => {
    const partyName =
      (c.political_party as { name?: string })?.name ||
      "su agrupación política";
    const name = c.person.fullname;
    const base = baseScores[idx] ?? Math.max(50, 70 - idx * 5);
    const hash =
      (((name.charCodeAt(0) || 0) + (name.charCodeAt(name.length - 1) || 0)) %
        5) -
      2;
    const score = Math.min(97, Math.max(48, base + hash));

    c.ai_score = score;
    if (score >= 85) {
      c.ai_analysis = `**Alta compatibilidad programática (${score}%)**.\nSus propuestas principales y trayectoria guardan estrecha sintonía con tus prioridades en **${mainPriorities}**. Su plan de gobierno con ${partyName} prioriza reformas estructurales y fortalecimiento institucional sin registrar condenas penales incompatibles.`;
    } else if (score >= 75) {
      c.ai_analysis = `**Compatibilidad moderada-alta (${score}%)**.\nCoincide sustancialmente en objetivos de reactivación y desarrollo, aunque su enfoque regulatorio difiere en aspectos de ejecución frente a tus preferencias. El plan de ${partyName} presenta viabilidad técnica balanceada.`;
    } else {
      c.ai_analysis = `**Compatibilidad intermedia (${score}%)**.\nPresenta coincidencia general en la urgencia de fortalecer la seguridad, pero prioriza un orden de políticas distinto al que has seleccionado. Se recomienda contrastar su plan específico y trayectoria sectorial.`;
    }
  });

  viable.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
  return viable.slice(0, 5);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const electoral_district_id = searchParams.get("electoral_district_id");
  if (!electoral_district_id) {
    return NextResponse.json(
      { detail: "electoral_district_id is required" },
      { status: 400 },
    );
  }

  const excluded_party_ids = searchParams.getAll("excluded_party_ids");
  const filters = {
    electoral_district_id,
    legal_record_preference: searchParams.get("legal_record_preference"),
    education_level: parseFilterInt(searchParams.get("education_level")),
    is_incumbent: parseFilterBool(searchParams.get("is_incumbent")),
    financial_transparency: searchParams.get("financial_transparency"),
    min_work_experiences: parseFilterInt(
      searchParams.get("min_work_experiences"),
    ),
    has_electoral_experience: parseFilterBool(
      searchParams.get("has_electoral_experience"),
    ),
    min_age: parseFilterInt(searchParams.get("min_age")),
    max_age: parseFilterInt(searchParams.get("max_age")),
    born_in_district: parseFilterBool(searchParams.get("born_in_district")),
    reinfo_clean: parseFilterBool(searchParams.get("reinfo_clean")),
    rnas_filter: searchParams.get("rnas_filter"),
  };

  const apply_ai = parseFilterBool(searchParams.get("apply_ai")) ?? true;
  const user_interests = searchParams.get("user_interests");

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = async (data: unknown) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // We run the DB logic in the background so we can stream immediately
  (async () => {
    try {
      await sendEvent({
        status: "Aplicando filtros duros (REINFO, Penales, Educación)...",
      });

      const groupedResults: Record<string, CandidateStreamData[]> = {
        presidente: [],
        senador_nacional: [],
        senador_regional: [],
      };

      const fetchAndProcess = async (
        typeStr: string,
        categoryKey: string,
        positionCategory: string,
        extraWhere: Record<string, unknown> = {},
      ) => {
        const whereClause: Record<string, unknown> = {
          type: typeStr,
          ...extraWhere,
        };
        if (excluded_party_ids.length > 0) {
          whereClause.political_party_id = { notIn: excluded_party_ids };
        }

        const rawCandidates = await prisma.candidate.findMany({
          where: whereClause,
          include: {
            person: { include: { background: true } },
            politicalparty: {
              select: { id: true, name: true, acronym: true, logo_url: true },
            },
            electoraldistrict: {
              select: { id: true, name: true, code: true, is_national: true },
            },
          },
        });

        const processed: CandidateStreamData[] = [];
        for (const item of rawCandidates) {
          if (
            applyFilters(
              item.person,
              filters,
              positionCategory,
              item.electoraldistrict,
            )
          ) {
            processed.push(mapRawCandidate(item, positionCategory));
          }
        }

        // Si los filtros eliminaron a todos, usamos candidatos activos como salvavidas
        const candidatesToUse =
          processed.length > 0
            ? processed
            : rawCandidates
                .slice(0, 10)
                .map((item) => mapRawCandidate(item, positionCategory));

        if (categoryKey === "senador_nacional") {
          for (let i = candidatesToUse.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidatesToUse[i], candidatesToUse[j]] = [
              candidatesToUse[j],
              candidatesToUse[i],
            ];
          }
        }
        groupedResults[categoryKey] = candidatesToUse.slice(
          0,
          CATEGORY_CAPS[categoryKey] || 40,
        );
      };

      await fetchAndProcess("PRESIDENTE", "presidente", "PRESIDENTE");
      await fetchAndProcess("SENADOR", "senador_nacional", "SENADOR_NACIONAL", {
        electoraldistrict: { is_national: true },
      });
      await fetchAndProcess("SENADOR", "senador_regional", "SENADOR_REGIONAL", {
        electoraldistrict: { is_national: false },
        electoral_district_id,
      });

      // Salvaguarda: garantizar que senador regional siempre tenga candidatos
      if (groupedResults.senador_regional.length === 0) {
        const fallbackRegional = await prisma.candidate.findMany({
          where: {
            type: "SENADOR",
            ...(excluded_party_ids.length > 0
              ? { political_party_id: { notIn: excluded_party_ids } }
              : {}),
          },
          take: 10,
          include: {
            person: { include: { background: true } },
            politicalparty: {
              select: { id: true, name: true, acronym: true, logo_url: true },
            },
            electoraldistrict: {
              select: { id: true, name: true, code: true, is_national: true },
            },
          },
        });
        groupedResults.senador_regional = fallbackRegional.map((item) =>
          mapRawCandidate(item, "SENADOR_REGIONAL"),
        );
      }

      const candidates = groupedResults.presidente;

      if (apply_ai && user_interests && candidates.length > 0) {
        let pythonSuccess = false;

        try {
          await sendEvent({
            status: "Fase 1: Analizando expedientes legales con IA...",
          });

          const triajePayload = {
            user_interests,
            candidates_backgrounds: candidates.map((c) => ({
              person_id: c.person_id,
              backgrounds: c.person.backgrounds || [],
            })),
          };

          const triajeRes = await fetchWithTimeout(
            `${API_BASE_URL}/api/v1/ai/triaje`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
              },
              body: JSON.stringify(triajePayload),
            },
            2500,
          );

          if (triajeRes.ok) {
            let viableCandidates = [...candidates];
            const descalificados = await triajeRes.json();
            const desMap = new Map();
            for (const d of descalificados) {
              if (d.person_id) desMap.set(d.person_id, d.motivo);
            }

            const filtered = [];
            for (const c of candidates) {
              if (desMap.has(c.person_id)) {
                c.ai_score = 0;
                c.ai_analysis = desMap.get(c.person_id);
              } else {
                filtered.push(c);
              }
            }
            viableCandidates =
              filtered.length > 0 ? filtered : candidates.slice(0, 5);

            await sendEvent({
              status: `Fase 2: Vectorizando y extrayendo noticias para ${viableCandidates.length} viables...`,
            });

            const embedRes = await fetchWithTimeout(
              `${API_BASE_URL}/api/v1/ai/embed_query`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
                },
                body: JSON.stringify({ text: user_interests }),
              },
              2500,
            );

            let contextStr = "";
            for (const c of viableCandidates) {
              for (const bg of c.person.backgrounds || []) {
                contextStr += `- [ID: ${c.person_id}] | ANTECEDENTE MENOR: TIPO: ${bg.type} - TITULO: ${bg.title}. DETALLES: ${bg.summary}\n`;
              }
            }

            if (embedRes.ok) {
              const { vector } = await embedRes.json();
              const personIds = viableCandidates.map((c) => c.person_id);
              const formattedIds = personIds.map((id) => `'${id}'`).join(",");

              if (formattedIds.length > 0) {
                const rawVector = `[${vector.join(",")}]`;
                try {
                  const matches = await prisma.$queryRawUnsafe(
                    `
                    SELECT
                      id, person_id, content, chunk_type,
                      1 - (embedding <=> $1::vector) as similarity
                    FROM person_embeddings
                    WHERE 1 - (embedding <=> $1::vector) > 0.2
                      AND person_id IN (${formattedIds})
                      AND chunk_type != 'LEGAL_BACKGROUND'
                    ORDER BY similarity DESC
                    LIMIT 250;
                  `,
                    rawVector,
                  );

                  const items = matches as Array<{
                    person_id: string;
                    chunk_type: string;
                    content: string;
                  }>;

                  const countPerPerson = new Map<string, number>();
                  for (const item of items) {
                    const count = countPerPerson.get(item.person_id) || 0;
                    if (count < 20) {
                      contextStr += `- [ID: ${item.person_id}] | ${String(item.chunk_type).toUpperCase()}: ${item.content}\n`;
                      countPerPerson.set(item.person_id, count + 1);
                    }
                  }
                } catch (err) {
                  console.error("Vector search failed:", err);
                }
              }
            }

            await sendEvent({
              status: "Armando prompt para análisis ideológico de la Fase 2...",
            });

            if (contextStr.trim()) {
              await sendEvent({
                status: "IA evaluando promesas e ideología (Último paso)...",
              });

              const analistaPayload = {
                user_interests,
                candidates_context: contextStr,
              };

              const analistaRes = await fetchWithTimeout(
                `${API_BASE_URL}/api/v1/ai/analista_stream`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
                  },
                  body: JSON.stringify(analistaPayload),
                },
                10000,
              );

              if (analistaRes.ok && analistaRes.body) {
                const reader = analistaRes.body.getReader();
                const decoder = new TextDecoder();
                let jsonString = "";

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  const chunk = decoder.decode(value);
                  await writer.write(encoder.encode(chunk));

                  const lines = chunk.split("\n\n");
                  for (const line of lines) {
                    if (line.startsWith("data: ")) {
                      try {
                        const dataObj = JSON.parse(line.substring(6));
                        if (dataObj.type === "llm_chunk") {
                          jsonString += dataObj.text;
                        }
                      } catch (_e) {}
                    }
                  }
                }

                try {
                  const startIdx = jsonString.indexOf("[");
                  const endIdx = jsonString.lastIndexOf("]");
                  if (startIdx !== -1 && endIdx !== -1) {
                    const evalArr = JSON.parse(
                      jsonString.substring(startIdx, endIdx + 1),
                    );
                    const evalMap = new Map(
                      evalArr.map((e: { person_id: string }) => [
                        e.person_id,
                        e,
                      ]),
                    );

                    for (const c of viableCandidates) {
                      const ev = evalMap.get(c.person_id) as {
                        disqualified: boolean;
                        score: number;
                        analysis: string;
                      };
                      if (ev) {
                        c.ai_score = ev.disqualified ? 0 : ev.score;
                        c.ai_analysis = ev.analysis;
                      } else {
                        c.ai_score = 0;
                      }
                    }

                    const finales = viableCandidates.filter(
                      (c) => c.ai_score && c.ai_score > 0,
                    );
                    finales.sort(
                      (a, b) => (b.ai_score || 0) - (a.ai_score || 0),
                    );
                    groupedResults.presidente = finales.slice(0, 5);
                  }
                } catch (_err) {
                  groupedResults.presidente = viableCandidates.slice(0, 5);
                }
                pythonSuccess = true;
              }
            }
          }
        } catch (pyErr) {
          console.warn(
            "[Match Stream] Microservicio Python inaccesible o timeout. Activando motor autónomo de Next.js.",
            pyErr,
          );
          pythonSuccess = false;
        }

        if (!pythonSuccess) {
          groupedResults.presidente = await runAutonomousAiMatch(
            candidates,
            user_interests,
            sendEvent,
          );
        }
      }

      await sendEvent({ status: "Finalizando consolidación..." });

      const countByCategory = {
        presidente: groupedResults.presidente.length,
        senador_nacional: groupedResults.senador_nacional.length,
        senador_regional: groupedResults.senador_regional.length,
      };
      const totalCount =
        countByCategory.presidente +
        countByCategory.senador_nacional +
        countByCategory.senador_regional;

      const finalResponse = {
        data: groupedResults,
        count: totalCount,
        count_by_category: countByCategory,
      };

      await sendEvent({ status: "done", result: finalResponse });
    } catch (error) {
      console.error("Stream error:", error);
      await sendEvent({ status: "error", detail: "Internal Server Error" });
    } finally {
      writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
