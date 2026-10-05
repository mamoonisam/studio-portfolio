"use server";

import { withAdmin } from "@/lib/auth";
import { revalidateSite } from "@/lib/actions/revalidate";
import { newDisplayOrder } from "@/lib/actions/order-helpers";
import { videoSchema, videoToggleSchema } from "@/lib/validation/admin";
import { fieldErrors, uuid } from "@/lib/validation/common";
import { logError } from "@/lib/utils/log";
import { t } from "@/lib/i18n";
import type { ActionResult, Video } from "@/types/content";

const c = t.admin.common;
const v = t.admin.videos;

/** Adds a YouTube video (new ones go to the top of the list) or updates one. */
export async function saveVideo(input: unknown): Promise<ActionResult<Video>> {
  return withAdmin("videos:save", async ({ supabase }): Promise<ActionResult<Video>> => {
    const parsed = videoSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: c.saveFailed, fieldErrors: fieldErrors(parsed.error), code: "validation" };
    const { id, ...row } = parsed.data;

    const result = id
      ? await supabase.from("videos").update(row).eq("id", id).select("*").single()
      : await supabase
          .from("videos")
          .insert({ ...row, display_order: await newDisplayOrder(supabase, "videos", "start") })
          .select("*")
          .single();

    if (result.error) {
      logError("videos:save", result.error);
      return { ok: false, error: c.saveFailed, code: "server" };
    }
    revalidateSite();
    return { ok: true, data: result.data as Video, message: id ? c.saved : v.added };
  });
}

/** Quick switches from the list: show on homepage / visible on the site. */
export async function toggleVideo(input: unknown): Promise<ActionResult> {
  return withAdmin("videos:toggle", async ({ supabase }): Promise<ActionResult> => {
    const parsed = videoToggleSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: c.saveFailed, code: "validation" };
    const { id, field, value } = parsed.data;
    const { error } = await supabase.from("videos").update({ [field]: value }).eq("id", id);
    if (error) {
      logError("videos:toggle", error);
      return { ok: false, error: c.saveFailed, code: "server" };
    }
    revalidateSite();
    return { ok: true, message: c.saved };
  });
}

export async function deleteVideo(id: string): Promise<ActionResult> {
  return withAdmin("videos:delete", async ({ supabase }): Promise<ActionResult> => {
    const parsed = uuid.safeParse(id);
    if (!parsed.success) return { ok: false, error: c.deleteFailed, code: "validation" };
    // Only the link is removed; the video itself stays on YouTube.
    const { error } = await supabase.from("videos").delete().eq("id", parsed.data);
    if (error) {
      logError("videos:delete", error);
      return { ok: false, error: c.deleteFailed, code: "server" };
    }
    revalidateSite();
    return { ok: true, message: c.deleted };
  });
}
