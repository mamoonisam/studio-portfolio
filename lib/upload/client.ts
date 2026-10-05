"use client";

import {
  EXTENSION_BY_TYPE,
  MAX_IMAGE_DIMENSION,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
  MEDIA_BUCKET,
  OPTIMIZE_ABOVE_BYTES,
  OPTIMIZE_QUALITY,
  isAllowedType,
  type AllowedImageType,
  type StorageFolder,
} from "@/lib/config/media";
import { requirePublicEnv } from "@/lib/env";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { t } from "@/lib/i18n";

const m = t.admin.media;

export class UploadError extends Error {
  constructor(message: string, public readonly retryable = true) {
    super(message);
    this.name = "UploadError";
  }
}

/** Detects the real image type from the file's first bytes (not its name). */
export async function sniffImageType(file: Blob): Promise<AllowedImageType | "heic" | null> {
  const head = new Uint8Array(await file.slice(0, 48).arrayBuffer());
  const ascii = (from: number, to: number) => String.fromCharCode(...head.slice(from, to));
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  if (head[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    const compatible = ascii(16, 48);
    if (brand === "avif" || brand === "avis" || compatible.includes("avif")) return "image/avif";
    if (["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"].includes(brand)) return "heic";
  }
  return null;
}

export interface PreparedImage {
  blob: Blob;
  type: AllowedImageType;
  width: number | null;
  height: number | null;
  blurDataURL: string | null;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

/**
 * Validates a picked file and (optionally) scales down very large photos so
 * the website stays fast. Also makes a tiny blurred preview for placeholders.
 * Runs entirely in the browser.
 */
export async function prepareImage(file: File, optimize: boolean): Promise<PreparedImage> {
  const sniffed = await sniffImageType(file);
  if (sniffed === "heic") throw new UploadError(m.wrongType, false);
  if (!sniffed || !isAllowedType(sniffed)) throw new UploadError(m.wrongType, false);

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    bitmap = null; // e.g. AVIF on an older browser: upload as-is if within limits
  }

  let blob: Blob = file;
  let type: AllowedImageType = sniffed;
  let width = bitmap?.width ?? null;
  let height = bitmap?.height ?? null;
  let blurDataURL: string | null = null;

  if (bitmap) {
    const longest = Math.max(bitmap.width, bitmap.height);
    const needsResize = optimize && longest > MAX_IMAGE_DIMENSION;
    const needsReencode = optimize && (file.size > OPTIMIZE_ABOVE_BYTES || needsResize);

    if (needsReencode) {
      const scale = needsResize ? MAX_IMAGE_DIMENSION / longest : 1;
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(bitmap, 0, 0, w, h);
        let out = await canvasToBlob(canvas, "image/webp", OPTIMIZE_QUALITY);
        if (!out || out.type !== "image/webp") out = await canvasToBlob(canvas, "image/jpeg", OPTIMIZE_QUALITY);
        if (out && isAllowedType(out.type) && out.size < file.size) {
          blob = out;
          type = out.type;
          width = w;
          height = h;
        }
      }
    }

    // Tiny blurred preview (about 16px wide) shown while the photo loads
    try {
      const pw = 16;
      const ph = Math.max(1, Math.round((bitmap.height / bitmap.width) * pw));
      const c = document.createElement("canvas");
      c.width = pw;
      c.height = ph;
      const cx = c.getContext("2d");
      if (cx) {
        cx.drawImage(bitmap, 0, 0, pw, ph);
        const url = c.toDataURL("image/webp", 0.6);
        blurDataURL = url.length <= 3500 ? url : null;
      }
    } catch {
      blurDataURL = null;
    }
    bitmap.close();
  }

  if (blob.size > MAX_UPLOAD_BYTES) throw new UploadError(m.tooBig(MAX_UPLOAD_MB), false);
  return { blob, type, width, height, blurDataURL };
}

/** <folder>/<yyyy>/<mm>/<uuid>.<ext> — unique, never based on the original file name. */
export function newStoragePath(folder: StorageFolder, type: AllowedImageType): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${folder}/${yyyy}/${mm}/${crypto.randomUUID()}.${EXTENSION_BY_TYPE[type]}`;
}

/**
 * Uploads through the Supabase Storage API with progress events. The signed-in
 * admin's token is sent; Storage RLS allows the upload for admins only.
 */
export async function uploadToStorage(
  path: string,
  blob: Blob,
  type: string,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const { url, key } = requirePublicEnv();
  const {
    data: { session },
  } = await getBrowserSupabase().auth.getSession();
  if (!session) throw new UploadError(t.admin.common.sessionExpired, false);

  const encoded = path.split("/").map(encodeURIComponent).join("/");
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${url}/storage/v1/object/${MEDIA_BUCKET}/${encoded}`);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", key);
    xhr.setRequestHeader("Content-Type", type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else if (xhr.status === 401 || xhr.status === 403) reject(new UploadError(t.admin.common.sessionExpired, false));
      else if (xhr.status === 413) reject(new UploadError(m.tooBig(MAX_UPLOAD_MB), false));
      else if (xhr.status === 415) reject(new UploadError(m.wrongType, false));
      else reject(new UploadError(m.uploadFailed));
    };
    xhr.onerror = () => reject(new UploadError(m.uploadFailed));
    xhr.ontimeout = () => reject(new UploadError(m.uploadFailed));
    xhr.onabort = () => reject(new UploadError(m.uploadFailed));
    if (signal) {
      if (signal.aborted) {
        reject(new UploadError(m.uploadFailed));
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(blob);
  });
}
