"use server";

import { withAdmin } from "@/lib/auth";
import { revalidateSite } from "@/lib/actions/revalidate";
import { uniqueSlug } from "@/lib/actions/slug-helpers";
import { newDisplayOrder } from "@/lib/actions/order-helpers";
import { removeStorageFiles, replacedPaths } from "@/lib/actions/storage-helpers";
import { serviceSchema } from "@/lib/validation/admin";
import { fieldErrors, uuid } from "@/lib/validation/common";
import { isUniqueViolation, logError } from "@/lib/utils/log";
import { t } from "@/lib/i18n";
import type { ActionResult, Service } from "@/types/content";

const c = t.admin.common;

export async function saveService(input: unknown): Promise<ActionResult<Service>> {
  return withAdmin("services:save", async ({ supabase }) => {
    const parsed = serviceSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: c.saveFailed, fieldErrors: fieldErrors(parsed.error), code: "validation" };
    const d = parsed.data;

    let before: Service | null = null;
    if (d.id) {
      const { data, error } = await supabase.from("services").select("*").eq("id", d.id).maybeSingle();
      if (error) throw error;
      if (!data) return { ok: false, error: c.loadFailed, code: "validation" };
      before = data as Service;
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      const slugSource = d.slug || (before && before.title === d.title ? before.slug : d.title);
      const slug = await uniqueSlug(supabase, "services", slugSource, d.id);
      const row = { title: d.title, slug, description: d.description, image_path: d.image_path, active: d.active };

      const result = d.id
        ? await supabase.from("services").update(row).eq("id", d.id).select("*").single()
        : await supabase.from("services").insert({ ...row, display_order: await newDisplayOrder(supabase, "services") }).select("*").single();

      if (!result.error) {
        await removeStorageFiles(supabase, replacedPaths(before, row, ["image_path"]));
        revalidateSite();
        return { ok: true, data: result.data as Service, message: d.id ? c.saved : t.admin.services.created };
      }
      if (!isUniqueViolation(result.error)) {
        logError("services:save", result.error);
        return { ok: false, error: c.saveFailed, code: "server" };
      }
    }
    return { ok: false, error: c.saveFailed, code: "server" };
  });
}

export async function toggleService(id: string, active: boolean): Promise<ActionResult> {
  return withAdmin("services:toggle", async ({ supabase }) => {
    if (!uuid.safeParse(id).success) return { ok: false, error: c.saveFailed, code: "validation" };
    const { error } = await supabase.from("services").update({ active: Boolean(active) }).eq("id", id);
    if (error) {
      logError("services:toggle", error);
      return { ok: false, error: c.saveFailed, code: "server" };
    }
    revalidateSite();
    return { ok: true, message: c.saved };
  });
}

export async function deleteService(id: string): Promise<ActionResult> {
  return withAdmin("services:delete", async ({ supabase }) => {
    if (!uuid.safeParse(id).success) return { ok: false, error: c.deleteFailed, code: "validation" };
    const { data: before } = await supabase.from("services").select("image_path").eq("id", id).maybeSingle();
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      logError("services:delete", error);
      return { ok: false, error: c.deleteFailed, code: "server" };
    }
    await removeStorageFiles(supabase, [before?.image_path as string | null]);
    revalidateSite();
    return { ok: true, message: c.deleted };
  });
}
