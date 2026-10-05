import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { t } from "@/lib/i18n";
import { formatDate } from "@/lib/utils/format";
import type { AlbumWithCover } from "@/types/content";

export function AlbumCard({ album, priority }: { album: AlbumWithCover; priority?: boolean }) {
  return (
    <Link href={`/portfolio/${encodeURIComponent(album.slug)}`} className="photo-link group block">
      <span className="photo-frame block aspect-[4/5] rounded-[var(--radius)]">
        <Photo
          path={album.cover?.storage_path}
          alt={album.cover?.alt_text || album.title}
          fill
          blurDataURL={album.cover?.blur_data_url}
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </span>
      <span className="mt-4 block">
        <span className="block font-display text-[1.6rem] leading-tight transition-colors group-hover:text-accent">{album.title}</span>
        <span className="mt-1 block text-sm text-muted">
          {t.portfolio.photoCount(album.photo_count)}
          {album.event_date ? ` · ${formatDate(album.event_date)}` : ""}
        </span>
      </span>
    </Link>
  );
}
