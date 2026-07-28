"use server";

import {
  getCandidatesCards,
  getCandidateById,
} from "@/queries/public/candidacies";
import { CandidateCard, CandidateDetail } from "@/interfaces/candidate";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { MatchFormParams, MatchResponse } from "@/interfaces/match";

interface LoadMoreCandidatesParams {
  electoral_process_id: string;
  type?: string;
  districts?: string[];
  parties?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
  alerts?: string[];
}

export async function loadMoreCandidates(
  params: LoadMoreCandidatesParams,
): Promise<CandidateCard[]> {
  return getCandidatesCards(params);
}

// =========================================================
// NUEVAS ACCIONES PARA REEMPLAZAR LAS APIS
// =========================================================

// 1. Detalle del candidato (usa la caché de getCandidateById)
export async function fetchCandidateDetailAction(
  candidateId: string,
): Promise<CandidateDetail | null> {
  return await getCandidateById(candidateId);
}

// 2. Candidatos en bulk (con caché dinámica)
export const fetchCandidatesBulkAction = unstable_cache(
  async (ids: string[]): Promise<CandidateCard[]> => {
    if (!ids || ids.length === 0) return [];

    const items = await prisma.candidate.findMany({
      where: { id: { in: ids } },
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

    const cards = items.map((item) => {
      const cType = item.type;
      const isNational = item.electoraldistrict?.is_national || false;
      let positionCategory = "OTRO";
      if (cType === "PRESIDENTE") positionCategory = "PRESIDENTE";
      if (cType === "SENADOR") {
        positionCategory = isNational ? "SENADOR_NACIONAL" : "SENADOR_REGIONAL";
      }

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
          backgrounds: item.person.background,
        },
        political_party: item.politicalparty,
        electoral_district: item.electoraldistrict,
      };
    });

    // Ordenar según el array original de IDs
    const orderMap = new Map<string, number>(ids.map((id, idx) => [id, idx]));
    cards.sort(
      (a, b) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999),
    );

    return cards as unknown as CandidateCard[];
  },
  ["candidates-bulk-list"],
  { tags: [TAGS.candidates] },
);

export async function submitMatchAction(
  params: MatchFormParams,
): Promise<MatchResponse> {
  try {
    const { electoral_district_id, excluded_party_ids = [] } = params;

    // 1. Obtenemos los candidatos de cada categoría usando la query cacheada.
    // Usamos Promise.all para ejecutar las 3 consultas en paralelo y sea más rápido.
    const [presidenteRaw, senadorNacionalRaw, senadorRegionalRaw] =
      await Promise.all([
        getCandidatesCards({ type: "PRESIDENTE" }),
        getCandidatesCards({ type: "SENADOR_NACIONAL" }),
        electoral_district_id
          ? getCandidatesCards({
              type: "SENADOR_REGIONAL",
              districts: [electoral_district_id],
            })
          : Promise.resolve([]), // Si no hay distrito, devolvemos vacío
      ]);

    // 2. Filtramos en memoria los partidos excluidos.
    // Hacerlo en memoria es más rápido y nos permite mantener la caché de getCandidatesCards intacta.
    const filterExcluded = <T extends { political_party_id?: string | null }>(
      list: T[],
    ) =>
      list.filter(
        (c) => !excluded_party_ids.includes(c.political_party_id || ""),
      );

    const presidente = filterExcluded(presidenteRaw);
    const senador_nacional = filterExcluded(senadorNacionalRaw);
    const senador_regional = filterExcluded(senadorRegionalRaw);

    // 3. Armamos la estructura de respuesta que espera tu hook useMatchmaking
    const data = {
      presidente,
      senador_nacional,
      senador_regional,
    };

    const count_by_category = {
      presidente: presidente.length,
      senador_nacional: senador_nacional.length,
      senador_regional: senador_regional.length,
    };

    const count =
      count_by_category.presidente +
      count_by_category.senador_nacional +
      count_by_category.senador_regional;

    return {
      data,
      count,
      count_by_category,
    };
  } catch (error) {
    console.error("Error in submitMatchAction:", error);

    // En caso de error, devolvemos una estructura vacía para que la UI no se rompa
    return {
      data: {
        presidente: [],
        senador_nacional: [],
        senador_regional: [],
      },
      count: 0,
      count_by_category: {
        presidente: 0,
        senador_nacional: 0,
        senador_regional: 0,
      },
    };
  }
}
