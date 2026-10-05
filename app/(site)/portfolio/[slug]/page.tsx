import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowForward } from "@/components/icons";
import { PhotoGrid } from "@/components/site/PhotoGrid";
import { getAlbumBySlug, getSettings } from "@/lib/data/public";
import { siteName } from "@/lib/data/defaults";
import { t } from "@/lib/i18n";
import { formatDate } from "@/lib/utils/format";
import { toGridPhoto } from "@/lib/utils/media";
import { decodeSlug } from "@/lib/utils/slug";
import { storageUrl } from "@/lib/utils/storage";

export const revalidate = 3600;

// Albums are rendered on first visit and then cached; admin changes refresh them.
export function generateStaticParams(): { slug: string }[] {
  return [];
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const slug = decodeSlug((await params).slug);
  const result = await getAlbumBySlug(slug);
  if (!result) return { title: t.errors.notFoundTitle, robots: { index: false } };
  const { album, media } = result;
  const cover = media.find((m) => m.id === album.cover_media_id) ?? media[0];
  const image = storageUrl(cover?.storage_path);
  return {
    title: album.title,
    description: album.description?.slice(0, 160) || undefined,
    alternates: { canonical: `/portfolio/${encodeURIComponent(album.slug)}` },
    openGraph: { title: album.title, description: album.description?.slice(0, 160) || undefined, images: image ? [{ url: image }] : undefined },
  };
}

export default async function AlbumPage({ params }: Params) {
  const slug = decodeSlug((await params).slug);
  const [result, s] = await Promise.all([getAlbumBySlug(slug), getSettings()]);
  if (!result) notFound();
  const { album, media } = result;
  const fallbackAlt = album.title || siteName(s);

  return (
    <article>
      <header className="container-x pb-10 pt-[calc(var(--header-h)+3rem)] md:pb-14 md:pt-[calc(var(--header-h)+4.5rem)]">
        <Link href="/portfolio" className="group mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowForward size={16} className="rotate-180 transition-transform group-hover:translate-x-1" />
          {t.portfolio.backToPortfolio}
        </Link>
        <h1 className="display-2 fade-up">{album.title}</h1>
        <p className="mt-3 text-sm text-muted">
          {t.portfolio.photoCount(media.length)}
          {album.event_date ? ` · ${formatDate(album.event_date)}` : ""}
        </p>
        {album.description && <p className="lead mt-5 whitespace-pre-line">{album.description}</p>}
      </header>
      <div className="container-x pb-20">
        {media.length > 0 ? (
          <PhotoGrid photos={media.map((m) => toGridPhoto(m, fallbackAlt))} eager={3} />
        ) : (
          <p className="rounded-[var(--radius)] border border-dashed border-line px-6 py-16 text-center text-muted">{t.portfolio.albumEmpty}</p>
        )}
      </div>
    </article>
  );
}
