import { z } from "zod";

/** Removes control characters and trims; keeps line breaks for multi-line text. */
export function clean(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim();
}

export const text = (max: number, message?: string) =>
  z
    .string()
    .max(max * 2) // raw guard before cleaning
    .transform(clean)
    .refine((v) => v.length <= max, { message: message ?? "النص أطول من المسموح." });

export const requiredText = (min: number, max: number, message: string) =>
  z
    .string({ error: message })
    .max(max * 2)
    .transform(clean)
    .refine((v) => v.length >= min && v.length <= max, { message });

export const optionalText = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (typeof v === "string" ? clean(v) : ""))
    .refine((v) => v.length <= max, { message: "النص أطول من المسموح." })
    .transform((v) => (v === "" ? null : v));

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const uuid = z.string().regex(UUID_RE, { message: "معرّف غير صالح." });

export const optionalUuid = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
  .refine((v) => v === null || UUID_RE.test(v), { message: "معرّف غير صالح." });

export const bool = z
  .union([z.boolean(), z.string(), z.null(), z.undefined()])
  .transform((v) => v === true || v === "true" || v === "on" || v === "1");

/** Maps zod issues to { field: firstMessage } for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
