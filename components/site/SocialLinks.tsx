import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon, YouTubeIcon } from "@/components/icons";
import { t } from "@/lib/i18n";
import { safeUrl, whatsappLink } from "@/lib/utils/contact";
import { cn } from "@/lib/utils/cn";
import type { SiteSettings } from "@/types/content";

/** Builds the list of social links that actually have a value. Empty ones are skipped. */
export function socialLinks(s: SiteSettings, includeWhatsApp = true) {
  const links: { key: string; href: string; label: string; Icon: (p: { size?: number }) => React.ReactElement }[] = [];
  const wa = includeWhatsApp ? whatsappLink(s.whatsapp, t.whatsapp.greeting) : null;
  if (wa) links.push({ key: "whatsapp", href: wa, label: t.social.whatsapp, Icon: WhatsAppIcon });
  const ig = safeUrl(s.instagram_url);
  if (ig) links.push({ key: "instagram", href: ig, label: t.social.instagram, Icon: InstagramIcon });
  const fb = safeUrl(s.facebook_url);
  if (fb) links.push({ key: "facebook", href: fb, label: t.social.facebook, Icon: FacebookIcon });
  const tt = safeUrl(s.tiktok_url);
  if (tt) links.push({ key: "tiktok", href: tt, label: t.social.tiktok, Icon: TikTokIcon });
  const yt = safeUrl(s.youtube_url);
  if (yt) links.push({ key: "youtube", href: yt, label: t.social.youtube, Icon: YouTubeIcon });
  return links;
}

export function SocialLinks({ settings, className, includeWhatsApp = true }: { settings: SiteSettings; className?: string; includeWhatsApp?: boolean }) {
  const links = socialLinks(settings, includeWhatsApp);
  if (links.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {links.map(({ key, href, label, Icon }) => (
        <li key={key}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <Icon size={19} />
          </a>
        </li>
      ))}
    </ul>
  );
}
