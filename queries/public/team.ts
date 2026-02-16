"use server";

import { TeamBasic } from "@/interfaces/team";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export async function getTeam(): Promise<TeamBasic[]> {
  noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team")
    .select(
      `
      *
    `,
    )
    .order("is_principal", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data as unknown as TeamBasic[];
}
