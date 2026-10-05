"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { logError } from "@/lib/utils/log";
import { t } from "@/lib/i18n";

export interface LoginState {
  error: string | null;
  email: string;
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(200),
  password: z.string().min(1).max(200),
  next: z.string().max(300).optional(),
});

/** Only allow redirects back inside the admin area. */
function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.startsWith("/admin/login")) return "/admin";
  return next;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
    next: formData.get("next") ?? undefined,
  });
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")) : "";

  if (!isSupabaseConfigured()) return { error: t.admin.login.notConfigured, email };
  if (!parsed.success || !parsed.data.email) return { error: t.admin.login.invalid, email };

  let destination = "/admin";
  try {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) {
      // Wrong credentials are expected; log other failures only.
      if (error.status !== 400) logError("auth:login", error);
      return { error: t.admin.login.invalid, email };
    }

    const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
    if (rpcError || isAdmin !== true) {
      if (rpcError) logError("auth:login:is_admin", rpcError);
      await supabase.auth.signOut();
      return { error: t.admin.login.forbidden, email };
    }
    destination = safeNext(parsed.data.next);
  } catch (error) {
    logError("auth:login", error);
    return { error: t.admin.login.generic, email };
  }

  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  try {
    const supabase = await getServerSupabase();
    await supabase.auth.signOut();
  } catch (error) {
    logError("auth:logout", error);
  }
  redirect("/admin/login");
}
