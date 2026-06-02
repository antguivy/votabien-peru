"use server";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";

import { HitoBasic } from "@/interfaces/hito";
import prisma from "@/lib/prisma";

export const getHitos = cache(
  unstable_cache(
    async (): Promise<HitoBasic[]> => {
      try {
        const data = await prisma.hito.findMany({
          where: { is_published: true },
          orderBy: { date: "asc" },
        });

        return data.map((d) => ({
          ...d,
          id: Number(d.id),
          index: d.index ? Number(d.index) : null,
        })) as unknown as HitoBasic[];
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    ["hitos-list"],
    {
      tags: [TAGS.hitos],
      revalidate: TTL.static,
    },
  ),
);
