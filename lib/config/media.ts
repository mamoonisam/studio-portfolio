/**
 * Upload limits. Change them here AND in supabase/migrations/..._storage.sql
 * (bucket file_size_limit / allowed_mime_types) so both sides agree.
 */
export const MEDIA_BUCKET = "media";

export const MAX_UPLOAD_MB = 15;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** Photos larger than this (longest side, px) are scaled down before upload when optimisation is on. */
export const MAX_IMAGE_DIMENSION = 3200;
/** Re-encode files bigger than this even when their dimensions are fine. */
export const OPTIMIZE_ABOVE_BYTES = 6 * 1024 * 1024;
export const OPTIMIZE_QUALITY = 0.9;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const EXTENSION_BY_TYPE: Record<AllowedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const UPLOAD_CONCURRENCY = 3;

export type StorageFolder = "portfolio" | "site" | "services" | "packages";

/** Accepts only paths this app creates: <folder>/<yyyy>/<mm>/<uuid>.<ext> */
export const STORAGE_PATH_RE =
  /^(portfolio|site|services|packages)\/\d{4}\/\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/;

export function isAllowedType(type: string): type is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

export function isValidStoragePath(path: string, folder?: StorageFolder): boolean {
  if (!STORAGE_PATH_RE.test(path)) return false;
  return folder ? path.startsWith(`${folder}/`) : true;
}
