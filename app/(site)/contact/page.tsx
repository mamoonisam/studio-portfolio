import type { Metadata } from "next";
import Link from "next/link";
import { ClockIcon, ExternalIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import { PageHeader } from "@/components/site/PageHeader";
import { CopyButton } from "@/components/site/CopyButton";
import { socialLinks } from "@/components/site/SocialLinks";
import { getSettings } from "@/lib/data/public";
import { t } from "@/lib/i18n";
import { safeUrl, telLink, whatsappLink } from "@/lib/utils/contact";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: t.contact.title, description: s.contact_intro || undefined, alternates: { canonical: "/contact" } };
}

export default async function ContactPage() {
  const s = await getSettings();
  const tel = telLink(s.phone);
  const wa = whatsappLink(s.whatsapp, t.whatsapp.greeting);
  const map = safeUrl(s.map_url);
  const socials = socialLinks(s, false);

  // Only rows with a value are shown.
  const rows = [
    s.phone && tel ? { key: "phone", Icon: PhoneIcon, label: t.contact.phone, value: s.phone, href: tel, ltr: true } : null,
    s.whatsapp && wa ? { key: "whatsapp", Icon: WhatsAppIcon, label: t.contact.whatsapp, value: `+${s.whatsapp}`, href: wa, ltr: true, external: true } : null,
    s.email ? { key: "email", Icon: MailIcon, label: t.contact.email, value: s.email, href: `mailto:${s.email}`, ltr: true } : null,
    s.address ? { key: "address", Icon: PinIcon, label: t.contact.address, value: s.address, href: map, external: true } : null,
    s.working_hours ? { key: "hours", Icon: ClockIcon, label: t.contact.hours, value: s.working_hours, href: null } : null,
  ].filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <>
      <PageHeader title={t.contact.title} intro={s.contact_intro} />
      <div className="container-x pb-24">
        {rows.length === 0 && socials.length === 0 ? (
          <p className="rounded-[var(--radius)] border border-dashed border-line px-6 py-16 text-center text-muted">{t.contact.empty}</p>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <ul className="divide-y divide-line border-y border-line">
              {rows.map(({ key, Icon, label, value, href, ltr, external }) => (
                <li key={key} className="flex items-center gap-4 py-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-accent">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] text-muted">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        dir={ltr ? "ltr" : undefined}
                        className="block break-words text-lg hover:text-accent"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="whitespace-pre-line text-lg">{value}</p>
                    )}
                  </div>
                  {(key === "phone" || key === "email" || key === "whatsapp") && <CopyButton value={value} label={label} />}
                </li>
              ))}
            </ul>

            <div className="grid content-start gap-8">
              {socials.length > 0 && (
                <div>
                  <h2 className="display-3 mb-4">{t.contact.social}</h2>
                  <ul className="grid gap-2">
                    {socials.map(({ key, href, label, Icon }) => (
                      <li key={key}>
                        <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-[var(--radius)] border border-line px-4 py-3 hover:border-accent">
                          <Icon size={20} />
                          <span className="flex-1">{label}</span>
                          <ExternalIcon size={16} className="text-muted" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {map && (
                <a href={map} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full">
                  <PinIcon size={18} />
                  {t.contact.map}
                </a>
              )}
              <Link href="/booking" className="btn btn-primary w-full">{t.home.bookNow}</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
