import Link from "next/link";
import { t } from "@/lib/i18n";

export default function SiteNotFound() {
  return (
    <div className="container-x flex min-h-[70vh] flex-col items-start justify-center gap-5 pt-[var(--header-h)]">
      <p className="font-display text-7xl text-muted" aria-hidden="true">404</p>
      <h1 className="display-2">{t.errors.notFoundTitle}</h1>
      <p className="lead">{t.errors.notFoundBody}</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">{t.errors.home}</Link>
        <Link href="/portfolio" className="btn btn-outline">{t.home.viewAll}</Link>
      </div>
    </div>
  );
}
