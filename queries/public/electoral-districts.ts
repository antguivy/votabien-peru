import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { TAGS, TTL } from "@/lib/cache-tags";
import { createPublicClient } from "@/lib/supabase/public";
import { unstable_cache } from "next/cache";
import { cache } from "react";

export const getDistritos = cache(
  unstable_cache(
    async (): Promise<ElectoralDistrictBase[]> => {
      const supabase = await createPublicClient();
      const { data, error } = await supabase
        .from("electoraldistrict")
        .select("id, name, code, is_national, active")
        .eq("active", true)
        // .eq("is_national", false)
        .order("name", { ascending: true });

      if (error) return [];
      return data as unknown as ElectoralDistrictBase[];
    },
    ["distritos-list"], // Identificador único interno para Next.js
    {
      // Si en el futuro agregas distritos desde el admin, usarás revalidateTag(TAGS.districts)
      tags: [TAGS.districts], // Asegúrate de agregar "districts" a tu archivo cache-tags.ts
      revalidate: TTL.static,
    },
  ),
);
