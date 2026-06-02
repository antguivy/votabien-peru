import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";
import { Prisma } from "@/prisma/generated/client";

import { ElectoralProcess } from "@/interfaces/politics";
import prisma from "@/lib/prisma";

export const getElectoralProcess = cache(
  unstable_cache(
    async ({ active }: { active?: boolean | null } = {}): Promise<
      ElectoralProcess[]
    > => {
      try {
        const whereClause: Prisma.electoralprocessWhereInput = {};
        if (active !== undefined && active !== null) {
          whereClause.active = active;
        }

        const data = await prisma.electoralprocess.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            active: true,
            election_date: true,
            created_at: true,
            updated_at: true,
          },
        });

        return data.map((d) => ({
          ...d,
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
