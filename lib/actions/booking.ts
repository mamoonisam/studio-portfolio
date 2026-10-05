"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { bookingSchema } from "@/lib/validation/booking";
import { fieldErrors } from "@/lib/validation/common";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { getBookingMaxPerHour, getBookingSalt } from "@/lib/env.server";
import { logError } from "@/lib/utils/log";
import { t } from "@/lib/i18n";
import type { ActionResult } from "@/types/content";

const e = t.booking.errors;

/** Minimum time (ms) between showing the form and submitting it. Bots are faster. */
const MIN_FILL_MS = 2500;

async function visitorFingerprint(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("cf-connecting-ip")?.trim() ||
    "unknown";
  return createHash("sha256").update(`${getBookingSalt()}:${ip}`).digest("hex").slice(0, 40);
}

export interface BookingPayload {
  customer_name: string;
  phone: string;
  service_id?: string | null;
  package_id?: string | null;
  requested_date: string;
  preferred_time?: string;
  location?: string;
  notes?: string;
  /** Honeypot: real visitors never see or fill this field. */
  website?: string;
  /** Timestamp (ms) when the form was shown. */
  started_at?: number;
}

/**
 * The only public write path. Validates on the server (never trusting the
 * browser), filters bots, and saves through submit_booking() which also rate
 * limits and ignores double submissions.
 */
export async function submitBooking(payload: BookingPayload): Promise<ActionResult<{ id: string }>> {
  try {
    if (!payload || typeof payload !== "object") return { ok: false, error: e.generic, code: "validation" };

    // Honeypot filled → pretend success so bots learn nothing.
    if (typeof payload.website === "string" && payload.website.trim() !== "") {
      return { ok: true, data: { id: "" } };
    }

    if (typeof payload.started_at === "number" && Date.now() - payload.started_at < MIN_FILL_MS) {
      return { ok: false, error: e.tooFast, code: "validation" };
    }

    const parsed = bookingSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, error: e.fix, fieldErrors: fieldErrors(parsed.error), code: "validation" };
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      logError("booking:config", new Error("SUPABASE_SECRET_KEY is not set"));
      return { ok: false, error: e.notConfigured, code: "server" };
    }

    const d = parsed.data;
    const { data, error } = await supabase.rpc("submit_booking", {
      p_customer_name: d.customer_name,
      p_phone: d.phone,
      p_service_id: d.service_id,
      p_package_id: d.package_id,
      p_requested_date: d.requested_date,
      p_preferred_time: d.preferred_time ?? "",
      p_location: d.location ?? "",
      p_notes: d.notes ?? "",
      p_ip_hash: await visitorFingerprint(),
      p_max_per_hour: getBookingMaxPerHour(),
    });

    if (error) {
      const msg = error.message || "";
      if (msg.includes("rate_limited")) return { ok: false, error: e.rateLimited, code: "validation" };
      if (msg.includes("invalid_date")) return { ok: false, error: e.invalidDate, fieldErrors: { requested_date: e.invalidDate }, code: "validation" };
      if (msg.includes("invalid_service")) return { ok: false, error: e.invalidService, fieldErrors: { service_id: e.invalidService }, code: "validation" };
      if (msg.includes("invalid_package")) return { ok: false, error: e.invalidPackage, fieldErrors: { package_id: e.invalidPackage }, code: "validation" };
      logError("booking:submit", error);
      return { ok: false, error: e.generic, code: "server" };
    }

    return { ok: true, data: { id: String(data ?? "") } };
  } catch (error) {
    logError("booking:submit", error);
    return { ok: false, error: e.generic, code: "server" };
  }
}
