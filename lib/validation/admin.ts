import { z } from "zod";
import { t } from "@/lib/i18n";
import { isValidStoragePath, isAllowedType, MAX_UPLOAD_BYTES } from "@/lib/config/media";
import { toAsciiDigits } from "@/lib/utils/format";
import { parseYouTube } from "@/lib/utils/youtube";
import { bool, optionalText, optionalUuid, requiredText, text, uuid } from "./common";

const c = t.admin.common;
const s = t.admin.settings;

const imagePath = (folder: "portfolio" | "site" | "services" | "packages") =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (typeof v === "string" && v.trim() ? v.trim() : null))
    .refine((v) => v === null || isValidStoragePath(v, folder), { message: "صورة غير صالحة." });

const slugInput = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (typeof v === "string" ? v.trim() : ""));

// ── Media ───────────────────────────────────────────────────────────────────
export const registerMediaSchema = z.object({
  storage_path: z.string().refine((p) => isValidStoragePath(p, "portfolio"), { message: "مسار غير صالح." }),
  mime_type: z.string().refine(isAllowedType, { message: t.admin.media.wrongType }),
  size_bytes: z.number().int().min(1).max(MAX_UPLOAD_BYTES),
  width: z.number().int().min(1).max(30000).nullable(),
  height: z.number().int().min(1).max(30000).nullable(),
  blur_data_url: z
    .string()
    .max(4000)
    .refine((v) => v.startsWith("data:image/"), { message: "invalid" })
    .nullable(),
  title: optionalText(200),
  category_id: optionalUuid,
  album_id: optionalUuid,
});

export const updateMediaSchema = z.object({
  id: uuid,
  title: optionalText(200),
  alt_text: optionalText(300),
  category_id: optionalUuid,
  featured: bool,
  published: bool,
  album_ids: z.array(uuid).max(200).default([]),
});

export const bulkMediaSchema = z.object({
  ids: z.array(uuid).min(1).max(500),
});

// ── Categories ──────────────────────────────────────────────────────────────
export const categorySchema = z.object({
  id: optionalUuid,
  name: requiredText(1, 80, c.required),
  description: optionalText(300),
});

// ── Services ────────────────────────────────────────────────────────────────
export const serviceSchema = z.object({
  id: optionalUuid,
  title: requiredText(1, 120, c.required),
  slug: slugInput,
  description: optionalText(1500),
  image_path: imagePath("services"),
  active: bool,
});

// ── Packages ────────────────────────────────────────────────────────────────
export const packageSchema = z.object({
  id: optionalUuid,
  title: requiredText(1, 120, c.required),
  description: optionalText(1500),
  price: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === null || v === undefined) return null;
      const raw = toAsciiDigits(String(v)).replace(/[,\s٬]/g, "").trim();
      return raw === "" ? null : raw;
    })
    .refine((v) => v === null || /^\d{1,12}(\.\d{1,2})?$/.test(v), { message: t.admin.packages.invalidPrice })
    .transform((v) => (v === null ? null : Number(v))),
  currency: text(12),
  features: z
    .array(z.string())
    .max(40)
    .transform((list) => list.map((f) => f.trim()).filter((f) => f.length > 0))
    .refine((list) => list.every((f) => f.length <= 200), { message: "أحد البنود أطول من المسموح." }),
  cover_image_path: imagePath("packages"),
  featured: bool,
  active: bool,
});

// ── Albums ──────────────────────────────────────────────────────────────────
export const albumSchema = z.object({
  id: optionalUuid,
  title: requiredText(1, 200, c.required),
  slug: slugInput,
  description: optionalText(3000),
  category_id: optionalUuid,
  cover_media_id: optionalUuid,
  status: z.enum(["draft", "published"]),
  event_date: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)),
});

export const albumMediaSchema = z.object({
  album_id: uuid,
  media_ids: z.array(uuid).max(2000),
});

// ── Ordering ────────────────────────────────────────────────────────────────
export const reorderSchema = z.object({
  table: z.enum(["categories", "media", "albums", "services", "packages", "videos"]),
  ids: z.array(uuid).min(1).max(2000),
});

