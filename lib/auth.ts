import "server-only";

import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { logError } from "@/lib/utils/log";
import { t } from "@/lib/i18n";
import type { ActionResult } from "@/types/content";

export interface AdminContext {
  supabase: SupabaseClient;
  user: User;
}

/**
 * Returns the signed-in admin, or null. "Admin" means: a valid Supabase Auth
 * session AND a row in admin_users with role owner/admin (checked in SQL by
 * public.is_admin()). A signed-in user without that row is not an admin.
 */
export async function getAdmin(): Promise<AdminContext | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
  if (rpcError) {
    logError("auth:is_admin", rpcError);
    return null;
  }
  return isAdmin === true ? { supabase, user } : null;
}

/** For admin pages/layouts: redirects to the login page when not allowed. */
export async function requireAdminPage(): Promise<AdminContext> {
  const admin = await getAdmin();
  if (admin) return admin;

  // Signed in, but not an admin → explain on the login page.
  let signedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await getServerSupabase();
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  }
  redirect(signedIn ? "/admin/login?error=forbidden" : "/admin/login");
}

type AdminHandler<T> = (ctx: AdminContext) => Promise<ActionResult<T>>;

/**
 * Wraps every admin server action: verifies the admin on the server, and turns
 * unexpected errors into a friendly message (details go to the server log).
 */
export async function withAdmin<T = undefined>(scope: string, handler: AdminHandler<T>): Promise<ActionResult<T>> {
  let ctx: AdminContext | null;
  try {
    ctx = await getAdmin();
  } catch (error) {
    logError(`${scope}:auth`, error);
    return { ok: false, error: t.admin.common.saveFailed, code: "server" };
  }
  if (!ctx) return { ok: false, error: t.admin.common.sessionExpired, code: "unauthorized" };

  try {
    return await handler(ctx);
  } catch (error) {
    // Let Next.js redirects/notFound propagate.
    if (error && typeof error === "object" && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_")) {
      throw error;
    }
    logError(scope, error);
    return { ok: false, error: t.admin.common.saveFailed, code: "server" };
  }
}
