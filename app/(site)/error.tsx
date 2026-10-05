"use client";

import Link from "next/link";
import { useEffect } from "react";
import { t } from "@/lib/i18n";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Details stay in the console/server logs; the visitor sees a calm message.
    console.error(error.digest ?? error.name);
  }, [error]);

  return (
    <div className="container-x flex min-h-[70vh] flex-col items-start justify-center gap-5 pt-[var(--header-h)]">
      <h1 className="display-2">{t.errors.title}</h1>
      <p className="lead">{t.errors.body}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">{t.errors.retry}</button>
        <Link href="/" className="btn btn-outline">{t.errors.home}</Link>
      </div>
    </div>
  );
}
