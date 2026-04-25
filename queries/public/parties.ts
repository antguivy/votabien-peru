import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";

import { createPublicClient } from "@/lib/supabase/public";

import {
  PoliticalPartyBase,
  PoliticalPartyListPaginated,
} from "@/interfaces/political-party";

export const getPartidosListSimple = cache(
  unstable_cache(
    async ({ active }: { active: boolean }): Promise<PoliticalPartyBase[]> => {
      const supabase = await createPublicClient();
      const { data, error } = await supabase
        .from("politicalparty")
        .select(
          "id, name, acronym, logo_url, color_hex, active, foundation_date",
        )
        .eq("active", active)
        .order("name", { ascending: true });

      if (error) throw new Error(`Error al obtener partidos: ${error.message}`);
      return data as unknown as PoliticalPartyBase[];
    },
    ["partidos-list-simple"],
    { revalidate: TTL.static, tags: [TAGS.parties] },
  ),
);

interface GetPartidosListParams {
  active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export const getPartidosList = cache(
  unstable_cache(
    async (
      params: GetPartidosListParams = {},
    ): Promise<PoliticalPartyListPaginated> => {
      const supabase = await createPublicClient();
      const { active, search, limit = 30, offset = 0 } = params;

      try {
        // 1. Lógica para ocultar partidos que son parte de una alianza activa
        const { data: activeProcess } = await supabase
          .from("electoralprocess")
          .select("id")
          .eq("active", true)
          .single();

        let hiddenPartyIds: string[] = [];

        if (activeProcess) {
          const { data: allianceMembers } = await supabase
            .from("alliancecomposition")
            .select("child_org_id")
            .eq("process_id", activeProcess.id);

          if (allianceMembers && allianceMembers.length > 0) {
            hiddenPartyIds = allianceMembers
              .map((m) => m.child_org_id)
              .filter((id): id is string => id !== null);
          }
        }

        // 2. Construcción de la Query
        let query = supabase
          .from("politicalparty")
          .select("*", { count: "exact" })
          .order("name", { ascending: true });

        // Filtro de Estado
        if (active !== undefined) {
          query = query.eq("active", active);
        }

        // Filtro para ocultar partidos
        if (hiddenPartyIds.length > 0) {
          const idsString = `("${hiddenPartyIds.join('","')}")`;
          query = query.filter("id", "not.in", idsString);
        }

        // Búsqueda por texto
        if (search && search.trim() !== "") {
          const searchTerm = search.trim();
          query = query.or(
            `name.ilike.%${searchTerm}%,acronym.ilike.%${searchTerm}%`,
          );
        }

        // Paginación
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
          console.error("Supabase error:", error);
          throw new Error(`Error al obtener partidos: ${error.message}`);
        }

        return {
          items: data || [],
          total: count || 0,
          limit,
          offset,
        };
      } catch (error) {
        console.error("Error en getPartidosList:", error);
        throw error;
      }
    },
    ["partidos-list-paginated"],
    { revalidate: TTL.static, tags: [TAGS.parties] },
  ),
);
