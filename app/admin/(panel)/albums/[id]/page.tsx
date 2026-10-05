import { notFound } from "next/navigation";
import { AlbumEditor } from "@/components/admin/AlbumEditor";
import { requireAdminPage } from "@/lib/auth";
import { getAlbumWithMedia, listCategoryOptions, listMedia } from "@/lib/data/admin";
import { isUuid } from "@/lib/utils/ids";

export default async function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase } = await requireAdminPage();
  const [result, categories, library] = await Promise.all([
    getAlbumWithMedia(supabase, id),
    listCategoryOptions(supabase),
    listMedia(supabase),
  ]);
  if (!result) notFound();

  return (
    <AlbumEditor
      key={result.album.updated_at}
      album={result.album}
      media={result.media}
      categories={categories}
      library={library.map(({ id: mediaId, storage_path, blur_data_url, title, category_id }) => ({ id: mediaId, storage_path, blur_data_url, title, category_id }))}
    />
  );
}
