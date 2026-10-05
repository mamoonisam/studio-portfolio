import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WhatsAppFloat } from "@/components/site/WhatsAppFloat";
import { getSettings, getVideos } from "@/lib/data/public";
import { siteName } from "@/lib/data/defaults";
import { storageUrl } from "@/lib/utils/storage";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, videos] = await Promise.all([getSettings(), getVideos().catch(() => [])]);
  const showVideos = videos.length > 0;
  return (
    <>
      <SiteHeader name={siteName(settings)} logoUrl={storageUrl(settings.logo_path)} hasHero={Boolean(settings.hero_image_path)} showVideos={showVideos} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter settings={settings} showVideos={showVideos} />
      <WhatsAppFloat number={settings.whatsapp} />
    </>
  );
}
