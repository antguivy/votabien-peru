"use server";

import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { createPublicClient } from "@/lib/supabase/public";
import { unstable_cache } from "next/cache";

const fetchDistritos = unstable_cache(
  async (): Promise<ElectoralDistrictBase[]> => {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from("electoraldistrict")
      .select("id, name, code, is_national, active")
      .eq("active", true)
      .eq("is_national", false)
      .order("name", { ascending: true });

    if (error) return [];
    return data as unknown as ElectoralDistrictBase[];
  },
  ["distritos"],
  { revalidate: 86400 },
);

export default async function getDistritos() {
  return fetchDistritos();
}
