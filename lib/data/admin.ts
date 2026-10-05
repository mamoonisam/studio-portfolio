import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { emptySettings } from "@/lib/data/defaults";
import { normalizePackage } from "@/lib/data/public";
import type {
  Album,
  AlbumWithCover,
  Booking,
  BookingStatus,
  Category,
  Media,
  Package,
  Service,
  SiteSettings,
  Video,
} from "@/types/content";

/**
 * Admin queries. They use the signed-in admin's client, so RLS still applies
 * (admins can see drafts, hidden items and bookings). Errors are thrown and
 * caught by the admin error boundary, which shows a friendly message.
 */

export interface MediaWithAlbums extends Media {
  album_ids: string[];
}

export async function getDashboardData(supabase: SupabaseClient) {
  const count = (table: string) => supabase.from(table).select("id", { count: "exact", head: true });
  const [media, albums, services, packages, newBookings, recent] = await Promise.all([
    count("media"),
    count("albums"),
    count("services"),
    count("packages"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase
      .from("bookings")
      .select("id, customer_name, phone, service_title, package_title, requested_date, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);
  for (const r of [media, albums, services, packages, newBookings, recent]) if (r.error) throw r.error;
  return {
    counts: {
      media: media.count ?? 0,
      albums: albums.count ?? 0,
      services: services.count ?? 0,
      packages: packages.count ?? 0,
      newBookings: newBookings.count ?? 0,
    },
    recent: (recent.data ?? []) as Pick<
      Booking,
      "id" | "customer_name" | "phone" | "service_title" | "package_title" | "requested_date" | "status" | "created_at"
    >[],
  };
}

export async function listMedia(supabase: SupabaseClient): Promise<MediaWithAlbums[]> {
  const { data, error } = await supabase
    .from("media")
    .select("*, album_media(album_id)")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw error;
  return ((data ?? []) as (Media & { album_media: { album_id: string }[] })[]).map(({ album_media, ...m }) => ({
    ...m,
    album_ids: (album_media ?? []).map((l) => l.album_id),
  }));
}

export async function listCategories(supabase: SupabaseClient): Promise<(Category & { photo_count: number; album_count: number })[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*, media(count), albums(count)")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as (Category & { media: { count: number }[]; albums: { count: number }[] })[]).map(
    ({ media, albums, ...c }) => ({ ...c, photo_count: media?.[0]?.count ?? 0, album_count: albums?.[0]?.count ?? 0 }),
  );
}

export async function listCategoryOptions(supabase: SupabaseClient): Promise<Pick<Category, "id" | "name">[]> {
  const { data, error } = await supabase.from("categories").select("id, name").order("display_order").order("created_at");
  if (error) throw error;
  return (data ?? []) as Pick<Category, "id" | "name">[];
}

export async function listAlbumOptions(supabase: SupabaseClient): Promise<Pick<Album, "id" | "title" | "status">[]> {
  const { data, error } = await supabase
    .from("albums")
    .select("id, title, status")
    .order("display_order")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Pick<Album, "id" | "title" | "status">[];
}

export async function listAlbums(supabase: SupabaseClient): Promise<AlbumWithCover[]> {
  const { data, error } = await supabase
    .from("albums")
    .select("*, cover:media!albums_cover_media_id_fkey(*), album_media(count)")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const albums = ((data ?? []) as (Album & { cover: Media | null; album_media: { count: number }[] })[]).map(
    ({ album_media, cover, ...a }) => ({ ...a, cover: cover ?? null, photo_count: album_media?.[0]?.count ?? 0 }),
  );

  const missing = albums.filter((a) => !a.cover && a.photo_count > 0).map((a) => a.id);
  if (missing.length > 0) {
    const { data: links } = await supabase
      .from("album_media")
      .select("album_id, position, media:media_id(*)")
      .in("album_id", missing)
      .order("position");
    const first = new Map<string, Media>();
    for (const l of (links ?? []) as unknown as { album_id: string; media: Media | null }[]) {
      if (l.media && !first.has(l.album_id)) first.set(l.album_id, l.media);
    }
    for (const a of albums) if (!a.cover) a.cover = first.get(a.id) ?? null;
  }
  return albums;
}

export async function getAlbumWithMedia(supabase: SupabaseClient, id: string): Promise<{ album: Album; media: Media[] } | null> {
  const { data: album, error } = await supabase.from("albums").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!album) return null;
  const { data: links, error: linkError } = await supabase
    .from("album_media")
    .select("position, media:media_id(*)")
    .eq("album_id", id)
    .order("position");
  if (linkError) throw linkError;
  const media = ((links ?? []) as unknown as { media: Media | null }[]).map((l) => l.media).filter((m): m is Media => Boolean(m));
  return { album: album as Album, media };
}

export async function listServices(supabase: SupabaseClient): Promise<Service[]> {
  const { data, error } = await supabase.from("services").select("*").order("display_order").order("created_at");
  if (error) throw error;
  return (data ?? []) as Service[];
}

export async function getService(supabase: SupabaseClient, id: string): Promise<Service | null> {
  const { data, error } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Service) ?? null;
}

export async function listPackages(supabase: SupabaseClient): Promise<Package[]> {
  const { data, error } = await supabase.from("packages").select("*").order("display_order").order("created_at");
  if (error) throw error;
  return ((data ?? []) as Package[]).map(normalizePackage);
}

export async function getPackage(supabase: SupabaseClient, id: string): Promise<Package | null> {
  const { data, error } = await supabase.from("packages").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? normalizePackage(data as Package) : null;
}

export async function listBookings(
  supabase: SupabaseClient,
  status: BookingStatus | null,
): Promise<{ bookings: Booking[]; countsByStatus: Record<string, number> }> {
  let query = supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(500);
  if (status) query = query.eq("status", status);
  const [{ data, error }, { data: all, error: countError }] = await Promise.all([
    query,
    supabase.from("bookings").select("status").limit(10000),
  ]);
  if (error) throw error;
  if (countError) throw countError;
  const countsByStatus: Record<string, number> = {};
  for (const row of (all ?? []) as { status: string }[]) countsByStatus[row.status] = (countsByStatus[row.status] ?? 0) + 1;
  return { bookings: (data ?? []) as Booking[], countsByStatus };
}

export async function getBooking(supabase: SupabaseClient, id: string): Promise<Booking | null> {
  const { data, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Booking) ?? null;
}

export async function getSettingsForAdmin(supabase: SupabaseClient): Promise<SiteSettings> {
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return { ...emptySettings, ...(data ?? {}) } as SiteSettings;
}

export async function listVideos(supabase: SupabaseClient): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Video[];
}
