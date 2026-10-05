import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type OrderedTable = "categories" | "media" | "albums" | "services" | "packages";

/** display_order for a new row: at the end (default) or at the start of the list. */
export async function newDisplayOrder(
  supabase: SupabaseClient,
  table: OrderedTable,
  position: "end" | "start" = "end",
): Promise<number> {
  const { data, error } = await supabase
    .from(table)
    .select("display_order")
    .order("display_order", { ascending: position === "start" })
    .limit(1);
  if (error || !data || data.length === 0) return 0;
  const edge = Number(data[0].display_order) || 0;
  return position === "end" ? edge + 1 : edge - 1;
}