// ── Bookings ────────────────────────────────────────────────────────────────
export const bookingStatusSchema = z.object({
  id: uuid,
  status: z.enum(["new", "contacted", "confirmed", "completed", "cancelled"]),
});

export const bookingNotesSchema = z.object({
  id: uuid,
  admin_notes: optionalText(5000),
});

// ── Settings ────────────────────────────────────────────────────────────────
const url = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (typeof v === "string" ? v.trim() : ""))
  .refine(
    (v) => {
      if (v === "") return true;
      try {
        const u = new URL(v);
        return u.protocol === "https:" || u.protocol === "http:";
      } catch {
        return false;
      }
    },
    { message: s.invalidUrl },
  );

const plain = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (typeof v === "string" ? v : ""))
    .pipe(text(max));

const digitsOnly = (v: string) => toAsciiDigits(v).replace(/[\s\-()]/g, "");

export const settingsSchema = z
  .object({
    photographer_name: plain(120),
    studio_name: plain(120),
    logo_path: imagePath("site"),
    favicon_path: imagePath("site"),
    hero_image_path: imagePath("site"),
    hero_title: plain(160),
    hero_subtitle: plain(400),
    hero_primary_label: plain(40),
    hero_secondary_label: plain(40),
    about_image_path: imagePath("site"),
    about_title: plain(120),
    about_short: plain(800),
    about_text: plain(5000),
    about_story: plain(5000),
    about_extra: plain(3000),
    years_experience: z
      .union([z.string(), z.number(), z.null(), z.undefined()])
      .transform((v) => {
        const raw = toAsciiDigits(String(v ?? "")).trim();
        return raw === "" ? null : Number(raw);
      })
      .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 80), { message: "اكتب رقمًا بين 0 و80." }),
    featured_title: plain(120),
    featured_intro: plain(400),
    services_title: plain(120),
    services_intro: plain(400),
    packages_title: plain(120),
    packages_intro: plain(400),
    portfolio_intro: plain(400),
    cta_title: plain(160),
    cta_text: plain(400),
    cta_button_label: plain(40),
    booking_intro: plain(600),
    booking_success: plain(400),
    contact_intro: plain(600),
    footer_note: plain(300),
    phone: plain(30).refine((v) => v === "" || /^\+?[0-9]{6,20}$/.test(digitsOnly(v)), { message: s.invalidPhone }),
    whatsapp: plain(30)
      .transform((v) => digitsOnly(v).replace(/^\+/, "").replace(/^00/, ""))
      .refine((v) => v === "" || /^[1-9][0-9]{7,14}$/.test(v), { message: s.invalidWhatsapp }),
    phone_country_code: plain(6)
      .transform((v) => digitsOnly(v).replace(/^\+/, "").replace(/^00/, ""))
      .refine((v) => /^[0-9]{0,4}$/.test(v), { message: "اكتب رمز الدولة أرقامًا فقط، مثل 964." }),
    email: plain(200).refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: s.invalidEmail }),
    address: plain(300),
    map_url: url,
    working_hours: plain(200),
    instagram_url: url,
    facebook_url: url,
    tiktok_url: url,
    youtube_url: url,
    seo_title: plain(120),
    seo_description: plain(300),
    og_image_path: imagePath("site"),
    theme: z.enum(["light", "dark", "system"]),
    accent: z.enum(["brass", "sage", "slate", "rose"]),
  })
  .partial();

export type SettingsInput = z.infer<typeof settingsSchema>;

// ── Videos (YouTube) ───────────────────────────────────────────────────────
export const videoSchema = z
  .object({
    id: optionalUuid,
    url: z.string().max(500),
    title: requiredText(1, 200, t.admin.videos.titleRequired),
    vertical: bool,
    featured: bool,
    published: bool,
  })
  .transform((d, ctx) => {
    const parsed = parseYouTube(d.url);
    if (!parsed) {
      ctx.addIssue({ code: "custom", path: ["url"], message: t.admin.videos.invalidUrl });
      return z.NEVER;
    }
    return { id: d.id, youtube_id: parsed.id, title: d.title, vertical: d.vertical, featured: d.featured, published: d.published };
  });

export const videoToggleSchema = z.object({
  id: uuid,
  field: z.enum(["featured", "published"]),
  value: z.boolean(),
});
