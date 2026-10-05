import Link from "next/link";
import { t } from "@/lib/i18n";

export default function NotFound() {
  return (
    <main className="container-x flex min-h-[80vh] flex-col items-start justify-center gap-5">
      <p className="font-display text-7xl text-muted" aria-hidden="true">404</p>
      <h1 className="display-2">{t.errors.notFoundTitle}</h1>
      <p className="lead">{t.errors.notFoundBody}</p>
      <Link href="/" className="btn btn-primary">{t.errors.home}</Link>
    </main>
  );
}
