"use server";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { withAdmin } from "@/lib/auth";
import { requirePublicEnv } from "@/lib/env";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { logError } from "@/lib/utils/log";
import { fieldErrors } from "@/lib/validation/common";
import { changePasswordSchema, setAdminPasswordSchema } from "@/lib/validation/account";
import { t } from "@/lib/i18n";
import type { ActionResult } from "@/types/content";

const a = t.admin.account;

/** Maps Supabase Auth password errors to a friendly Arabic message. */
function passwordErrorMessage(error: { code?: string; message?: string } | null): string | null {
  if (!error) return null;
  if (error.code === "same_password") return a.samePassword;
  if (error.code === "weak_password") return a.weak;
  return null;
}

/**
 * Confirms the current password with a throwaway client, so the visitor's
 * session cookies are not touched. The temporary session is revoked at once.
 */
async function verifyPassword(email: string, password: string): Promise<boolean> {
  const { url, key } = requirePublicEnv();
  const probe = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await probe.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.status !== 400) logError("account:verify", error);
    return false;
  }
  await probe.auth.signOut({ scope: "local" }).catch(() => undefined);
  return true;
}

/** Signed-in admin changes their own password (current password required). */
export async function changeOwnPassword(input: unknown): Promise<ActionResult> {
  return withAdmin("account:password", async ({ supabase, user }): Promise<ActionResult> => {
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: t.admin.common.saveFailed, fieldErrors: fieldErrors(parsed.error), code: "validation" };
    if (!user.email) return { ok: false, error: t.admin.common.saveFailed, code: "server" };

    if (!(await verifyPassword(user.email, parsed.data.current))) {
      return { ok: false, error: a.wrongCurrent, fieldErrors: { current: a.wrongCurrent }, code: "validation" };
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      const friendly = passwordErrorMessage(error);
      if (friendly) return { ok: false, error: friendly, fieldErrors: { password: friendly }, code: "validation" };
      logError("account:password:update", error);
      return { ok: false, error: t.admin.common.saveFailed, code: "server" };
    }
    return { ok: true, message: a.changed };
  });
}

async function isOwner(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase.from("admin_users").select("role").eq("user_id", userId).maybeSingle();
  if (error) {
    logError("account:role", error);
    return false;
  }
  return data?.role === "owner";
}

export interface AdminAccount {
  user_id: string;
  email: string;
  role: "owner" | "admin" | "editor";
}

/** Other admin accounts (owner only). Emails come from Supabase Auth via the server-only key. */
export async function listOtherAdmins(): Promise<ActionResult<AdminAccount[]>> {
  return withAdmin("account:list", async ({ supabase, user }): Promise<ActionResult<AdminAccount[]>> => {
    if (!(await isOwner(supabase, user.id))) return { ok: false, error: a.notOwner, code: "unauthorized" };
    const service = getServiceSupabase();
    if (!service) return { ok: false, error: a.notConfigured, code: "server" };

    const { data: rows, error } = await supabase.from("admin_users").select("user_id, role").neq("user_id", user.id);
    if (error) {
      logError("account:list", error);
      return { ok: false, error: t.admin.common.loadFailed, code: "server" };
    }

    const accounts: AdminAccount[] = [];
    for (const row of rows ?? []) {
      const { data, error: userError } = await service.auth.admin.getUserById(row.user_id);
      if (userError || !data.user) {
        if (userError) logError("account:list:user", userError);
        continue;
      }
      accounts.push({ user_id: row.user_id, email: data.user.email ?? "", role: row.role });
    }
    return { ok: true, data: accounts };
  });
}

/** Owner sets a new password for another admin (e.g. the photographer forgot theirs). */
export async function setAdminPassword(input: unknown): Promise<ActionResult> {
  return withAdmin("account:set-password", async ({ supabase, user }): Promise<ActionResult> => {
    const parsed = setAdminPasswordSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: t.admin.common.saveFailed, fieldErrors: fieldErrors(parsed.error), code: "validation" };
    if (!(await isOwner(supabase, user.id))) return { ok: false, error: a.notOwner, code: "unauthorized" };
    if (parsed.data.user_id === user.id) return { ok: false, error: a.notOwner, code: "validation" };

    // Only accounts that are admins of this site can be changed from here.
    const { data: target, error: targetError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", parsed.data.user_id)
      .maybeSingle();
    if (targetError || !target) {
      if (targetError) logError("account:set-password:target", targetError);
      return { ok: false, error: t.admin.common.saveFailed, code: "validation" };
    }

    const service = getServiceSupabase();
    if (!service) return { ok: false, error: a.notConfigured, code: "server" };

    const { error } = await service.auth.admin.updateUserById(parsed.data.user_id, { password: parsed.data.password });
    if (error) {
      const friendly = passwordErrorMessage(error);
      if (friendly) return { ok: false, error: friendly, fieldErrors: { password: friendly }, code: "validation" };
      logError("account:set-password", error);
      return { ok: false, error: t.admin.common.saveFailed, code: "server" };
    }
    return { ok: true };
  });
}
