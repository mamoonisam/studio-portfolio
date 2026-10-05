import type { MetadataRoute } from "next";
import { getPublishedAlbums } from "@/lib/data/public";
import { publicEnv } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl;
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/portfolio`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/videos`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/packages`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/booking`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
  ];

  let albums: Awaited<ReturnType<typeof getPublishedAlbums>> = [];
  try {
    albums = await getPublishedAlbums();
  } catch {
    albums = [];
  }

  return [
    ...pages,
    ...albums.map((a) => ({
      url: `${base}/portfolio/${encodeURIComponent(a.slug)}`,
      lastModified: new Date(a.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
