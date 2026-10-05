import type { Media } from "@/types/content";

/** Shapes a media row for the photo grid / lightbox, with a sensible alt text. */
export function toGridPhoto(m: Media, fallbackAlt: string) {
  return {
    id: m.id,
    path: m.storage_path,
    alt: (m.alt_text || m.title || fallbackAlt || "").trim(),
    title: m.title,
    blur: m.blur_data_url,
    width: m.width,
    height: m.height,
    category_id: m.category_id,
  };
}
