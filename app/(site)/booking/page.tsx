import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/site/PageHeader";
import { BookingForm } from "@/components/forms/BookingForm";
import { getPackages, getServices, getSettings } from "@/lib/data/public";
import { t } from "@/lib/i18n";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: t.booking.title,
  alternates: { canonical: "/booking" },
};

/** Yesterday (UTC) — the server re-validates the exact date on submit. */
function minBookingDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default async function BookingPage() {
  const [s, services, packages] = await Promise.all([getSettings(), getServices(), getPackages()]);
  const form = (
    <BookingForm
      services={services.map(({ id, title }) => ({ id, title }))}
      packages={packages.map(({ id, title, price, currency }) => ({ id, title, price, currency }))}
      minDate={minBookingDate()}
      successMessage={s.booking_success}
    />
  );

  return (
    <>
      <PageHeader title={t.booking.title} intro={s.booking_intro} />
      <div className="container-x pb-24">
        <div className="mx-auto max-w-3xl">
          <Suspense fallback={<div className="skeleton h-[36rem] w-full" aria-hidden="true" />}>{form}</Suspense>
        </div>
      </div>
    </>
  );
}
