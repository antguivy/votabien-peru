"use server";

import { HitoBasic } from "@/interfaces/hito";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export async function getHitos(): Promise<HitoBasic[]> {
  noStore();
  const supabase = await createClient();

  const { data, error } = await supabase.from("hito").select(
    `
      *
    `,
  );

  if (error) {
    console.error(error);
    return [];
  }

  return data as unknown as HitoBasic[];
}
