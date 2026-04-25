import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";

import { ParliamentaryGroupBasic } from "@/interfaces/parliamentary-membership";
import { createPublicClient } from "@/lib/supabase/public";

export const getParliamentaryGroups = cache(
  unstable_cache(
    async (active: boolean = true): Promise<ParliamentaryGroupBasic[]> => {
      const supabase = createPublicClient();

      const TABLE_NAME = "parliamentarygroup";

      let query = supabase.from(TABLE_NAME).select(`
          id,
          name,
          acronym,
          logo_url, 
          color_hex  
        `);

      if (active) {
        query = query.eq("active", true);
      }

      query = query.order("name", { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error("Error al obtener grupos parlamentarios:", error);
        return [];
      }

      return data as unknown as ParliamentaryGroupBasic[];
    },
    ["parliamentary-groups-list"],
    {
      tags: [TAGS.parliamentary_groups],
      revalidate: TTL.static,
    },
  ),
);
