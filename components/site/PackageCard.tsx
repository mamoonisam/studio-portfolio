import Link from "next/link";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { Photo } from "@/components/ui/Photo";
import { t } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils/format";
import { whatsappLink } from "@/lib/utils/contact";
import { cn } from "@/lib/utils/cn";
import type { Package } from "@/types/content";

export function PackageCard({ pkg, whatsapp, compact }: { pkg: Package; whatsapp: string; compact?: boolean }) {
  const price = formatPrice(pkg.price, pkg.currency);
  const wa = whatsappLink(whatsapp, t.packages.whatsappMessage(pkg.title));
  const features = compact ? pkg.features.slice(0, 5) : pkg.features;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius)+6px)] border bg-surface",
        pkg.featured ? "border-accent shadow-[0_0_0_1px_var(--accent)]" : "border-line",
      )}
    >
      {pkg.cover_image_path && (
        <div className="photo-frame relative aspect-[16/10]">
          <Photo path={pkg.cover_image_path} alt={pkg.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[1.75rem] leading-tight">{pkg.title}</h3>
          {pkg.featured && (
            <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">{t.packages.featured}</span>
          )}
        </div>
        <p className="mt-3 text-[1.6rem] font-semibold tabular-nums tracking-tight" dir="auto">
          {price ?? <span className="text-lg font-medium text-muted">{t.packages.priceOnRequest}</span>}
        </p>
        {pkg.description && <p className="mt-3 whitespace-pre-line text-[0.95rem] text-muted">{pkg.description}</p>}
        {features.length > 0 && (
          <ul className="mt-5 grid gap-2.5 border-t border-line pt-5">
            {features.map((f, i) => (
              <li key={i} className="flex gap-2.5 text-[0.95rem]">
                <CheckIcon size={18} className="mt-1 shrink-0 text-accent" />
                <span className="min-w-0">{f}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-col gap-2 pt-7">
          <Link href={`/booking?package=${pkg.id}`} className={cn("btn w-full", pkg.featured ? "btn-accent" : "btn-primary")}>
            {t.packages.book}
          </Link>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full">
              <WhatsAppIcon size={18} />
              {t.packages.ask}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
