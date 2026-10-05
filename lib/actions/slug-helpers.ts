import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { nextFreeSlug, slugify } from "@/lib/utils/slug";

type SlugTable = "albums" | "services" | "categories";

/**
 * Returns a slug that no other row in `table` uses. The database's UNIQUE
 * constraint is the final guard; callers retry once on a unique violation.
 */
export async function uniqueSlug(
  supabase: SupabaseClient,
  table: SlugTable,
  source: string,
  excludeId?: string | null,
): Promise<string> {
  const base = slugify(source);
  let query = supabase.from(table).select("slug").like("slug", `${base}%`).limit(1000);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) throw error;
  return nextFreeSlug(base, (data ?? []).map((r) => r.slug as string));
}
