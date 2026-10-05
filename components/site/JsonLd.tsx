import { publicEnv } from "@/lib/env";
import { siteName } from "@/lib/data/defaults";
import { safeUrl } from "@/lib/utils/contact";
import { storageUrl } from "@/lib/utils/storage";
import type { SiteSettings } from "@/types/content";

/**
 * schema.org ProfessionalService built ONLY from real settings values.
 * Nothing is invented: empty fields are left out, and nothing renders without a name.
 */
export function StudioJsonLd({ settings: s }: { settings: SiteSettings }) {
  const name = siteName(s);
  if (!name) return null;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name,
    url: publicEnv.siteUrl,
  };
  const description = s.seo_description || s.hero_subtitle;
  if (description) data.description = description;
  const image = storageUrl(s.hero_image_path) || storageUrl(s.og_image_path);
  if (image) data.image = image;
  const logo = storageUrl(s.logo_path);
  if (logo) data.logo = logo;
  if (s.phone) data.telephone = s.phone;
  if (s.email) data.email = s.email;
  if (s.address) data.address = s.address;
  if (s.photographer_name && s.photographer_name !== name) data.founder = { "@type": "Person", name: s.photographer_name };
  const sameAs = [s.instagram_url, s.facebook_url, s.tiktok_url, s.youtube_url].map(safeUrl).filter(Boolean);
  if (sameAs.length) data.sameAs = sameAs;
  const map = safeUrl(s.map_url);
  if (map) data.hasMap = map;

  // Escape "<" so the JSON can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
