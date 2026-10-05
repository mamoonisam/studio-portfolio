"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronBack, ChevronForward, CloseIcon } from "@/components/icons";
import { storageUrl } from "@/lib/utils/storage";
import { t } from "@/lib/i18n";

export interface LightboxItem {
  id: string;
  path: string;
  alt: string;
  title: string | null;
  blur: string | null;
}

interface Props {
  items: LightboxItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/**
 * Full-screen viewer. Keyboard: Esc closes, ←/→ move (mirrored for RTL).
 * Touch: swipe to move. Neighbouring photos are preloaded. No page reload.
 */
export function Lightbox({ items, index, onIndexChange, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const count = items.length;
  const item = items[index];

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      onIndexChange((index + delta + count) % count);
    },
    [count, index, onIndexChange],
  );

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(1); // RTL: left = next
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>("button");
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  if (!item) return null;

  const neighbours = count > 1 ? [items[(index + 1) % count], items[(index - 1 + count) % count]] : [];

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t.lightbox.dialog}
      className="fixed inset-0 z-50 flex flex-col text-white"
      style={{ background: "var(--overlay)", animation: "fadeIn .2s ease" }}
      onTouchStart={(e) => {
        const p = e.touches[0];
        touch.current = { x: p.clientX, y: p.clientY };
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        touch.current = null;
        if (!start) return;
        const p = e.changedTouches[0];
        const dx = p.clientX - start.x;
        const dy = p.clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx > 0 ? 1 : -1); // RTL: swipe right = next
        else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) onClose();
      }}
    >
      <div
        className="flex items-center justify-between gap-4 px-3 py-2 sm:px-5"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))" }}
      >
        <p className="text-sm tabular-nums text-white/70" aria-live="polite">
          {count > 1 ? t.lightbox.counter(index + 1, count) : ""}
        </p>
        <button ref={closeRef} type="button" onClick={onClose} aria-label={t.lightbox.close} className="btn btn-icon text-white hover:bg-white/10">
          <CloseIcon size={26} />
        </button>
      </div>

      <div className="relative min-h-0 flex-1" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {failed[item.id] || !storageUrl(item.path) ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/60">{t.errors.imageFailed}</div>
        ) : (
          <Image
            key={item.id}
            src={storageUrl(item.path) as string}
            alt={item.alt}
            fill
            sizes="100vw"
            quality={85}
            priority
            placeholder={item.blur ? "blur" : "empty"}
            blurDataURL={item.blur ?? undefined}
            className="pointer-events-none select-none object-contain px-2 sm:px-16"
            style={{ animation: "fadeIn .25s ease" }}
            onError={() => setFailed((f) => ({ ...f, [item.id]: true }))}
          />
        )}

        {/* Preload neighbours so moving feels instant */}
        {neighbours.map((n) =>
          n && storageUrl(n.path) ? (
            <Image
              key={`pre-${n.id}`}
              src={storageUrl(n.path) as string}
              alt=""
              fill
              sizes="100vw"
              quality={85}
              loading="eager"
              aria-hidden="true"
              className="pointer-events-none invisible object-contain"
            />
          ) : null,
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t.lightbox.prev}
              className="btn btn-icon absolute right-2 top-1/2 hidden -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 sm:inline-flex"
            >
              <ChevronBack size={26} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t.lightbox.next}
              className="btn btn-icon absolute left-2 top-1/2 hidden -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 sm:inline-flex"
            >
              <ChevronForward size={26} />
            </button>
          </>
        )}
      </div>

      <div
        className="flex min-h-14 items-center justify-between gap-3 px-3 py-2 sm:px-5"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        {count > 1 ? (
          <button type="button" onClick={() => go(-1)} aria-label={t.lightbox.prev} className="btn btn-icon text-white hover:bg-white/10 sm:invisible">
            <ChevronBack size={24} />
          </button>
        ) : <span />}
        <p className="min-w-0 flex-1 truncate text-center text-sm text-white/80">{item.title ?? ""}</p>
        {count > 1 ? (
          <button type="button" onClick={() => go(1)} aria-label={t.lightbox.next} className="btn btn-icon text-white hover:bg-white/10 sm:invisible">
            <ChevronForward size={24} />
          </button>
        ) : <span />}
      </div>
    </div>
  );
}
