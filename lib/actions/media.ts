"use server";

import { z } from "zod";
import { withAdmin } from "@/lib/auth";
import { revalidateSite } from "@/lib/actions/revalidate";
import { removeStorageFiles, storageFileExists } from "@/lib/actions/storage-helpers";
import { bulkMediaSchema, registerMediaSchema, reorderSchema, updateMediaSchema } from "@/lib/validation/admin";
import { fieldErrors, optionalUuid } from "@/lib/validation/common";
import { isUniqueViolation, logError } from "@/lib/utils/log";
import { t } from "@/lib/i18n";
import type { ActionResult, Media } from "@/types/content";

const m = t.admin.media;

/** Saves a photo's details after the browser uploaded the file to Storage. */
export async function registerMedia(input: unknown): Promise<ActionResult<Media>> {
  return withAdmin("media:register", async ({ supabase }) => {
    const parsed = registerMediaSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: m.uploadFailed, fieldErrors: fieldErrors(parsed.error), code: "validation" };
    const d = parsed.data;

    if (!(await storageFileExists(supabase, d.storage_path))) {
      return { ok: false, error: m.uploadFailed, code: "server" };
    }

    const { data, error } = await supabase
      .from("media")
      .insert({
        storage_path: d.storage_path,
        mime_type: d.mime_type,
        size_bytes: d.size_bytes,
        width: d.width,
        height: d.height,
        blur_data_url: d.blur_data_url,
        title: d.title,
        category_id: d.category_id,
      })
      .select("*")
      .single();

    if (error) {
      logError("media:register", error);
      if (!isUniqueViolation(error)) await removeStorageFiles(supabase, [d.storage_path]);
      return { ok: false, error: m.uploadFailed, code: "server" };
    }

    if (d.album_id) {
      const { error: albumError } = await supabase.rpc("add_media_to_album", {
        p_album_id: d.album_id,
        p_media_ids: [data.id],
      });
      if (albumError) logError("media:register:album", albumError);
    }

    revalidateSite();
    return { ok: true, data: data as Media };
  });
}

/** Removes a file that was uploaded but could not be registered. */
export async function discardUpload(path: string): Promise<ActionResult> {
  return withAdmin("media:discard", async ({ supabase }) => {
    if (typeof path !== "string") return { ok: false, error: m.uploadFailed, code: "validation" };
    // Only remove files that have no database row (i.e. truly orphaned).
    const { data } = await supabase.from("media").select("id").eq("storage_path", path).maybeSingle();
    if (!data) await removeStorageFiles(supabase, [path]);
    return { ok: true };
  });
}

export async function updateMedia(input: unknown): Promise<ActionResult> {
  return withAdmin("media:update", async ({ supabase }) => {
    const parsed = updateMediaSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: t.admin.common.saveFailed, fieldErrors: fieldErrors(parsed.error), code: "validation" };
    const d = parsed.data;

    const { error } = await supabase
      .from("media")
      .update({
        title: d.title,
        alt_text: d.alt_text,
        category_id: d.category_id,
        featured: d.featured,
        published: d.published,
      })
      .eq("id", d.id);
    if (error) {
      logError("media:update", error);
      return { ok: false, error: t.admin.common.saveFailed, code: "server" };
    }

    // Sync album membership
    const { data: links, error: linkError } = await supabase.from("album_media").select("album_id").eq("media_id", d.id);
    if (linkError) {
      logError("media:update:links", linkError);
      return { ok: false, error: t.admin.common.saveFailed, code: "server" };
    }
    const current = new Set((links ?? []).map((l) => l.album_id as string));
    const wanted = new Set(d.album_ids);
    const toRemove = [...current].filter((id) => !wanted.has(id));
    const toAdd = [...wanted].filter((id) => !current.has(id));

    if (toRemove.length > 0) {
      const { error: delError } = await supabase.from("album_media").delete().eq("media_id", d.id).in("album_id", toRemove);
      if (delError) {
        logError("media:update:remove-links", delError);
        return { ok: false, error: t.admin.common.saveFailed, code: "server" };
      }
      // A photo removed from an album can no longer be that album's cover.
      await supabase.from("albums").update({ cover_media_id: null }).eq("cover_media_id", d.id).in("id", toRemove);
    }
    for (const albumId of toAdd) {
      const { error: addError } = await supabase.rpc("add_media_to_album", { p_album_id: albumId, p_media_ids: [d.id] });
      if (addError) {
        logError("media:update:add-link", addError);
        return { ok: false, error: t.admin.common.saveFailed, code: "server" };
      }
    }

    revalidateSite();
    return { ok: true, message: t.admin.common.saved };
  });
}

