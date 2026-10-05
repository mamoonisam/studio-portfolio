/**
 * YouTube helpers. Only the 11-character video id is stored; everything else
 * (thumbnail, player) is built from it.
 */

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export interface ParsedYouTube {
  id: string;
  /** True for /shorts/ links (vertical 9:16 videos). */
  short: boolean;
}

/**
 * Accepts every common link form and returns the video id, or null:
 *   https://www.youtube.com/watch?v=ID   https://youtu.be/ID
 *   https://youtube.com/shorts/ID        https://www.youtube.com/live/ID
 *   https://www.youtube.com/embed/ID     https://m.youtube.com/watch?v=ID
 *   a bare 11-character id
 */
export function parseYouTube(input: string): ParsedYouTube | null {
  const value = input.trim();
  if (!value) return null;
  if (ID_RE.test(value)) return { id: value, short: false };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.|music\.)/, "");
  const parts = url.pathname.split("/").filter(Boolean);

  let id: string | null = null;
  let short = false;
  if (host === "youtu.be") {
    id = parts[0] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parts[0] === "watch") id = url.searchParams.get("v");
    else if (parts[0] === "shorts") {
      id = parts[1] ?? null;
      short = true;
    } else if (parts[0] === "embed" || parts[0] === "live" || parts[0] === "v") id = parts[1] ?? null;
  }

  return id && ID_RE.test(id) ? { id, short } : null;
}

export function isYouTubeId(id: string): boolean {
  return ID_RE.test(id);
}

/** Thumbnail served by YouTube's image CDN (always available for public/unlisted videos). */
export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Privacy-friendly player URL (no tracking cookies until the visitor presses play). */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
