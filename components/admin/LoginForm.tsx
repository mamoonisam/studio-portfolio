"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { AlertIcon, CheckIcon, SpinnerIcon } from "@/components/icons";
import { t } from "@/lib/i18n";

const l = t.admin.login;

export function LoginForm({ next, notice, success }: { next?: string; notice?: string | null; success?: string | null }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, { error: null, email: "" });
  const message = state.error ?? notice ?? null;

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      {message && (
        <div className="flex items-start gap-3 rounded-[var(--radius)] border border-danger/30 bg-danger/5 p-3.5 text-[0.95rem] text-danger" role="alert">
          <AlertIcon size={20} className="mt-0.5 shrink-0" />
          <p>{message}</p>
        </div>
      )}
      {!message && success && (
        <div className="flex items-start gap-3 rounded-[var(--radius)] border border-success/30 bg-success/5 p-3.5 text-[0.95rem] text-success" role="status">
          <CheckIcon size={20} className="mt-0.5 shrink-0" />
          <p>{success}</p>
        </div>
      )}
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="field">
        <label htmlFor="email" className="field-label">{l.email}</label>
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
          aria-invalid={Boolean(state.error)}
        />
      </div>
      <div className="field">
        <label htmlFor="password" className="field-label">{l.password}</label>
        <input id="password" name="password" type="password" autoComplete="current-password" dir="ltr" required className="input" />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? (
          <>
            <SpinnerIcon /> {l.submitting}
          </>
        ) : (
          l.submit
        )}
      </button>
      <Link href="/admin/forgot" className="text-center text-sm text-muted hover:text-ink">{l.forgot}</Link>
    </form>
  );
}
