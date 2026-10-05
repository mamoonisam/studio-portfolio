"use client";

import { useState } from "react";
import { Photo } from "@/components/ui/Photo";
import { Lightbox, type LightboxItem } from "@/components/site/Lightbox";

export interface GridPhoto extends LightboxItem {
  width: number | null;
  height: number | null;
}

interface Props {
  photos: GridPhoto[];
  /** First N photos load eagerly (above the fold). */
  eager?: number;
  layout?: "masonry" | "grid";
}

/** Masonry (or even grid) of photos that open in the lightbox. */
export function PhotoGrid({ photos, eager = 0, layout = "masonry" }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <ul className={layout === "masonry" ? "masonry" : "grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:gap-4"}>
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="photo-link block w-full cursor-zoom-in text-start"
              aria-label={p.alt || p.title || `${i + 1}`}
            >
              {layout === "masonry" && p.width && p.height ? (
                <span className="photo-frame block" style={{ aspectRatio: `${p.width} / ${p.height}` }}>
                  <Photo
                    path={p.path}
                    alt={p.alt}
                    width={p.width}
                    height={p.height}
                    blurDataURL={p.blur}
                    priority={i < eager}
                    sizes="(min-width: 1024px) 33vw, (min-width: 560px) 50vw, 100vw"
                  />
                </span>
              ) : (
                <span className={`photo-frame block ${layout === "grid" ? "aspect-square" : "aspect-[4/5]"}`}>
                  <Photo
                    path={p.path}
                    alt={p.alt}
                    fill
                    blurDataURL={p.blur}
                    priority={i < eager}
                    sizes="(min-width: 1024px) 33vw, 50vw"
                  />
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {open !== null && photos[open] && (
        <Lightbox items={photos} index={open} onIndexChange={setOpen} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
