import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET, isValidStoragePath } from "@/lib/config/media";
import { logError } from "@/lib/utils/log";

/** Confirms a file really exists in Storage before we save its row. */
export async function storageFileExists(supabase: SupabaseClient, path: string): Promise<boolean> {
  const slash = path.lastIndexOf("/");
  const folder = path.slice(0, slash);
  const name = path.slice(slash + 1);
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list(folder, { search: name, limit: 5 });
  if (error) {
    logError("storage:exists", error, { path });
    return false;
  }
  return (data ?? []).some((f) => f.name === name);
}

/**
 * Removes files through the Storage API (never by editing storage tables).
 * Failures are logged, not thrown: a leftover file is harmless, while failing
 * the whole action after the database change would confuse the admin.
 */
export async function removeStorageFiles(supabase: SupabaseClient, paths: Array<string | null | undefined>): Promise<void> {
  const valid = paths.filter((p): p is string => typeof p === "string" && isValidStoragePath(p));
  if (valid.length === 0) return;
  for (let i = 0; i < valid.length; i += 100) {
    const chunk = valid.slice(i, i + 100);
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(chunk);
    if (error) logError("storage:remove", error, { count: chunk.length });
  }
}

/** Old image paths that were replaced or cleared in an update. */
export function replacedPaths(
  before: object | null,
  after: object,
  keys: string[],
): string[] {
  if (!before) return [];
  const prev = before as Record<string, unknown>;
  const next = after as Record<string, unknown>;
  const out: string[] = [];
  for (const key of keys) {
    if (!(key in next)) continue;
    const oldValue = prev[key];
    const newValue = next[key];
    if (typeof oldValue === "string" && oldValue && oldValue !== newValue) out.push(oldValue);
  }
  return out;
}
