import { toAsciiDigits } from "./format";

/** Digits only, without a leading "+" or "00". */
export function phoneDigits(input: string): string {
  const digits = toAsciiDigits(input || "").replace(/\D/g, "");
  return digits.startsWith("00") ? digits.slice(2) : digits;
}

/**
 * WhatsApp link with a pre-filled, URL-encoded message.
 * `countryCode` converts local numbers (0770…) to international (964770…).
 */
export function whatsappLink(number: string, message?: string, countryCode?: string): string | null {
  let digits = phoneDigits(number);
  if (!digits) return null;
  const cc = phoneDigits(countryCode || "");
  if (digits.startsWith("0") && cc) digits = cc + digits.replace(/^0+/, "");
  if (digits.length < 8) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function telLink(number: string): string | null {
  const raw = toAsciiDigits(number || "").trim();
  const plus = raw.startsWith("+") ? "+" : "";
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 6 ? `tel:${plus}${digits}` : null;
}

/** Only allow http(s) links from settings into href attributes. */
export function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}
