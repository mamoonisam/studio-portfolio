"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AlbumIcon,
  BoxIcon,
  BriefcaseIcon,
  CalendarIcon,
  CloseIcon,
  ExternalIcon,
  HomeIcon,
  ImageIcon,
  KeyIcon,
  LogoutIcon,
  MenuIcon,
  SettingsIcon,
  TagIcon,
} from "@/components/icons";
import { FeedbackProvider } from "@/components/admin/Feedback";
import { logoutAction } from "@/lib/actions/auth";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

const n = t.admin.nav;

const NAV = [
  { href: "/admin", label: n.dashboard, Icon: HomeIcon },
  { href: "/admin/bookings", label: n.bookings, Icon: CalendarIcon, badge: true },
  { href: "/admin/media", label: n.media, Icon: ImageIcon },
  { href: "/admin/albums", label: n.albums, Icon: AlbumIcon },
  { href: "/admin/categories", label: n.categories, Icon: TagIcon },
  { href: "/admin/services", label: n.services, Icon: BriefcaseIcon },
  { href: "/admin/packages", label: n.packages, Icon: BoxIcon },
  { href: "/admin/settings", label: n.settings, Icon: SettingsIcon },
];

/** Bottom tab bar on phones: the four most used sections. */
const TABS = ["/admin", "/admin/bookings", "/admin/media", "/admin/settings"];

interface Props {
  children: React.ReactNode;
  siteName: string;
  email: string;
  newBookings: number;
}

export function AdminShell({ children, siteName, email, newBookings }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const navList = (
    <ul className="grid gap-1">
      {NAV.map(({ href, label, Icon, badge }) => (
        <li key={href}>
          <Link
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            onClick={() => setOpen(false)}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] transition-colors",
              isActive(href) ? "bg-ink text-bg" : "text-ink hover:bg-surface-2",
            )}
          >
            <Icon size={20} />
            <span className="flex-1">{label}</span>
            {badge && newBookings > 0 && (
              <span className={cn("min-w-6 rounded-full px-2 text-center text-xs font-semibold leading-6", isActive(href) ? "bg-bg text-ink" : "bg-accent text-accent-ink")}>
                {newBookings}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );

  const footerLinks = (
    <div className="grid gap-1 border-t border-line pt-3">
      <Link href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] hover:bg-surface-2">
        <ExternalIcon size={20} />
        {n.viewSite}
      </Link>
      <Link
        href="/admin/account"
        aria-current={pathname === "/admin/account" ? "page" : undefined}
        onClick={() => setOpen(false)}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] transition-colors",
          pathname === "/admin/account" ? "bg-ink text-bg" : "hover:bg-surface-2",
        )}
      >
        <KeyIcon size={20} />
        {n.account}
      </Link>
      <form action={logoutAction}>
        <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[0.95rem] text-danger hover:bg-surface-2">
          <LogoutIcon size={20} />
          {n.logout}
        </button>
      </form>
      <p className="truncate px-3 pt-2 text-xs text-muted" dir="ltr">{email}</p>
    </div>
  );

  return (
    <FeedbackProvider>
      <div className="min-h-svh bg-bg lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-svh flex-col gap-6 border-e border-line bg-surface px-4 py-6 lg:flex">
          <div className="px-3">
            <p className="text-xs text-muted">{t.admin.brand}</p>
            <p className="truncate font-display text-2xl leading-tight">{siteName}</p>
          </div>
          <nav aria-label={t.admin.brand} className="min-h-0 flex-1 overflow-y-auto">{navList}</nav>
          {footerLinks}
        </aside>

        {/* Mobile top bar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-bg/95 px-4 backdrop-blur lg:hidden"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <p className="truncate py-3 font-display text-xl">{siteName || t.admin.brand}</p>
          <button
            type="button"
            className="btn btn-icon btn-ghost -me-2"
            onClick={() => setOpen(true)}
            aria-label={t.nav.menu}
            aria-expanded={open}
            aria-controls="admin-drawer"
          >
            <MenuIcon size={24} />
          </button>
        </header>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" id="admin-drawer">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t.nav.menu}
              className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col gap-4 overflow-y-auto bg-surface px-4 py-4"
              style={{ paddingTop: "max(1rem, env(safe-area-inset-top, 0px))", paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-xl">{siteName || t.admin.brand}</p>
                <button type="button" className="btn btn-icon btn-ghost" onClick={() => setOpen(false)} aria-label={t.nav.close} autoFocus>
                  <CloseIcon size={22} />
                </button>
              </div>
              <nav aria-label={t.admin.brand}>{navList}</nav>
              {footerLinks}
            </div>
          </div>
        )}

        <main id="main" className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>

        {/* Mobile bottom tabs */}
        <nav
          aria-label={t.admin.brand}
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {NAV.filter((i) => TABS.includes(i.href)).map(({ href, label, Icon, badge }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn("relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.72rem]", isActive(href) ? "text-accent" : "text-muted")}
            >
              <Icon size={22} />
              <span>{label}</span>
              {badge && newBookings > 0 && (
                <span className="absolute top-1.5 ms-6 min-w-5 rounded-full bg-accent px-1.5 text-center text-[0.65rem] font-semibold leading-5 text-accent-ink">{newBookings}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </FeedbackProvider>
  );
}
