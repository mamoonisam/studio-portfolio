import "server-only";

import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { getPublicSupabase } from "@/lib/supabase/public";
import { logError } from "@/lib/utils/log";
import { emptySettings } from "@/lib/data/defaults";
import type { Album, AlbumWithCover, Category, Media, Package, Service, SiteSettings } from "@/types/content";

/**
 * Public, read-only queries used by the website. They run with the anonymous
 * key, so RLS returns published content only.
 *
 * Failure policy: during `next build` (or before Supabase is configured) a
 * failed query falls back to empty content so the build still succeeds. At
 * runtime a failure throws, which shows the friendly error page and — for
 * cached pages — keeps serving the last good version instead of caching an
 * empty page.
 */
class ContentUnavailableError extends Error {
  constructor(scope: string) {
    super(`Content unavailable: ${scope}`);
    this.name = "ContentUnavailableError";
  }
}

const isBuildPhase = () => process.env.NEXT_PHASE === "phase-production-build";

function fail<T>(scope: string, error: unknown, fallback: T): T {
  logError(`public:${scope}`, error);
  if (isBuildPhase() || !isSupabaseConfigured()) return fallback;
  throw new ContentUnavailableError(scope);
}

const MEDIA_COLUMNS =
  "id, storage_path, title, alt_text, width, height, size_bytes, mime_type, blur_data_url, category_id, featured, published, display_order, created_at, updated_at";

export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured()) return emptySettings;
  try {
    const { data, error } = await getPublicSupabase().from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error) return fail("settings", error, emptySettings);
    return { ...emptySettings, ...(data ?? {}) } as SiteSettings;
  } catch (error) {
    return fail("settings", error, emptySettings);
  }
});

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await getPublicSupabase()
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return fail("categories", error, []);
    return (data ?? []) as Category[];
  } catch (error) {
    return fail("categories", error, []);
  }
});

export const getFeaturedMedia = cache(async (limit = 12): Promise<Media[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await getPublicSupabase()
      .from("media")
      .select(MEDIA_COLUMNS)
      .eq("featured", true)
      .eq("published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return fail("featured", error, []);
    return (data ?? []) as Media[];
  } catch (error) {
    return fail("featured", error, []);
  }
});

/** Every published photo for the portfolio grid (most recent first unless reordered). */
export const getPortfolioMedia = cache(async (): Promise<Media[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await getPublicSupabase()
      .from("media")
      .select(MEDIA_COLUMNS)
      .eq("published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) return fail("portfolio", error, []);
    return (data ?? []) as Media[];
  } catch (error) {
    return fail("portfolio", error, []);
  }
});

type AlbumRow = Album & { cover: Media | null; album_media: { count: number }[] };

export const getPublishedAlbums = cache(async (): Promise<AlbumWithCover[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getPublicSupabase();
    const { data, error } = await supabase
      .from("albums")
      .select(`*, cover:media!albums_cover_media_id_fkey(${MEDIA_COLUMNS}), album_media(count)`)
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return fail("albums", error, []);

    const rows = (data ?? []) as unknown as AlbumRow[];
    const albums: AlbumWithCover[] = rows.map(({ album_media, cover, ...album }) => ({
      ...album,
      cover: cover ?? null,
      photo_count: album_media?.[0]?.count ?? 0,
    }));

    // Albums without a chosen cover use their first photo.
    const missing = albums.filter((a) => !a.cover && a.photo_count > 0).map((a) => a.id);
    if (missing.length > 0) {
      const { data: links, error: linkError } = await supabase
        .from("album_media")
        .select(`album_id, position, media:media_id(${MEDIA_COLUMNS})`)
        .in("album_id", missing)
        .order("position", { ascending: true });
      if (!linkError && links) {
        const firstByAlbum = new Map<string, Media>();
        for (const link of links as unknown as { album_id: string; media: Media | null }[]) {
          if (link.media && !firstByAlbum.has(link.album_id)) firstByAlbum.set(link.album_id, link.media);
        }
        for (const album of albums) {
          if (!album.cover) album.cover = firstByAlbum.get(album.id) ?? null;
        }
      } else if (linkError) {
        logError("public:album-covers", linkError);
      }
    }
    return albums;
  } catch (error) {
    return fail("albums", error, []);
  }
});

export const getAlbumBySlug = cache(
  async (slug: string): Promise<{ album: Album; media: Media[] } | null> => {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = getPublicSupabase();
      const { data: album, error } = await supabase
        .from("albums")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) return fail("album", error, null);
      if (!album) return null;

      const { data: links, error: linkError } = await supabase
        .from("album_media")
        .select(`position, media:media_id(${MEDIA_COLUMNS})`)
        .eq("album_id", (album as Album).id)
        .order("position", { ascending: true });
      if (linkError) return fail("album-media", linkError, null);

      const media = ((links ?? []) as unknown as { media: Media | null }[])
        .map((l) => l.media)
        .filter((m): m is Media => Boolean(m));
      return { album: album as Album, media };
    } catch (error) {
      return fail("album", error, null);
    }
  },
);

export const getServices = cache(async (): Promise<Service[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await getPublicSupabase()
      .from("services")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return fail("services", error, []);
    return (data ?? []) as Service[];
  } catch (error) {
    return fail("services", error, []);
  }
});

export const getPackages = cache(async (): Promise<Package[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await getPublicSupabase()
      .from("packages")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return fail("packages", error, []);
    return ((data ?? []) as Package[]).map(normalizePackage);
  } catch (error) {
    return fail("packages", error, []);
  }
});

export function normalizePackage(p: Package): Package {
  return {
    ...p,
    price: p.price === null || p.price === undefined ? null : Number(p.price),
    features: Array.isArray(p.features) ? p.features.filter((f): f is string => typeof f === "string" && f.trim() !== "") : [],
  };
}
