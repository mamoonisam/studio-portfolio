"use client";

import Image from "next/image";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import { youtubeEmbedUrl, youtubeThumbnail } from "@/lib/utils/youtube";
import type { Video } from "@/types/content";

/**
 * Shows the YouTube thumbnail first and loads the real player only when the
 * visitor presses play. Pages stay fast (no YouTube scripts until needed) and
 * no YouTube cookies are set before playing.
 */
export function VideoCard({ video, sizes }: { video: Pick<Video, "title" | "youtube_id" | "vertical">; sizes?: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="min-w-0">
      <div
        className={cn(
          "relative overflow-hidden rounded-[var(--radius)] bg-[#111]",
          video.vertical ? "mx-auto aspect-[9/16] max-h-[80svh]" : "aspect-video",
        )}
      >
        {playing ? (
          <iframe
            src={youtubeEmbedUrl(video.youtube_id)}
            title={video.title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full cursor-pointer"
            aria-label={t.videos.play(video.title)}
          >
            <Image
              src={youtubeThumbnail(video.youtube_id)}
              alt=""
              fill
              sizes={sizes ?? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" aria-hidden="true" />
            <span
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#111] shadow-lg transition-transform group-hover:scale-110"
              aria-hidden="true"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="ms-1">
                <path d="M8 5.5v13a1 1 0 001.5.86l10.5-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-3 text-[0.95rem] font-medium">{video.title}</figcaption>
    </figure>
  );
}

export function VideoGrid({ videos }: { videos: Pick<Video, "id" | "title" | "youtube_id" | "vertical">[] }) {
  const wide = videos.filter((v) => !v.vertical);
  const tall = videos.filter((v) => v.vertical);
  return (
    <div className="grid gap-12">
      {wide.length > 0 && (
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {wide.map((v) => (
            <li key={v.id}>
              <VideoCard video={v} />
            </li>
          ))}
        </ul>
      )}
      {tall.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {tall.map((v) => (
            <li key={v.id}>
              <VideoCard video={v} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
