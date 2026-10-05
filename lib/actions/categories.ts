"use server";

import { withAdmin } from "@/lib/auth";
import { revalidateSite } from "@/lib/actions/revalidate";
import { uniqueSlug } from "@/lib/actions/slug-helpers";
import { newDisplayOrder } from "@/lib/actions/order-helpers";
import { categorySchema } from "@/lib/validation/admin";
import { fieldErrors, uuid } from "@/lib/validation/common";
import { isUniqueViolation, logError } from "@/lib/utils/log";
import { t } from "@/lib/i18n";
import type { ActionResult, Category } from "@/types/content";

const c = t.admin.common;

export async function saveCategory(input: unknown): Promise<ActionResult<Category>> {
  return withAdmin("categories:save", async ({ supabase }) => {
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: c.saveFailed, fieldErrors: fieldErrors(parsed.error), code: "validation" };
    const d = parsed.data;

    for (let attempt = 0; attempt < 2; attempt++) {
      const slug = await uniqueSlug(supabase, "categories", d.name, d.id);
      const row = { name: d.name, description: d.description, slug };
      const result = d.id
        ? await supabase.from("categories").update(row).eq("id", d.id).select("*").single()
        : await supabase
            .from("categories")
            .insert({ ...row, display_order: await newDisplayOrder(supabase, "categories") })
            .select("*")
            .single();

      if (!result.error) {
        revalidateSite();
        return { ok: true, data: result.data as Category, message: d.id ? c.saved : t.admin.categories.created };
      }
      if (!isUniqueViolation(result.error)) {
        logError("categories:save", result.error);
        return { ok: false, error: c.saveFailed, code: "server" };
      }
    }
    return { ok: false, error: c.saveFailed, code: "server" };
  });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return withAdmin("categories:delete", async ({ supabase }) => {
    const parsed = uuid.safeParse(id);
    if (!parsed.success) return { ok: false, error: c.deleteFailed, code: "validation" };
    // Photos and albums keep existing; their category becomes empty (ON DELETE SET NULL).
    const { error } = await supabase.from("categories").delete().eq("id", parsed.data);
    if (error) {
      logError("categories:delete", error);
      return { ok: false, error: c.deleteFailed, code: "server" };
    }
    revalidateSite();
    return { ok: true, message: c.deleted };
  });
}
