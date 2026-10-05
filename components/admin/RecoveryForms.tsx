"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertIcon, CheckIcon, SpinnerIcon } from "@/components/icons";
import {
  completePasswordReset,
  requestPasswordReset,
  type RecoveryState,
  type ResetState,
} from "@/lib/actions/recovery";
import { t } from "@/lib/i18n";

const r = t.admin.recovery;
const a = t.admin.account;

function Notice({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  const tone = kind === "error" ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success";
  return (
    <div className={`flex items-start gap-3 rounded-[var(--radius)] border p-3.5 text-[0.95rem] ${tone}`} role={kind === "error" ? "alert" : "status"}>
      {kind === "error" ? <AlertIcon size={20} className="mt-0.5 shrink-0" /> : <CheckIcon size={20} className="mt-0.5 shrink-0" />}
      <p>{children}</p>
    </div>
  );
}

export function ForgotForm({ notice }: { notice?: string | null }) {
  const [state, formAction, pending] = useActionState<RecoveryState, FormData>(requestPasswordReset, {
    error: null,
    done: false,
    email: "",
  });

  if (state.done) {
    return (
      <div className="grid gap-5">
        <Notice kind="success">{r.sent}</Notice>
        <p className="text-sm text-muted">{r.contactOwner}</p>
        <Link href="/admin/login" className="btn btn-outline w-full">{r.backToLogin}</Link>
      </div>
    );
  }

  const message = state.error ?? notice ?? null;
  return (
    <form action={formAction} className="grid gap-5" noValidate>
      {message && <Notice kind="error">{message}</Notice>}
      <p className="text-[0.95rem] text-muted">{r.forgotIntro}</p>
      <div className="field">
        <label htmlFor="email" className="field-label">{t.admin.login.email}</label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          dir="ltr"
          required
          className="input"
          defaultValue={state.email}
        />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? (
          <>
            <SpinnerIcon /> {r.sending}
          </>
        ) : (
          r.send
        )}
      </button>
      <Link href="/admin/login" className="text-center text-sm text-muted hover:text-ink">{r.backToLogin}</Link>
    </form>
  );
}

export function ResetForm() {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(completePasswordReset, { error: null });
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      {state.error && <Notice kind="error">{state.error}</Notice>}
      <p className="text-[0.95rem] text-muted">{r.resetIntro}</p>
      <div className="field">
        <label htmlFor="password" className="field-label">{a.newPassword}</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          required
          minLength={8}
          className="input"
          aria-invalid={Boolean(fe.password)}
        />
        {fe.password ? <p className="field-error">{fe.password}</p> : <p className="field-hint">{a.hint}</p>}
      </div>
      <div className="field">
        <label htmlFor="confirm" className="field-label">{a.confirm}</label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          required
          className="input"
          aria-invalid={Boolean(fe.confirm)}
        />
        {fe.confirm && <p className="field-error">{fe.confirm}</p>}
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? (
          <>
            <SpinnerIcon /> {t.admin.common.saving}
          </>
        ) : (
          r.save
        )}
      </button>
    </form>
  );
}
