import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requirePublicEnv } from "@/lib/env";
import { getSecretKey } from "@/lib/env.server";

/**
 * Privileged client using the server-only secret key. It bypasses RLS, so it
 * is used for exactly one thing: calling submit_booking() after the server has
 * validated a public booking request. Never import this from client code.
 */
export function getServiceSupabase(): SupabaseClient | null {
  const secret = getSecretKey();
  if (!secret) return null;
  const { url } = requirePublicEnv();
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
