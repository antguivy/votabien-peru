import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";

import { TeamBasic } from "@/interfaces/team";
import prisma from "@/lib/prisma";

export const getTeam = cache(
  unstable_cache(
    async (): Promise<TeamBasic[]> => {
      try {
        const data = await prisma.team.findMany({
          orderBy: { is_principal: "desc" },
        });

        return data as unknown as TeamBasic[];
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    ["team-list"],
    {
      tags: [TAGS.team],
      // revalidate: TTL.static,
    },
  ),
);
