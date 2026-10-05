import type { Metadata } from "next";
import { ForgotForm } from "@/components/admin/RecoveryForms";
import { isSupabaseConfigured } from "@/lib/env";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.admin.recovery.forgotTitle };

type Props = { searchParams: Promise<{ error?: string | string[] }> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const notice = !isSupabaseConfigured()
    ? t.admin.login.notConfigured
    : params.error === "link"
      ? t.admin.recovery.linkInvalid
      : null;

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="eyebrow">{t.admin.brand}</p>
        <h1 className="mt-1 mb-8 font-sans text-2xl font-semibold">{t.admin.recovery.forgotTitle}</h1>
        <div className="card p-6 sm:p-7">
          <ForgotForm notice={notice} />
        </div>
      </div>
    </main>
  );
}
