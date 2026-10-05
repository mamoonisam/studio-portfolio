"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requirePublicEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

/** Supabase client for the browser (admin uploads). Uses the signed-in session cookie. */
export function getBrowserSupabase(): SupabaseClient {
  if (!client) {
    const { url, key } = requirePublicEnv();
    client = createBrowserClient(url, key);
  }
  return client;
}
