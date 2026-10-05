import Link from "next/link";
import { SocialLinks } from "@/components/site/SocialLinks";
import { siteName } from "@/lib/data/defaults";
import { t } from "@/lib/i18n";
import { safeUrl, telLink, whatsappLink } from "@/lib/utils/contact";
import type { SiteSettings } from "@/types/content";

export function SiteFooter({ settings: s }: { settings: SiteSettings }) {
  const name = siteName(s);
  const tel = telLink(s.phone);
  const wa = whatsappLink(s.whatsapp, t.whatsapp.greeting);
  const map = safeUrl(s.map_url);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="min-w-0">
          {name && <p className="font-display text-3xl">{name}</p>}
          {s.footer_note && <p className="mt-3 max-w-sm text-sm text-muted">{s.footer_note}</p>}
          <SocialLinks settings={s} className="mt-6" />
        </div>

        <nav aria-label={t.nav.menu} className="min-w-0">
          <ul className="grid gap-2 text-[0.95rem]">
            <li><Link className="text-muted hover:text-ink" href="/portfolio">{t.nav.portfolio}</Link></li>
            <li><Link className="text-muted hover:text-ink" href="/packages">{t.nav.packages}</Link></li>
            <li><Link className="text-muted hover:text-ink" href="/about">{t.nav.about}</Link></li>
            <li><Link className="text-muted hover:text-ink" href="/booking">{t.nav.booking}</Link></li>
            <li><Link className="text-muted hover:text-ink" href="/contact">{t.nav.contact}</Link></li>
          </ul>
        </nav>

        <address className="grid min-w-0 content-start gap-2 text-[0.95rem] not-italic">
          {s.phone && tel && (
            <p>
              <span className="text-muted">{t.contact.phone}: </span>
              <a href={tel} dir="ltr" className="hover:text-accent">{s.phone}</a>
            </p>
          )}
          {s.whatsapp && wa && (
            <p>
              <span className="text-muted">{t.contact.whatsapp}: </span>
              <a href={wa} target="_blank" rel="noopener noreferrer" dir="ltr" className="hover:text-accent">+{s.whatsapp}</a>
            </p>
          )}
          {s.email && (
            <p className="break-all">
              <span className="text-muted">{t.contact.email}: </span>
              <a href={`mailto:${s.email}`} className="hover:text-accent">{s.email}</a>
            </p>
          )}
          {s.address && (
            <p>
              <span className="text-muted">{t.contact.address}: </span>
              {map ? <a href={map} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{s.address}</a> : s.address}
            </p>
          )}
        </address>
      </div>
      <div className="border-t border-line">
        <p className="container-x py-5 text-[0.8125rem] text-muted" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))" }}>
          {t.footer.rights(year, name || t.meta.defaultTitle)}
        </p>
      </div>
    </footer>
  );
}
