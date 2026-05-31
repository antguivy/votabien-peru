import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/interfaces/supabase";

export async function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://mock.url",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-key",
  );
}