const bulkUpdateSchema = bulkMediaSchema.extend({
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  category_id: optionalUuid.optional(),
  set_category: z.boolean().optional(),
});

export async function bulkUpdateMedia(input: unknown): Promise<ActionResult> {
  return withAdmin("media:bulk-update", async ({ supabase }) => {
    const parsed = bulkUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: t.admin.common.saveFailed, code: "validation" };
    const d = parsed.data;
    const patch: Record<string, unknown> = {};
    if (typeof d.featured === "boolean") patch.featured = d.featured;
    if (typeof d.published === "boolean") patch.published = d.published;
    if (d.set_category) patch.category_id = d.category_id ?? null;
    if (Object.keys(patch).length === 0) return { ok: false, error: t.admin.common.noChange, code: "validation" };

    const { error } = await supabase.from("media").update(patch).in("id", d.ids);
    if (error) {
      logError("media:bulk-update", error);
      return { ok: false, error: t.admin.common.saveFailed, code: "server" };
    }
    revalidateSite();
    return { ok: true, message: t.admin.common.saved };
  });
}

export async function deleteMedia(input: unknown): Promise<ActionResult> {
  return withAdmin("media:delete", async ({ supabase }) => {
    const parsed = bulkMediaSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: t.admin.common.deleteFailed, code: "validation" };

    const { data: rows, error: readError } = await supabase.from("media").select("id, storage_path").in("id", parsed.data.ids);
    if (readError) {
      logError("media:delete:read", readError);
      return { ok: false, error: t.admin.common.deleteFailed, code: "server" };
    }

    // Database first (cascades album links, clears covers); then the files.
    const { error } = await supabase.from("media").delete().in("id", parsed.data.ids);
    if (error) {
      logError("media:delete", error);
      return { ok: false, error: t.admin.common.deleteFailed, code: "server" };
    }
    await removeStorageFiles(supabase, (rows ?? []).map((r) => r.storage_path as string));

    revalidateSite();
    return { ok: true, message: parsed.data.ids.length === 1 ? m.deletedOne : t.admin.common.deleted };
  });
}

export async function addMediaToAlbum(albumId: string, mediaIds: string[]): Promise<ActionResult> {
  return withAdmin("media:add-to-album", async ({ supabase }) => {
    const parsed = z.object({ albumId: optionalUuid, mediaIds: bulkMediaSchema.shape.ids }).safeParse({ albumId, mediaIds });
    if (!parsed.success || !parsed.data.albumId) return { ok: false, error: t.admin.common.saveFailed, code: "validation" };
    const { error } = await supabase.rpc("add_media_to_album", { p_album_id: parsed.data.albumId, p_media_ids: parsed.data.mediaIds });
    if (error) {
      logError("media:add-to-album", error);
      return { ok: false, error: t.admin.common.saveFailed, code: "server" };
    }
    revalidateSite();
    return { ok: true, message: t.admin.common.saved };
  });
}

/** Saves a new order for categories, photos, albums, services or packages. */
export async function reorderItems(input: unknown): Promise<ActionResult> {
  return withAdmin("reorder", async ({ supabase }) => {
    const parsed = reorderSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: t.admin.common.saveFailed, code: "validation" };
    const { error } = await supabase.rpc("reorder_items", { p_table: parsed.data.table, p_ids: parsed.data.ids });
    if (error) {
      logError("reorder", error, { table: parsed.data.table });
      return { ok: false, error: t.admin.common.saveFailed, code: "server" };
    }
    revalidateSite();
    return { ok: true, message: t.admin.common.orderSaved };
  });
}
