"use server";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";

import { createClient } from "@/lib/supabase/server";
import { PoliticalPartyBase } from "@/interfaces/political-party";

// Interfaces internas para mapeo

interface GetPartidosSelectorParams {
  active?: boolean;
}

export const getPartidosSelectorList = cache(
  unstable_cache(
    async (
      params: GetPartidosSelectorParams = {},
    ): Promise<PoliticalPartyBase[]> => {
      // CORREGIDO EL TIPO AQUÍ
      const supabase = await createClient();
      const { active } = params;

      try {
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

        let query = supabase
          .from("politicalparty")
          .select(
            "id, name, acronym, logo_url, color_hex, active, foundation_date",
            { count: "exact" },
          )
          .order("name", { ascending: true });

        // Filtro original
        if (active !== undefined) {
          query = query.eq("active", active);
        }

        if (hiddenPartyIds.length > 0) {
          const idsString = `(${hiddenPartyIds.join(",")})`;
          query = query.filter("id", "not.in", idsString);
        }

        const { data, error, count } = await query;

        if (error) {
          console.error("Supabase error:", error);
          throw new Error(`Error al obtener partidos: ${error.message}`);
        }

        return data as unknown as PoliticalPartyBase[]; // CORREGIDO EL TIPO AQUÍ
      } catch (error) {
        console.error("Error en getPartidosSelectorList:", error);
        throw error;
      }
    },
    ["partidos-selector-list"],
    { revalidate: TTL.static, tags: [TAGS.parties] },
  ),
);
