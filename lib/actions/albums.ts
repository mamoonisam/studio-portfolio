"use server";

import { withAdmin } from "@/lib/auth";
import { revalidateSite } from "@/lib/actions/revalidate";
import { newDisplayOrder } from "@/lib/actions/order-helpers";
import { uniqueSlug } from "@/lib/actions/slug-helpers";
import { albumMediaSchema, albumSchema } from "@/lib/validation/admin";
import { fieldErrors, uuid } from "@/lib/validation/common";
import { isUniqueViolation, logError } from "@/lib/utils/log";
import { t } from "@/lib/i18n";
import type { ActionResult, Album } from "@/types/content";

const c = t.admin.common;

export async function saveAlbum(input: unknown): Promise<ActionResult<Album>> {
  return withAdmin("albums:save", async ({ supabase }) => {
    const parsed = albumSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: c.saveFailed, fieldErrors: fieldErrors(parsed.error), code: "validation" };
    const d = parsed.data;

    let before: Album | null = null;
    if (d.id) {
      const { data, error } = await supabase.from("albums").select("*").eq("id", d.id).maybeSingle();
      if (error) throw error;
      if (!data) return { ok: false, error: c.loadFailed, code: "validation" };
      before = data as Album;
    }

    // The cover must be one of the album's photos.
    let cover = d.cover_media_id;
    if (cover && d.id) {
      const { data: link } = await supabase
        .from("album_media")
        .select("media_id")
        .eq("album_id", d.id)
        .eq("media_id", cover)
        .maybeSingle();
      if (!link) cover = null;
    } else if (!d.id) {
      cover = null;
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      // Keep the existing link stable unless the admin typed a new one.
      const slugSource = d.slug || (before ? before.slug : d.title);
      const slug = await uniqueSlug(supabase, "albums", slugSource, d.id);
      const row = {
        title: d.title,
        slug,
        description: d.description,
        category_id: d.category_id,
        cover_media_id: cover,
        status: d.status,
        event_date: d.event_date,
      };

      const result = d.id
        ? await supabase.from("albums").update(row).eq("id", d.id).select("*").single()
        : await supabase
            .from("albums")
            .insert({ ...row, display_order: await newDisplayOrder(supabase, "albums", "start") })
            .select("*")
            .single();

      if (!result.error) {
        revalidateSite();
        return { ok: true, data: result.data as Album, message: d.id ? c.saved : t.admin.albums.created };
      }
      if (!isUniqueViolation(result.error)) {
        logError("albums:save", result.error);
        return { ok: false, error: c.saveFailed, code: "server" };
      }
      if (d.slug) {
        return { ok: false, error: c.saveFailed, fieldErrors: { slug: "هذا الرابط مستخدم لألبوم آخر." }, code: "validation" };
      }
    }
    return { ok: false, error: c.saveFailed, code: "server" };
  });
}

/** Replaces the album's photos with this ordered list (add, remove, reorder in one step). */
export async function setAlbumMedia(input: unknown): Promise<ActionResult> {
  return withAdmin("albums:media", async ({ supabase }) => {
    const parsed = albumMediaSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: c.saveFailed, code: "validation" };
    const { error } = await supabase.rpc("set_album_media", {
      p_album_id: parsed.data.album_id,
      p_media_ids: parsed.data.media_ids,
    });
    if (error) {
      logError("albums:media", error);
      return { ok: false, error: c.saveFailed, code: "server" };
    }
    revalidateSite();
    return { ok: true, message: t.admin.albums.photosSaved };
  });
}

export async function setAlbumCover(albumId: string, mediaId: string | null): Promise<ActionResult> {
  return withAdmin("albums:cover", async ({ supabase }) => {
    if (!uuid.safeParse(albumId).success || (mediaId !== null && !uuid.safeParse(mediaId).success)) {
      return { ok: false, error: c.saveFailed, code: "validation" };
    }
    if (mediaId) {
      const { data: link } = await supabase
        .from("album_media")
        .select("media_id")
        .eq("album_id", albumId)
        .eq("media_id", mediaId)
        .maybeSingle();
      if (!link) return { ok: false, error: c.saveFailed, code: "validation" };
    }
    const { error } = await supabase.from("albums").update({ cover_media_id: mediaId }).eq("id", albumId);
    if (error) {
      logError("albums:cover", error);
      return { ok: false, error: c.saveFailed, code: "server" };
    }
    revalidateSite();
    return { ok: true, message: c.saved };
  });
}

export async function deleteAlbum(id: string): Promise<ActionResult> {
  return withAdmin("albums:delete", async ({ supabase }) => {
    if (!uuid.safeParse(id).success) return { ok: false, error: c.deleteFailed, code: "validation" };
    // Photos stay in the library; only the album and its links are removed.
    const { error } = await supabase.from("albums").delete().eq("id", id);
    if (error) {
      logError("albums:delete", error);
      return { ok: false, error: c.deleteFailed, code: "server" };
    }
    revalidateSite();
    return { ok: true, message: c.deleted };
  });
}
