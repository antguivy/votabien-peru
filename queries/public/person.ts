"use server";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS } from "@/lib/cache-tags";

import { PersonWithActivePeriod } from "@/interfaces/person";
import prisma from "@/lib/prisma";

interface GetPersonasParams {
  search: string;
  limit?: number;
  skip?: number;
}

export const getPersonas = cache(
  unstable_cache(
    async ({
      search,
      limit = 10,
      skip = 0,
    }: GetPersonasParams): Promise<PersonWithActivePeriod[]> => {
      const searchTerm = search.trim();

      if (!searchTerm) return [];

      try {
        const data = await prisma.person.findMany({
          where: {
            fullname: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            fullname: true,
            image_candidate_url: true,
            profession: true,
          },
          orderBy: { fullname: "asc" },
          skip,
          take: limit,
        });

        return data as unknown as PersonWithActivePeriod[];
      } catch (error) {
        console.error("Error searching personas:", error);
        return [];
      }
    },
    ["personas-search"],
    {
      tags: [TAGS.persons],
      // revalidate: TTL.static,
    },
  ),
);
