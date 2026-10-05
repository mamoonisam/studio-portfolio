import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { requireAdminPage } from "@/lib/auth";
import { listAlbumOptions, listCategoryOptions, listMedia } from "@/lib/data/admin";

type Props = { searchParams: Promise<{ upload?: string }> };

export default async function MediaPage({ searchParams }: Props) {
  const { supabase } = await requireAdminPage();
  const [media, categories, albums, params] = await Promise.all([
    listMedia(supabase),
    listCategoryOptions(supabase),
    listAlbumOptions(supabase),
    searchParams,
  ]);
  return <MediaLibrary media={media} categories={categories} albums={albums} startWithUpload={params.upload === "1"} />;
}
