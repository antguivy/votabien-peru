import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";

import { TeamBasic } from "@/interfaces/team";
import { createPublicClient } from "@/lib/supabase/public";

export const getTeam = cache(
  unstable_cache(
    async (): Promise<TeamBasic[]> => {
      const supabase = createPublicClient();

      const { data, error } = await supabase
        .from("team")
        .select("*")
        .order("is_principal", { ascending: false });

      if (error) {
        console.error(error);
        return [];
      }

      return data as unknown as TeamBasic[];
    },
    ["team-list"],
    {
      tags: [TAGS.team],
      revalidate: TTL.static,
    },
  ),
);
