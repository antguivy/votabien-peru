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

      type CandidateStreamData = {
        id: string;
        person_id: string;
        active: boolean;
        political_party_id: string;
        electoral_district_id: string;
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
          birth_date: Date | null;
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
          active: true,
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
            processed.push({
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
                backgrounds: item.person.background,
              },
              political_party: item.politicalparty,
              electoral_district: item.electoraldistrict,
              ai_score: 0,
              ai_analysis: "",
            });
          }
        }

        if (categoryKey === "senador_nacional") {
          for (let i = processed.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [processed[i], processed[j]] = [processed[j], processed[i]];
          }
        }
        groupedResults[categoryKey] = processed.slice(
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

      const candidates = groupedResults.presidente;

      if (apply_ai && user_interests && candidates.length > 0) {
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

        const triajeRes = await fetch(`${API_BASE_URL}/api/v1/ai/triaje`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
          },
          body: JSON.stringify(triajePayload),
        });

        let viableCandidates = [...candidates];
        if (triajeRes.ok) {
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
        }

        await sendEvent({
          status: `Fase 2: Vectorizando y extrayendo noticias para ${viableCandidates.length} viables...`,
        });

        const embedRes = await fetch(`${API_BASE_URL}/api/v1/ai/embed_query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
          },
          body: JSON.stringify({ text: user_interests }),
        });

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

              // Filter to max chunks per person (like the RPC did)
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

          const analistaRes = await fetch(
            `${API_BASE_URL}/api/v1/ai/analista_stream`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
              },
              body: JSON.stringify(analistaPayload),
            },
          );

          if (analistaRes.ok && analistaRes.body) {
            const reader = analistaRes.body.getReader();
            const decoder = new TextDecoder();
            let jsonString = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              // Pipe to client
              await writer.write(encoder.encode(chunk));

              // We also need to extract the JSON payload that LLM generated
              // LLM returns raw text chunks, but wait! The Python API yields `data: { "type": "llm_chunk", "text": "..." }\n\n`
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

            // After stream is done, we apply the JSON
            try {
              const startIdx = jsonString.indexOf("[");
              const endIdx = jsonString.lastIndexOf("]");
              if (startIdx !== -1 && endIdx !== -1) {
                const evalArr = JSON.parse(
                  jsonString.substring(startIdx, endIdx + 1),
                );
                const evalMap = new Map(
                  evalArr.map((e: { person_id: string }) => [e.person_id, e]),
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
                finales.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
                groupedResults.presidente = finales.slice(0, 5);
              }
            } catch (_err) {
              groupedResults.presidente = viableCandidates.slice(0, 5);
            }
          }
        } else {
          groupedResults.presidente = viableCandidates.slice(0, 5);
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
