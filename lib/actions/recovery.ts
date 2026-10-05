"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { logError } from "@/lib/utils/log";
import { emailSchema, newPasswordSchema } from "@/lib/validation/account";
import { t } from "@/lib/i18n";

const r = t.admin.recovery;

export interface RecoveryState {
  error: string | null;
  done: boolean;
  email: string;
}

/**
 * Sends a password-reset link. The answer is the same whether or not the
 * email exists, so this page cannot be used to discover admin addresses.
 */
export async function requestPasswordReset(_prev: RecoveryState, formData: FormData): Promise<RecoveryState> {
  const raw = typeof formData.get("email") === "string" ? String(formData.get("email")) : "";
  if (!isSupabaseConfigured()) return { error: t.admin.login.notConfigured, done: false, email: raw };

  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) return { error: r.invalidEmail, done: false, email: raw };

  try {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${publicEnv.siteUrl}/admin/auth/callback`,
    });
    if (error) {
      if (error.status === 429) return { error: r.tooMany, done: false, email: raw };
      logError("recovery:request", error);
    }
  } catch (error) {
    logError("recovery:request", error);
    return { error: r.generic, done: false, email: raw };
  }
  return { error: null, done: true, email: raw };
}

export interface ResetState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

/** Sets the new password for the user signed in through the reset link. */
export async function completePasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password") ?? "",
    confirm: formData.get("confirm") ?? "",
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      if (!fe[key]) fe[key] = issue.message;
    }
    return { error: Object.values(fe)[0] ?? r.generic, fieldErrors: fe };
  }

  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: r.linkInvalid };

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      if (error.code === "same_password") return { error: t.admin.account.samePassword, fieldErrors: { password: t.admin.account.samePassword } };
      if (error.code === "weak_password") return { error: t.admin.account.weak, fieldErrors: { password: t.admin.account.weak } };
      logError("recovery:update", error);
      return { error: r.generic };
    }
    // Start clean: sign out of the recovery session and log in normally.
    await supabase.auth.signOut();
  } catch (error) {
    logError("recovery:update", error);
    return { error: r.generic };
  }
  redirect("/admin/login?changed=1");
}
