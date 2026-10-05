"use server";

import { withAdmin } from "@/lib/auth";
import { revalidateSite } from "@/lib/actions/revalidate";
import { newDisplayOrder } from "@/lib/actions/order-helpers";
import { removeStorageFiles, replacedPaths } from "@/lib/actions/storage-helpers";
import { packageSchema } from "@/lib/validation/admin";
import { fieldErrors, uuid } from "@/lib/validation/common";
import { logError } from "@/lib/utils/log";
import { t } from "@/lib/i18n";
import type { ActionResult, Package } from "@/types/content";

const c = t.admin.common;

export async function savePackage(input: unknown): Promise<ActionResult<Package>> {
  return withAdmin("packages:save", async ({ supabase }) => {
    const parsed = packageSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: c.saveFailed, fieldErrors: fieldErrors(parsed.error), code: "validation" };
    const d = parsed.data;

    let before: Package | null = null;
    if (d.id) {
      const { data, error } = await supabase.from("packages").select("*").eq("id", d.id).maybeSingle();
      if (error) throw error;
      if (!data) return { ok: false, error: c.loadFailed, code: "validation" };
      before = data as Package;
    }

    const row = {
      title: d.title,
      description: d.description,
      price: d.price,
      currency: d.currency,
      features: d.features,
      cover_image_path: d.cover_image_path,
      featured: d.featured,
      active: d.active,
    };

    const result = d.id
      ? await supabase.from("packages").update(row).eq("id", d.id).select("*").single()
      : await supabase
          .from("packages")
          .insert({ ...row, display_order: await newDisplayOrder(supabase, "packages") })
          .select("*")
          .single();

    if (result.error) {
      logError("packages:save", result.error);
      return { ok: false, error: c.saveFailed, code: "server" };
    }

    await removeStorageFiles(supabase, replacedPaths(before, row, ["cover_image_path"]));
    revalidateSite();
    return { ok: true, data: result.data as Package, message: d.id ? c.saved : t.admin.packages.created };
  });
}

export async function setPackageFlags(id: string, flags: { active?: boolean; featured?: boolean }): Promise<ActionResult> {
  return withAdmin("packages:flags", async ({ supabase }) => {
    if (!uuid.safeParse(id).success) return { ok: false, error: c.saveFailed, code: "validation" };
    const patch: Record<string, boolean> = {};
    if (typeof flags?.active === "boolean") patch.active = flags.active;
    if (typeof flags?.featured === "boolean") patch.featured = flags.featured;
    if (Object.keys(patch).length === 0) return { ok: false, error: c.noChange, code: "validation" };
    const { error } = await supabase.from("packages").update(patch).eq("id", id);
    if (error) {
      logError("packages:flags", error);
      return { ok: false, error: c.saveFailed, code: "server" };
    }
    revalidateSite();
    return { ok: true, message: c.saved };
  });
}

export async function deletePackage(id: string): Promise<ActionResult> {
  return withAdmin("packages:delete", async ({ supabase }) => {
    if (!uuid.safeParse(id).success) return { ok: false, error: c.deleteFailed, code: "validation" };
    const { data: before } = await supabase.from("packages").select("cover_image_path").eq("id", id).maybeSingle();
    // Bookings keep the package title/price snapshot (package_id becomes null).
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) {
      logError("packages:delete", error);
      return { ok: false, error: c.deleteFailed, code: "server" };
    }
    await removeStorageFiles(supabase, [before?.cover_image_path as string | null]);
    revalidateSite();
    return { ok: true, message: c.deleted };
  });
}
