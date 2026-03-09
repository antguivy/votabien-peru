import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/interfaces/supabase";

export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
