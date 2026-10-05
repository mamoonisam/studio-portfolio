"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/", label: t.nav.home },
  { href: "/portfolio", label: t.nav.portfolio },
  { href: "/videos", label: t.nav.videos },
  { href: "/packages", label: t.nav.packages },
  { href: "/about", label: t.nav.about },
  { href: "/booking", label: t.nav.booking },
  { href: "/contact", label: t.nav.contact },
];

interface Props {
  name: string;
  logoUrl: string | null;
  /** Home page with a hero image: start transparent with light text. */
  hasHero: boolean;
  /** The "Videos" link appears only once at least one video is published. */
  showVideos?: boolean;
}

export function SiteHeader({ name, logoUrl, hasHero, showVideos = false }: Props) {
  const nav = showVideos ? NAV : NAV.filter((item) => item.href !== "/videos");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const overlay = hasHero && pathname === "/" && !scrolled && !open;

  // Close the menu when the route changes (render-time update, no effect needed)
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const frame = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && panelRef.current) {
        const items = panelRef.current.querySelectorAll<HTMLElement>("a, button");
        if (items.length === 0) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,color,border-color] duration-300",
        overlay ? "border-b border-transparent bg-transparent text-white" : "border-b border-line bg-bg/92 text-ink backdrop-blur-md",
      )}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
        {t.nav.skip}
      </a>
      <div className="container-x flex h-[var(--header-h)] items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={name || t.nav.home}>
          {logoUrl ? (
            <span className={cn("relative block h-9 w-28 sm:w-36", overlay && "brightness-0 invert")}>
              <Image src={logoUrl} alt={name} fill sizes="144px" className="object-contain object-right" priority />
            </span>
          ) : (
            <span className="truncate font-display text-[1.6rem] leading-none">{name}</span>
          )}
        </Link>

        <nav aria-label={t.nav.menu} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.slice(0, -1).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-[0.95rem] transition-opacity",
                    isActive(item.href) ? "opacity-100" : "opacity-70 hover:opacity-100",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="ms-2">
              <Link href="/contact" className={cn("btn btn-sm", overlay ? "btn-glass" : "btn-outline")}>
                {t.nav.contact}
              </Link>
            </li>
          </ul>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="btn btn-icon btn-ghost -me-2 lg:hidden"
          style={overlay ? { color: "#fff", background: "transparent" } : undefined}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t.nav.close : t.nav.menu}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[calc(var(--header-h)+env(safe-area-inset-top,0px))] overflow-y-auto bg-bg text-ink lg:hidden"
        style={{ animation: open ? "fadeIn .2s ease" : undefined }}
      >
        <nav aria-label={t.nav.menu} className="container-x flex flex-col py-6">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={cn(
                "border-b border-line py-4 font-display text-[1.9rem] leading-tight",
                isActive(item.href) ? "text-accent" : "text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/booking" className="btn btn-primary mt-8 w-full" onClick={() => setOpen(false)}>
            {t.home.bookNow}
          </Link>
        </nav>
      </div>
    </header>
  );
}
