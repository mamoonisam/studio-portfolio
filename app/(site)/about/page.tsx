import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { getSettings } from "@/lib/data/public";
import { siteName } from "@/lib/data/defaults";
import { t } from "@/lib/i18n";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: s.about_title || t.about.title,
    description: (s.about_short || s.about_text).slice(0, 160) || undefined,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const s = await getSettings();
  const name = s.photographer_name || siteName(s);
  const intro = s.about_text || s.about_short;
  const hasContent = Boolean(intro || s.about_story || s.about_extra || s.about_image_path);

  return (
    <div className="container-x pb-24 pt-[calc(var(--header-h)+3.5rem)] md:pt-[calc(var(--header-h)+5rem)]">
      <div className="grid gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
        {s.about_image_path && (
          <div className="md:sticky md:top-[calc(var(--header-h)+2rem)] md:self-start">
            <div className="photo-frame relative aspect-[4/5] rounded-[var(--radius)]">
              <Photo path={s.about_image_path} alt={name} fill priority sizes="(min-width: 768px) 40vw, 100vw" />
            </div>
          </div>
        )}
        <div className={s.about_image_path ? "min-w-0" : "min-w-0 md:col-span-2 md:max-w-3xl"}>
          <p className="eyebrow">{s.about_title || t.about.title}</p>
          {name && <h1 className="display-2 mt-2 fade-up">{name}</h1>}
          {s.studio_name && s.photographer_name && s.studio_name !== s.photographer_name && (
            <p className="mt-2 text-muted">{s.studio_name}</p>
          )}
          {s.years_experience ? <p className="mt-4 text-accent">{t.home.yearsExperience(s.years_experience)}</p> : null}

          {intro && <p className="mt-8 whitespace-pre-line text-[1.1rem] leading-8">{intro}</p>}

          {s.about_story && (
            <section className="mt-12 border-t border-line pt-10" aria-labelledby="story">
              <h2 id="story" className="display-3">{t.about.story}</h2>
              <p className="mt-4 whitespace-pre-line leading-8">{s.about_story}</p>
            </section>
          )}

          {s.about_extra && (
            <section className="mt-12 border-t border-line pt-10" aria-labelledby="extra">
              <h2 id="extra" className="display-3">{t.about.more}</h2>
              <p className="mt-4 whitespace-pre-line leading-8">{s.about_extra}</p>
            </section>
          )}

          {!hasContent && <p className="mt-8 text-muted">{t.contact.empty}</p>}

          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/portfolio" className="btn btn-primary">{t.home.viewAll}</Link>
            <Link href="/booking" className="btn btn-outline">{t.home.bookNow}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
