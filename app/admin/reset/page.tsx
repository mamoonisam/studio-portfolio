import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetForm } from "@/components/admin/RecoveryForms";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.admin.recovery.resetTitle };

/** Reached only through the reset email (which signs the visitor in briefly). */
export default async function ResetPasswordPage() {
  if (!isSupabaseConfigured()) redirect("/admin/forgot");
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/forgot?error=link");

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="eyebrow">{t.admin.brand}</p>
        <h1 className="mt-1 mb-2 font-sans text-2xl font-semibold">{t.admin.recovery.resetTitle}</h1>
        <p className="mb-8 text-sm text-muted" dir="ltr">{user.email}</p>
        <div className="card p-6 sm:p-7">
          <ResetForm />
        </div>
      </div>
    </main>
  );
}
