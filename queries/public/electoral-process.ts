import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";

import { ElectoralProcess } from "@/interfaces/politics";
import prisma from "@/lib/prisma";

export const getElectoralProcess = cache(
  unstable_cache(
    async (active?: boolean | null): Promise<ElectoralProcess[]> => {
      try {
        const whereClause: any = {};
        if (active !== undefined && active !== null) {
          whereClause.active = active;
        }

        const data = await prisma.electoralprocess.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            year: true,
            election_date: true,
            active: true,
          },
          orderBy: { year: "desc" },
        });

        // Prisma returns Date for election_date, convert it if ElectoralProcess expects string
        return data.map(d => ({
          ...d,
          election_date: (d.election_date as unknown as string), // Cast to string if your interface expects it. Prisma gives Date.
        })) as unknown as ElectoralProcess[];
      } catch (error) {
        console.error("Error al obtener procesos electorales:", error);
        return [];
      }
    },
    ["electoral-process-list"],
    {
      tags: [TAGS.electoral_process],
      revalidate: TTL.static,
    },
  ),
);
