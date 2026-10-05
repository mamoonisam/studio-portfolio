import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { PackageCard } from "@/components/site/PackageCard";
import { getPackages, getSettings } from "@/lib/data/public";
import { t } from "@/lib/i18n";
import { whatsappLink } from "@/lib/utils/contact";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: s.packages_title || t.packages.title,
    description: s.packages_intro || undefined,
    alternates: { canonical: "/packages" },
  };
}

export default async function PackagesPage() {
  const [s, packages] = await Promise.all([getSettings(), getPackages()]);
  const wa = whatsappLink(s.whatsapp, t.whatsapp.greeting);

  return (
    <>
      <PageHeader title={s.packages_title || t.packages.title} intro={s.packages_intro} />
      <div className="container-x pb-24">
        {packages.length > 0 ? (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((p) => (
              <li key={p.id}>
                <PackageCard pkg={p} whatsapp={s.whatsapp} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[var(--radius)] border border-dashed border-line px-6 py-16 text-center">
            <p className="text-muted">{t.packages.empty}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/booking" className="btn btn-primary">{t.home.bookNow}</Link>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline">{t.social.whatsapp}</a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
