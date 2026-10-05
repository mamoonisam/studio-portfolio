import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { requireAdminPage } from "@/lib/auth";
import { listCategories } from "@/lib/data/admin";

export default async function CategoriesPage() {
  const { supabase } = await requireAdminPage();
  const categories = await listCategories(supabase);
  return <CategoriesManager categories={categories} />;
}
