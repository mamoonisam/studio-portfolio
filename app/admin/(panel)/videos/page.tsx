import { VideosManager } from "@/components/admin/VideosManager";
import { requireAdminPage } from "@/lib/auth";
import { listVideos } from "@/lib/data/admin";

export default async function AdminVideosPage() {
  const { supabase } = await requireAdminPage();
  const videos = await listVideos(supabase);
  return <VideosManager videos={videos} />;
}
