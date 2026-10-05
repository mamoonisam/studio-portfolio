"use client";

import { t } from "@/lib/i18n";

/** Last-resort error screen (when even the root layout fails). Uses inline styles only. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, fontFamily: "system-ui, Tahoma, sans-serif", background: "#fafaf8", color: "#161615" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1.5rem" }}>
          <div style={{ maxWidth: "32rem" }}>
            <h1 style={{ fontSize: "1.75rem", margin: "0 0 0.75rem" }}>{t.errors.title}</h1>
            <p style={{ color: "#6b6963", margin: "0 0 1.5rem" }}>{t.errors.body}</p>
            <button
              type="button"
              onClick={reset}
              style={{ padding: "0.7rem 1.4rem", borderRadius: 999, border: 0, background: "#161615", color: "#fff", cursor: "pointer", fontSize: "1rem" }}
            >
              {t.errors.retry}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
