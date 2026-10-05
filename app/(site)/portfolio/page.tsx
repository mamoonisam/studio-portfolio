import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { PortfolioBrowser } from "@/components/site/PortfolioBrowser";
import { getCategories, getPortfolioMedia, getPublishedAlbums, getSettings } from "@/lib/data/public";
import { siteName } from "@/lib/data/defaults";
import { t } from "@/lib/i18n";
import { toGridPhoto } from "@/lib/utils/media";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: t.portfolio.title,
    description: s.portfolio_intro || undefined,
    alternates: { canonical: "/portfolio" },
  };
}

export default async function PortfolioPage() {
  const [s, categories, albums, media] = await Promise.all([
    getSettings(),
    getCategories(),
    getPublishedAlbums(),
    getPortfolioMedia(),
  ]);
  const name = siteName(s);

  return (
    <>
      <PageHeader title={t.portfolio.title} intro={s.portfolio_intro} />
      <PortfolioBrowser
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        albums={albums}
        photos={media.map((m) => toGridPhoto(m, name))}
      />
    </>
  );
}
