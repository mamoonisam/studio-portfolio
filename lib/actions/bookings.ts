"use server";

import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/auth";
import { bookingNotesSchema, bookingStatusSchema } from "@/lib/validation/admin";
import { uuid } from "@/lib/validation/common";
import { logError } from "@/lib/utils/log";
import { t } from "@/lib/i18n";
import type { ActionResult } from "@/types/content";

const c = t.admin.common;

export async function setBookingStatus(input: unknown): Promise<ActionResult> {
  return withAdmin("bookings:status", async ({ supabase }) => {
    const parsed = bookingStatusSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: c.saveFailed, code: "validation" };
    const { error } = await supabase.from("bookings").update({ status: parsed.data.status }).eq("id", parsed.data.id);
    if (error) {
      logError("bookings:status", error);
      return { ok: false, error: c.saveFailed, code: "server" };
    }
    revalidatePath("/admin", "layout");
    return { ok: true, message: t.admin.bookings.statusSaved };
  });
}

export async function saveBookingNotes(input: unknown): Promise<ActionResult> {
  return withAdmin("bookings:notes", async ({ supabase }) => {
    const parsed = bookingNotesSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: c.saveFailed, code: "validation" };
    const { error } = await supabase.from("bookings").update({ admin_notes: parsed.data.admin_notes }).eq("id", parsed.data.id);
    if (error) {
      logError("bookings:notes", error);
      return { ok: false, error: c.saveFailed, code: "server" };
    }
    return { ok: true, message: t.admin.bookings.notesSaved };
  });
}

export async function deleteBooking(id: string): Promise<ActionResult> {
  return withAdmin("bookings:delete", async ({ supabase }) => {
    if (!uuid.safeParse(id).success) return { ok: false, error: c.deleteFailed, code: "validation" };
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) {
      logError("bookings:delete", error);
      return { ok: false, error: c.deleteFailed, code: "server" };
    }
    revalidatePath("/admin", "layout");
    return { ok: true, message: c.deleted };
  });
}
