import { publicEnv } from "@/lib/env";
import { MEDIA_BUCKET } from "@/lib/config/media";

/** Public URL of a file in the media bucket (or null when there is no file). */
export function storageUrl(path: string | null | undefined): string | null {
  if (!path || !publicEnv.supabaseUrl) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${encoded}`;
}
