import { AlbumsList } from "@/components/admin/AlbumsList";
import { requireAdminPage } from "@/lib/auth";
import { listAlbums } from "@/lib/data/admin";

export default async function AlbumsAdminPage() {
  const { supabase } = await requireAdminPage();
  return <AlbumsList albums={await listAlbums(supabase)} />;
}
