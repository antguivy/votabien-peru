import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { TAGS, TTL } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { cache } from "react";

export const getDistritos = cache(
  unstable_cache(
    async (): Promise<ElectoralDistrictBase[]> => {
      try {
        const data = await prisma.electoraldistrict.findMany({
          where: { active: true },
          select: {
            id: true,
            name: true,
            code: true,
            is_national: true,
            active: true,
          },
          orderBy: { name: "asc" },
        });

        return data as ElectoralDistrictBase[];
      } catch (error) {
        console.error("Error al obtener distritos:", error);
        return [];
      }
    },
    ["distritos-list"],
    {
      tags: [TAGS.districts],
      revalidate: TTL.static,
    },
  ),
);
