import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.admin.login.title };

type Props = { searchParams: Promise<{ next?: string | string[]; error?: string | string[]; changed?: string | string[] }> };

export default async function LoginPage({ searchParams }: Props) {
  // Already signed in as admin → straight to the dashboard.
  if (await getAdmin().catch(() => null)) redirect("/admin");

  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const success = params.changed === "1" ? t.admin.login.passwordChanged : null;
  const notice = !isSupabaseConfigured()
    ? t.admin.login.notConfigured
    : params.error === "forbidden"
      ? t.admin.login.forbidden
      : null;

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="eyebrow">{t.admin.brand}</p>
        <h1 className="mt-1 mb-8 font-sans text-2xl font-semibold">{t.admin.login.title}</h1>
        <div className="card p-6 sm:p-7">
          <LoginForm next={next} notice={notice} success={success} />
        </div>
      </div>
    </main>
  );
}
