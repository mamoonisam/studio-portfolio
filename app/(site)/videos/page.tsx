import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { VideoGrid } from "@/components/site/VideoCard";
import { getVideos } from "@/lib/data/public";
import { t } from "@/lib/i18n";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: t.videos.title,
  description: t.videos.intro,
  alternates: { canonical: "/videos" },
};

export default async function VideosPage() {
  const videos = await getVideos();

  return (
    <>
      <PageHeader title={t.videos.title} intro={t.videos.intro} />
      <div className="container-x pb-24">
        {videos.length > 0 ? (
          <VideoGrid videos={videos} />
        ) : (
          <div className="rounded-[var(--radius)] border border-dashed border-line px-6 py-16 text-center">
            <p className="text-muted">{t.videos.empty}</p>
            <div className="mt-6 flex justify-center">
              <Link href="/portfolio" className="btn btn-outline">{t.home.viewAll}</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
