import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { PhotoGrid } from "@/components/site/PhotoGrid";
import { PackageCard } from "@/components/site/PackageCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { StudioJsonLd } from "@/components/site/JsonLd";
import { getFeaturedMedia, getPackages, getServices, getSettings } from "@/lib/data/public";
import { siteName } from "@/lib/data/defaults";
import { t } from "@/lib/i18n";
import { toGridPhoto } from "@/lib/utils/media";

export const revalidate = 3600;

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [s, featured, services, packages] = await Promise.all([
    getSettings(),
    getFeaturedMedia(12),
    getServices(),
    getPackages(),
  ]);
  const name = siteName(s);
  const heroTitle = s.hero_title || name;
  const primaryLabel = s.hero_primary_label || t.home.viewAll;
  const secondaryLabel = s.hero_secondary_label || t.home.bookNow;
  const homePackages = (() => {
    const featuredFirst = [...packages].sort((a, b) => Number(b.featured) - Number(a.featured));
    return featuredFirst.slice(0, 3).sort((a, b) => a.display_order - b.display_order);
  })();
  const aboutBody = s.about_short || s.about_text;

  return (
    <>
      <StudioJsonLd settings={s} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      {s.hero_image_path ? (
        <section className="relative flex min-h-[32rem] items-end overflow-hidden bg-[#111] text-white" style={{ height: "min(92svh, 62rem)" }}>
          <Photo path={s.hero_image_path} alt={heroTitle} fill priority quality={85} sizes="100vw" />
          <div className="absolute inset-0" style={{ background: "var(--hero-scrim)" }} aria-hidden="true" />
          <div className="container-x relative pb-14 pt-32 md:pb-20">
            {heroTitle && <h1 className="display-1 fade-up max-w-4xl">{heroTitle}</h1>}
            {s.hero_subtitle && <p className="fade-up fade-up-2 mt-5 max-w-xl whitespace-pre-line text-lg text-white/85">{s.hero_subtitle}</p>}
            <div className="fade-up fade-up-3 mt-9 flex flex-wrap gap-3">
              <Link href="/portfolio" className="btn btn-light">{primaryLabel}</Link>
              <Link href="/booking" className="btn btn-glass">{secondaryLabel}</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="container-x pb-16 pt-[calc(var(--header-h)+5rem)] md:pb-24 md:pt-[calc(var(--header-h)+8rem)]">
          {heroTitle && <h1 className="display-1 fade-up max-w-4xl">{heroTitle}</h1>}
          {s.hero_subtitle && <p className="lead fade-up fade-up-2 mt-5 whitespace-pre-line">{s.hero_subtitle}</p>}
          <div className="fade-up fade-up-3 mt-9 flex flex-wrap gap-3">
            <Link href="/portfolio" className="btn btn-primary">{primaryLabel}</Link>
            <Link href="/booking" className="btn btn-outline">{secondaryLabel}</Link>
          </div>
        </section>
      )}

      {/* ── Featured work ───────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="section" aria-labelledby="featured-heading">
          <div className="container-x">
            <SectionHeading
              id="featured-heading"
              title={s.featured_title || t.home.featured}
              intro={s.featured_intro}
              action={{ href: "/portfolio", label: t.home.viewAll }}
            />
            <PhotoGrid photos={featured.map((m) => toGridPhoto(m, name))} />
          </div>
        </section>
      )}

      {/* ── Services ────────────────────────────────────────── */}
      {services.length > 0 && (
        <section className="section border-t border-line" aria-labelledby="services-heading">
          <div className="container-x">
            <SectionHeading id="services-heading" title={s.services_title || t.home.services} intro={s.services_intro} />
            <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((svc) => (
                <li key={svc.id} className="min-w-0">
                  {svc.image_path && (
                    <div className="photo-frame relative mb-5 aspect-[3/2] rounded-[var(--radius)]">
                      <Photo path={svc.image_path} alt={svc.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                    </div>
                  )}
                  <h3 className="font-display text-[1.65rem] leading-tight">{svc.title}</h3>
                  {svc.description && <p className="mt-2 whitespace-pre-line text-[0.95rem] text-muted">{svc.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Packages ────────────────────────────────────────── */}
      {homePackages.length > 0 && (
        <section className="section border-t border-line bg-surface-2/50" aria-labelledby="packages-heading">
          <div className="container-x">
            <SectionHeading
              id="packages-heading"
              title={s.packages_title || t.packages.title}
              intro={s.packages_intro}
              action={packages.length > homePackages.length ? { href: "/packages", label: t.home.allPackages } : undefined}
            />
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {homePackages.map((p) => (
                <li key={p.id}>
                  <PackageCard pkg={p} whatsapp={s.whatsapp} compact />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── About ───────────────────────────────────────────── */}
      {(aboutBody || s.about_image_path) && (
        <section className="section border-t border-line" aria-labelledby="about-heading">
          <div className="container-x grid items-center gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-16">
            {s.about_image_path && (
              <div className="photo-frame relative aspect-[4/5] rounded-[var(--radius)]">
                <Photo path={s.about_image_path} alt={s.photographer_name || name} fill sizes="(min-width: 768px) 45vw, 100vw" />
              </div>
            )}
            <div className="min-w-0">
              <p className="eyebrow">{s.about_title || t.about.title}</p>
              <h2 id="about-heading" className="display-2 mt-2">{s.photographer_name || name}</h2>
              {s.years_experience ? (
                <p className="mt-3 text-[0.95rem] text-accent">{t.home.yearsExperience(s.years_experience)}</p>
              ) : null}
              {aboutBody && <p className="mt-6 max-w-xl whitespace-pre-line text-[1.05rem]">{aboutBody}</p>}
              <Link href="/about" className="btn btn-outline mt-8">{t.home.readMore}</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Call to action ──────────────────────────────────── */}
      <section className="border-t border-line bg-ink text-bg">
        <div className="container-x flex flex-col items-start gap-8 py-16 md:flex-row md:items-center md:justify-between md:py-24">
          <div className="max-w-2xl">
            <h2 className="display-2">{s.cta_title || t.booking.title}</h2>
            {s.cta_text && <p className="mt-4 whitespace-pre-line text-lg opacity-75">{s.cta_text}</p>}
          </div>
          <Link href="/booking" className="btn btn-accent shrink-0 px-8">{s.cta_button_label || t.home.bookNow}</Link>
        </div>
      </section>
    </>
  );
}
