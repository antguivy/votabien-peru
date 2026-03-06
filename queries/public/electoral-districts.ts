"use server";

import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { createClient } from "@/lib/supabase/server";

export default async function getDistritos(): Promise<ElectoralDistrictBase[]> {
  const supabase = await createClient();
  const TABLE_NAME = "electoraldistrict";

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      `
      id,
      name,
      code,
      is_national,
      active
    `,
    )
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al obtener distritos:", error);
    return [];
  }

  return data as unknown as ElectoralDistrictBase[];
}
