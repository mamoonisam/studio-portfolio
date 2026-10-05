import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requirePublicEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * Anonymous, cookie-free client for public pages. Because it never reads
 * cookies, public pages can be cached and regenerated (ISR). RLS limits it to
 * published content.
 */
export function getPublicSupabase(): SupabaseClient {
  if (!client) {
    const { url, key } = requirePublicEnv();
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}
