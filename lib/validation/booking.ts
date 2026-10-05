import { z } from "zod";
import { t } from "@/lib/i18n";
import { toAsciiDigits } from "@/lib/utils/format";
import { optionalText, optionalUuid, requiredText } from "./common";

const v = t.booking.validation;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Today's date (UTC) minus one day of slack for visitors in other time zones. */
function earliestAllowed(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function latestAllowed(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1095);
  return d.toISOString().slice(0, 10);
}

export const PHONE_RE = /^\+?[0-9][0-9\s\-()]{5,28}$/;

export const bookingSchema = z.object({
  customer_name: requiredText(2, 120, v.name),
  phone: z
    .string({ error: v.phone })
    .max(60)
    .transform((s) => toAsciiDigits(s).trim())
    .refine((s) => PHONE_RE.test(s) && s.replace(/\D/g, "").length >= 6, { message: v.phone })
    .transform((s) => s.replace(/[\s\-()]/g, "")),
  service_id: optionalUuid,
  package_id: optionalUuid,
  requested_date: z
    .string({ error: v.date })
    .refine(isRealDate, { message: v.date })
    .refine((d) => d >= earliestAllowed(), { message: v.datePast })
    .refine((d) => d <= latestAllowed(), { message: v.dateFar }),
  preferred_time: optionalText(60),
  location: optionalText(300),
  notes: optionalText(2000),
});

export type BookingInput = z.infer<typeof bookingSchema>;
