"use server";

import { TriviaBasic } from "@/interfaces/trivia";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export async function getTrivias(): Promise<TriviaBasic[]> {
  noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("triviagame")
    .select(
      `
      *,
      person:person_id(id, fullname),
      political_party:political_party_id(id, name)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data as unknown as TriviaBasic[];
}
