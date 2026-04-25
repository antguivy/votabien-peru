import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";

import { ElectoralProcess } from "@/interfaces/politics";
import { createPublicClient } from "@/lib/supabase/public";

export const getElectoralProcess = cache(
  unstable_cache(
    async (active?: boolean | null): Promise<ElectoralProcess[]> => {
      const supabase = createPublicClient();

      const TABLE_NAME = "electoralprocess";

      let query = supabase.from(TABLE_NAME).select(`
          id,
          name,
          year,
          election_date,
          active
        `);

      if (active !== undefined && active !== null) {
        query = query.eq("active", active);
      }

      query = query.order("year", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error al obtener procesos electorales:", error);
        return [];
      }

      return data as unknown as ElectoralProcess[];
    },
    ["electoral-process-list"],
    {
      tags: [TAGS.electoral_process],
      revalidate: TTL.static,
    },
  ),
);
