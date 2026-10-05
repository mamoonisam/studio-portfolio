"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { submitBooking } from "@/lib/actions/booking";
import { bookingSchema } from "@/lib/validation/booking";
import { fieldErrors as toFieldErrors } from "@/lib/validation/common";
import { AlertIcon, CheckIcon, SpinnerIcon } from "@/components/icons";
import { t } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils/format";
import type { Package, Service } from "@/types/content";

const b = t.booking;

interface Props {
  services: Pick<Service, "id" | "title">[];
  packages: Pick<Package, "id" | "title" | "price" | "currency">[];
  minDate: string;
  successMessage: string;
}

type Errors = Record<string, string>;

function Field({
  id,
  label,
  optional,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {optional && <span className="ms-1.5 text-[0.8125rem] font-normal text-muted">({b.optional})</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function BookingForm({ services, packages, minDate, successMessage }: Props) {
  const searchParams = useSearchParams();
  const requestedPackage = searchParams.get("package");
  const initialPackage = packages.some((p) => p.id === requestedPackage) ? (requestedPackage as string) : "";

  const formRef = useRef<HTMLFormElement>(null);
  const startedAt = useRef<number>(0);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startedAt.current = Date.now();
  }, [done]);

  const describedBy = (id: string, hasHint = false) =>
    errors[id] ? `${id}-error` : hasHint ? `${id}-hint` : undefined;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return; // block double clicks while sending
    const fd = new FormData(e.currentTarget);
    const payload = {
      customer_name: String(fd.get("customer_name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      service_id: String(fd.get("service_id") ?? "") || null,
      package_id: String(fd.get("package_id") ?? "") || null,
      requested_date: String(fd.get("requested_date") ?? ""),
      preferred_time: String(fd.get("preferred_time") ?? ""),
      location: String(fd.get("location") ?? ""),
      notes: String(fd.get("notes") ?? ""),
      website: String(fd.get("website") ?? ""),
      started_at: startedAt.current,
    };

    // Client-side check for instant feedback (the server checks again).
    const parsed = bookingSchema.safeParse(payload);
    if (!parsed.success) {
      const errs = toFieldErrors(parsed.error);
      setErrors(errs);
      setFormError(b.errors.fix);
      const first = Object.keys(errs)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setErrors({});
    setFormError(null);
    startTransition(async () => {
      try {
        const result = await submitBooking(payload);
        if (result.ok) {
          setDone(true);
          formRef.current?.reset();
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setErrors(result.fieldErrors ?? {});
          setFormError(result.error);
        }
      } catch {
        setFormError(b.errors.generic);
      }
    });
  }

  if (done) {
    return (
      <div className="card p-8 text-center sm:p-12" role="status" aria-live="polite">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <CheckIcon size={28} />
        </span>
        <h2 className="display-3 mt-5">{b.successTitle}</h2>
        <p className="mx-auto mt-3 max-w-md whitespace-pre-line text-muted">{successMessage || b.successFallback}</p>
        <button type="button" className="btn btn-outline mt-8" onClick={() => setDone(false)}>
          {b.another}
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="card relative grid gap-6 p-5 sm:p-8" aria-busy={pending}>
      {formError && (
        <div className="flex items-start gap-3 rounded-[var(--radius)] border border-danger/30 bg-danger/5 p-4 text-[0.95rem] text-danger" role="alert">
          <AlertIcon size={20} className="mt-0.5 shrink-0" />
          <p>{formError}</p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="customer_name" label={b.name} error={errors.customer_name}>
          <input
            id="customer_name"
            name="customer_name"
            className="input"
            autoComplete="name"
            required
            maxLength={120}
            aria-invalid={Boolean(errors.customer_name)}
            aria-describedby={describedBy("customer_name")}
          />
        </Field>
        <Field id="phone" label={b.phone} error={errors.phone} hint={b.phoneHint}>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            className="input"
            autoComplete="tel"
            required
            maxLength={30}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy("phone", true)}
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {services.length > 0 && (
          <Field id="service_id" label={b.service} optional error={errors.service_id}>
            <select id="service_id" name="service_id" className="input" defaultValue="" aria-invalid={Boolean(errors.service_id)} aria-describedby={describedBy("service_id")}>
              <option value="">{b.servicePlaceholder}</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </Field>
        )}
        {packages.length > 0 && (
          <Field id="package_id" label={b.package} optional error={errors.package_id}>
            <select
              id="package_id"
              name="package_id"
              className="input"
              defaultValue={initialPackage}
              aria-invalid={Boolean(errors.package_id)}
              aria-describedby={describedBy("package_id")}
            >
              <option value="">{b.packageNone}</option>
              {packages.map((p) => {
                const price = formatPrice(p.price, p.currency);
                return (
                  <option key={p.id} value={p.id}>
                    {price ? `${p.title} — ${price}` : p.title}
                  </option>
                );
              })}
            </select>
          </Field>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="requested_date" label={b.date} error={errors.requested_date}>
          <input
            id="requested_date"
            name="requested_date"
            type="date"
            className="input"
            min={minDate}
            required
            aria-invalid={Boolean(errors.requested_date)}
            aria-describedby={describedBy("requested_date")}
          />
        </Field>
        <Field id="preferred_time" label={b.time} optional error={errors.preferred_time}>
          <input id="preferred_time" name="preferred_time" className="input" placeholder={b.timePlaceholder} maxLength={60} />
        </Field>
      </div>

      <Field id="location" label={b.location} optional error={errors.location}>
        <input id="location" name="location" className="input" placeholder={b.locationPlaceholder} maxLength={300} autoComplete="address-level2" />
      </Field>

      <Field id="notes" label={b.notes} optional error={errors.notes}>
        <textarea id="notes" name="notes" className="input" placeholder={b.notesPlaceholder} maxLength={2000} rows={4} />
      </Field>

      {/* Honeypot — hidden from people and screen readers; bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.8125rem] text-muted">{b.privacy}</p>
        <button type="submit" className="btn btn-primary min-w-48" disabled={pending}>
          {pending ? (
            <>
              <SpinnerIcon /> {b.submitting}
            </>
          ) : (
            b.submit
          )}
        </button>
      </div>
    </form>
  );
}
