"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertIcon, CheckIcon, CloseIcon } from "@/components/icons";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import type { ActionResult } from "@/types/content";

/* ───────────────────────────── Toasts ───────────────────────────── */

type ToastKind = "success" | "error";
interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface FeedbackApi {
  toast: (text: string, kind?: ToastKind) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Shows the right toast for an action result and handles an expired session. */
  report: <T>(result: ActionResult<T>, successText?: string) => boolean;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used inside <FeedbackProvider>");
  return ctx;
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const nextId = useRef(1);

  const toast = useCallback((text: string, kind: ToastKind = "success") => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-3), { id, kind, text }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), kind === "error" ? 6000 : 3500);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setConfirmState({ ...options, resolve })),
    [],
  );

  const report = useCallback(
    <T,>(result: ActionResult<T>, successText?: string): boolean => {
      if (result.ok) {
        toast(successText ?? result.message ?? t.admin.common.saved, "success");
        return true;
      }
      toast(result.error, "error");
      if (result.code === "unauthorized") router.push("/admin/login");
      return false;
    },
    [router, toast],
  );

  const closeConfirm = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm, report }}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 z-[70] flex flex-col items-center gap-2 px-4"
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
        aria-live="polite"
        role="status"
      >
        {toasts.map((x) => (
          <div
            key={x.id}
            className={cn(
              "pointer-events-auto flex max-w-md items-center gap-3 rounded-full px-5 py-3 text-[0.95rem] shadow-lg",
              x.kind === "success" ? "bg-ink text-bg" : "bg-danger text-white",
            )}
            style={{ animation: "toastIn .2s ease" }}
          >
            {x.kind === "success" ? <CheckIcon size={18} /> : <AlertIcon size={18} />}
            <span>{x.text}</span>
          </div>
        ))}
      </div>

      {confirmState && (
        <Modal title={confirmState.title} onClose={() => closeConfirm(false)} size="sm">
          {confirmState.body && <p className="text-[0.95rem] text-muted">{confirmState.body}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">
            <button type="button" className={cn("btn", confirmState.danger ? "btn-danger" : "btn-primary")} onClick={() => closeConfirm(true)} autoFocus>
              {confirmState.confirmLabel ?? t.admin.common.confirmDelete}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => closeConfirm(false)}>
              {t.admin.common.cancel}
            </button>
          </div>
        </Modal>
      )}
    </FeedbackContext.Provider>
  );
}

/* ───────────────────────────── Modal ───────────────────────────── */

export function Modal({
  title,
  onClose,
  children,
  size = "md",
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const node = ref.current;
    if (node && !node.contains(document.activeElement)) {
      node.querySelector<HTMLElement>("[autofocus], input, select, textarea, button")?.focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      }
      if (e.key === "Tab" && node) {
        const items = node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
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
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  const width = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-6xl" }[size];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" style={{ animation: "fadeIn .15s ease" }}>
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl sm:rounded-2xl",
          width,
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
          <h2 id="modal-title" className="font-sans text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="btn btn-icon btn-ghost -me-2" aria-label={t.admin.common.close}>
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="border-t border-line px-5 py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
