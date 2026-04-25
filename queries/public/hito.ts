"use server";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";

import { HitoBasic } from "@/interfaces/hito";
import { createPublicClient } from "@/lib/supabase/public";

export const getHitos = cache(
  unstable_cache(
    async (): Promise<HitoBasic[]> => {
      const supabase = createPublicClient();

      const { data, error } = await supabase
        .from("hito")
        .select("*")
        .order("index", { ascending: false });

      if (error) {
        console.error(error);
        return [];
      }

      return data as unknown as HitoBasic[];
    },
    ["hitos-list"],
    {
      tags: [TAGS.hitos], // Asegúrate de tener este tag en tu archivo
      revalidate: TTL.static,
    },
  ),
);
