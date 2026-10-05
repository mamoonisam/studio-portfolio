"use client";

import { useMemo, useState } from "react";
import { AlbumCard } from "@/components/site/AlbumCard";
import { PhotoGrid, type GridPhoto } from "@/components/site/PhotoGrid";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import type { AlbumWithCover, Category } from "@/types/content";

interface Props {
  categories: Pick<Category, "id" | "name">[];
  albums: AlbumWithCover[];
  photos: (GridPhoto & { category_id: string | null })[];
}

/** Category filter + albums + photo masonry. Filtering happens instantly in the browser. */
export function PortfolioBrowser({ categories, albums, photos }: Props) {
  const [active, setActive] = useState<string | null>(null);

  // Only show categories that contain something.
  const usable = useMemo(
    () => categories.filter((c) => photos.some((p) => p.category_id === c.id) || albums.some((a) => a.category_id === c.id)),
    [categories, photos, albums],
  );

  const shownAlbums = active ? albums.filter((a) => a.category_id === active) : albums;
  const shownPhotos = active ? photos.filter((p) => p.category_id === active) : photos;
  const nothing = shownAlbums.length === 0 && shownPhotos.length === 0;

  return (
    <div className="container-x pb-20">
      {usable.length > 0 && (
        <div className="-mx-4 mb-10 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label={t.portfolio.filterLabel}>
          <ul className="flex w-max gap-2 md:w-auto md:flex-wrap">
            {[{ id: null as string | null, name: t.portfolio.all }, ...usable].map((c) => (
              <li key={c.id ?? "all"}>
                <button
                  type="button"
                  aria-pressed={active === c.id}
                  onClick={() => setActive(c.id)}
                  className={cn(
                    "btn btn-sm",
                    active === c.id ? "btn-primary" : "btn-outline text-muted",
                  )}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nothing && (
        <p className="rounded-[var(--radius)] border border-dashed border-line px-6 py-16 text-center text-muted">
          {photos.length === 0 && albums.length === 0 ? t.portfolio.empty : t.portfolio.emptyCategory}
        </p>
      )}

      {shownAlbums.length > 0 && (
        <section aria-labelledby="albums-heading" className="mb-16">
          <h2 id="albums-heading" className="display-3 mb-6">{t.portfolio.albums}</h2>
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {shownAlbums.map((a, i) => (
              <li key={a.id}>
                <AlbumCard album={a} priority={i < 3} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {shownPhotos.length > 0 && (
        <section aria-labelledby="photos-heading">
          {shownAlbums.length > 0 && <h2 id="photos-heading" className="display-3 mb-6">{t.portfolio.photos}</h2>}
          {shownAlbums.length === 0 && <h2 id="photos-heading" className="sr-only">{t.portfolio.photos}</h2>}
          <PhotoGrid key={active ?? "all"} photos={shownPhotos} eager={shownAlbums.length > 0 ? 0 : 3} />
        </section>
      )}
    </div>
  );
}
