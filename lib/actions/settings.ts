"use server";

import { withAdmin } from "@/lib/auth";
import { revalidateSite } from "@/lib/actions/revalidate";
import { removeStorageFiles, replacedPaths } from "@/lib/actions/storage-helpers";
import { settingsSchema } from "@/lib/validation/admin";
import { fieldErrors } from "@/lib/validation/common";
import { logError } from "@/lib/utils/log";
import { t } from "@/lib/i18n";
import type { ActionResult } from "@/types/content";

const IMAGE_KEYS = ["logo_path", "favicon_path", "hero_image_path", "about_image_path", "og_image_path"];

/** Saves any subset of settings fields (each settings tab sends its own fields). */
export async function saveSettings(input: unknown): Promise<ActionResult> {
  return withAdmin("settings:save", async ({ supabase }) => {
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: t.admin.common.saveFailed, fieldErrors: fieldErrors(parsed.error), code: "validation" };
    }
    const patch = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
    if (Object.keys(patch).length === 0) return { ok: false, error: t.admin.common.noChange, code: "validation" };

    const { data: before, error: readError } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (readError) throw readError;

    const { error } = before
      ? await supabase.from("site_settings").update(patch).eq("id", 1)
      : await supabase.from("site_settings").insert({ id: 1, ...patch });
    if (error) {
      logError("settings:save", error);
      return { ok: false, error: t.admin.common.saveFailed, code: "server" };
    }

    await removeStorageFiles(supabase, replacedPaths(before, patch, IMAGE_KEYS));
    revalidateSite();
    return { ok: true, message: t.admin.common.saved };
  });
}
