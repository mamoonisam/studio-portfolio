"use client";

import { useEffect } from "react";
import { t } from "@/lib/i18n";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error.digest ?? error.name);
  }, [error]);

  return (
    <div className="rounded-2xl border border-line bg-surface p-8">
      <h1 className="text-xl font-semibold">{t.admin.common.loadFailed}</h1>
      <p className="mt-2 text-muted">{t.errors.body}</p>
      <button type="button" className="btn btn-primary mt-6" onClick={reset}>{t.errors.retry}</button>
    </div>
  );
}
