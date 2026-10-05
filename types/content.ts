/** Row shapes matching supabase/migrations. Keep in sync with the SQL. */

export type Theme = "light" | "dark" | "system";
export type Accent = "brass" | "sage" | "slate" | "rose";

export interface SiteSettings {
  photographer_name: string;
  studio_name: string;
  logo_path: string | null;
  favicon_path: string | null;
  hero_image_path: string | null;
  hero_title: string;
  hero_subtitle: string;
  hero_primary_label: string;
  hero_secondary_label: string;
  about_image_path: string | null;
  about_title: string;
  about_short: string;
  about_text: string;
  about_story: string;
  about_extra: string;
  years_experience: number | null;
  featured_title: string;
  featured_intro: string;
  services_title: string;
  services_intro: string;
  packages_title: string;
  packages_intro: string;
  portfolio_intro: string;
  cta_title: string;
  cta_text: string;
  cta_button_label: string;
  booking_intro: string;
  booking_success: string;
  contact_intro: string;
  footer_note: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  map_url: string;
  working_hours: string;
  phone_country_code: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  youtube_url: string;
  seo_title: string;
  seo_description: string;
  og_image_path: string | null;
  theme: Theme;
  accent: Accent;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  storage_path: string;
  title: string | null;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  mime_type: string | null;
  blur_data_url: string | null;
  category_id: string | null;
  featured: boolean;
  published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type AlbumStatus = "draft" | "published";

export interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  cover_media_id: string | null;
  status: AlbumStatus;
  display_order: number;
  event_date: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlbumWithCover extends Album {
  cover: Media | null;
  photo_count: number;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  features: string[];
  cover_image_path: string | null;
  featured: boolean;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const BOOKING_STATUSES = ["new", "contacted", "confirmed", "completed", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface Booking {
  id: string;
  customer_name: string;
  phone: string;
  service_id: string | null;
  service_title: string | null;
  package_id: string | null;
  package_title: string | null;
  package_price: string | null;
  requested_date: string;
  preferred_time: string | null;
  location: string | null;
  notes: string | null;
  status: BookingStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; code?: "unauthorized" | "validation" | "server" };
