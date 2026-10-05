import { localeConfig } from "@/lib/i18n";

/** "250000" + "د.ع" → "250,000 د.ع". Currency is whatever the photographer typed. */
export function formatPrice(price: number | null, currency: string): string | null {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return null;
  const amount = new Intl.NumberFormat(localeConfig.numberLocale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(price));
  const cur = (currency || "").trim();
  if (!cur) return amount;
  // Symbols like "$" read naturally before the number; words/abbreviations after it.
  return cur.length === 1 && /[^\p{L}]/u.test(cur) ? `${cur}${amount}` : `${amount} ${cur}`;
}

const dateFmt = new Intl.DateTimeFormat(localeConfig.dateLocale, {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const dateTimeFmt = new Intl.DateTimeFormat(localeConfig.dateLocale, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Formats a plain date column (YYYY-MM-DD) without time-zone drift. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(d.getTime()) ? value : dateFmt.format(d);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : dateTimeFmt.format(d);
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Converts Arabic-Indic and Persian digits to ASCII digits. */
export function toAsciiDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}
