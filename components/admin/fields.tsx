"use client";

import { useId } from "react";
import { SpinnerIcon } from "@/components/icons";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

export function FormField({
  label,
  hint,
  error,
  optional,
  children,
  htmlFor,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  htmlFor: string;
  className?: string;
}) {
  return (
    <div className={cn("field", className)}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {optional && <span className="ms-1.5 text-[0.8125rem] font-normal text-muted">({t.admin.common.optional})</span>}
      </label>
      {children}
      {hint && !error && <p id={`${htmlFor}-hint`} className="field-hint">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  label: string;
  value: string;
  onValue: (v: string) => void;
  hint?: string;
  error?: string;
  optional?: boolean;
};

export function TextField({ label, value, onValue, hint, error, optional, id, className, ...rest }: InputProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FormField label={label} hint={hint} error={error} optional={optional} htmlFor={fieldId} className={className}>
      <input
        id={fieldId}
        className="input"
        value={value}
        onChange={(e) => onValue(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...rest}
      />
    </FormField>
  );
}

type AreaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
  label: string;
  value: string;
  onValue: (v: string) => void;
  hint?: string;
  error?: string;
  optional?: boolean;
};

export function TextArea({ label, value, onValue, hint, error, optional, id, className, rows = 4, ...rest }: AreaProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FormField label={label} hint={hint} error={error} optional={optional} htmlFor={fieldId} className={className}>
      <textarea
        id={fieldId}
        className="input"
        rows={rows}
        value={value}
        onChange={(e) => onValue(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...rest}
      />
    </FormField>
  );
}

export function SelectField({
  label,
  value,
  onValue,
  options,
  hint,
  error,
  optional,
  id,
  className,
}: {
  label: string;
  value: string;
  onValue: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
  error?: string;
  optional?: boolean;
  id?: string;
  className?: string;
}) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FormField label={label} hint={hint} error={error} optional={optional} htmlFor={fieldId} className={className}>
      <select id={fieldId} className="input" value={value} onChange={(e) => onValue(e.target.value)} aria-invalid={Boolean(error)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FormField>
  );
}

/** Accessible on/off switch (a real checkbox underneath). */
export function Toggle({
  label,
  checked,
  onChange,
  hint,
  id,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  id?: string;
  disabled?: boolean;
}) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className="flex items-start gap-3">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={fieldId}
          type="checkbox"
          role="switch"
          className="peer h-7 w-12 cursor-pointer appearance-none rounded-full bg-line transition-colors checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={hint ? `${fieldId}-hint` : undefined}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:-translate-x-5"
        />
      </span>
      <span className="min-w-0">
        <label htmlFor={fieldId} className="cursor-pointer text-[0.95rem] font-medium">{label}</label>
        {hint && <span id={`${fieldId}-hint`} className="field-hint block">{hint}</span>}
      </span>
    </div>
  );
}

export function SubmitButton({ pending, label, pendingLabel, className, disabled }: { pending: boolean; label?: string; pendingLabel?: string; className?: string; disabled?: boolean }) {
  return (
    <button type="submit" className={cn("btn btn-primary", className)} disabled={pending || disabled}>
      {pending ? (
        <>
          <SpinnerIcon /> {pendingLabel ?? t.admin.common.saving}
        </>
      ) : (
        label ?? t.admin.common.save
      )}
    </button>
  );
}

/** Sticky save bar at the bottom of long admin forms (thumb-friendly on phones). */
export function SaveBar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="sticky bottom-0 z-10 -mx-4 mt-8 flex flex-wrap items-center gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
    >
      {children}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <p className="text-lg font-medium">{title}</p>
      {hint && <p className="mx-auto mt-2 max-w-md text-[0.95rem] text-muted">{hint}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function AdminPageHeader({ title, actions, back }: { title: string; actions?: React.ReactNode; back?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
      <div className="min-w-0">
        {back}
        <h1 className="font-sans text-2xl font-semibold sm:text-[1.75rem]">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
