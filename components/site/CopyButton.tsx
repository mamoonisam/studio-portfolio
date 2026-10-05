"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { t } from "@/lib/i18n";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-icon btn-ghost text-muted"
      aria-label={`${t.contact.copy} ${label}`}
      title={copied ? t.contact.copied : t.contact.copy}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable — the value is still selectable */
        }
      }}
    >
      {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
    </button>
  );
}
