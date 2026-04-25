import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";

import { PersonWithActivePeriod } from "@/interfaces/person";
import { createPublicClient } from "@/lib/supabase/public";

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
      const supabase = createPublicClient();

      const searchTerm = search.trim();

      if (!searchTerm) return [];

      const { data, error } = await supabase
        .from("person")
        .select("id, fullname, image_candidate_url, profession")
        .ilike("fullname", `%${searchTerm}%`)
        .order("fullname", { ascending: true })
        .range(skip, skip + limit - 1);

      if (error) {
        console.error("Error searching personas:", error);
        return [];
      }

      return (data || []) as unknown as PersonWithActivePeriod[];
    },
    ["personas-search"], // La key base. Next.js le agregará el search, limit y skip automáticamente.
    {
      tags: [TAGS.persons], // Recuerda agregarlo a tu cache-tags.ts
      revalidate: TTL.static,
    },
  ),
);
