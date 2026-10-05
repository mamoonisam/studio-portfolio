import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/markazi-text/400.css";
import "@fontsource/markazi-text/500.css";
import "@fontsource/markazi-text/600.css";
import "./globals.css";
import { getSettings } from "@/lib/data/public";
import { siteName } from "@/lib/data/defaults";
import { publicEnv } from "@/lib/env";
import { localeConfig, t } from "@/lib/i18n";
import { storageUrl } from "@/lib/utils/storage";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = siteName(s) || t.meta.defaultTitle;
  const title = s.seo_title.trim() || name;
  const description = s.seo_description.trim() || s.hero_subtitle.trim() || undefined;
  const ogImage = storageUrl(s.og_image_path) ?? storageUrl(s.hero_image_path);
  const favicon = storageUrl(s.favicon_path);

  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: { default: title, template: `%s · ${name}` },
    description,
    applicationName: name,
    openGraph: {
      type: "website",
      locale: "ar",
      siteName: name,
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    icons: favicon ? { icon: [{ url: favicon }], apple: [{ url: favicon }] } : undefined,
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0e" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const theme = s.theme === "light" || s.theme === "dark" ? s.theme : undefined;

  return (
    <html lang={localeConfig.htmlLang} dir={localeConfig.dir} data-theme={theme} data-accent={s.accent} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
