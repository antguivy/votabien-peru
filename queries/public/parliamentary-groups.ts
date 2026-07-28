import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";
import { Prisma } from "@/prisma/generated/client";

import { ParliamentaryGroupBasic } from "@/interfaces/parliamentary-membership";
import prisma from "@/lib/prisma";

export const getParliamentaryGroups = cache(
  unstable_cache(
    async (active: boolean = true): Promise<ParliamentaryGroupBasic[]> => {
      try {
        const whereClause: Prisma.parliamentarygroupWhereInput = {};
        if (active) {
          whereClause.active = true;
        }

        const data = await prisma.parliamentarygroup.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            acronym: true,
            logo_url: true,
            color_hex: true,
            government_audio_url: true,
          },
          orderBy: { name: "asc" },
        });

        return data as unknown as ParliamentaryGroupBasic[];
      } catch (error) {
        console.error("Error al obtener grupos parlamentarios:", error);
        return [];
      }
    },
    ["parliamentary-groups-list"],
    {
      tags: [TAGS.parliamentary_groups],
      // revalidate: TTL.static,
    },
  ),
);
