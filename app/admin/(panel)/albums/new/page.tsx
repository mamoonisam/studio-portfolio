import { AlbumEditor } from "@/components/admin/AlbumEditor";
import { requireAdminPage } from "@/lib/auth";
import { listCategoryOptions } from "@/lib/data/admin";

export default async function NewAlbumPage() {
  const { supabase } = await requireAdminPage();
  const categories = await listCategoryOptions(supabase);
  return <AlbumEditor album={null} media={[]} categories={categories} library={[]} />;
}
