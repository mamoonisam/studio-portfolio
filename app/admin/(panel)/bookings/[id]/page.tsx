import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/fields";
import { BackLink } from "@/components/admin/BackLink";
import { BookingStatusBadge } from "@/components/admin/BookingStatusBadge";
import { BookingNotes, BookingStatusPicker, DeleteBookingButton } from "@/components/admin/BookingActions";
import { PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { requireAdminPage } from "@/lib/auth";
import { getBooking, getSettingsForAdmin } from "@/lib/data/admin";
import { t } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { telLink, whatsappLink } from "@/lib/utils/contact";
import { isUuid } from "@/lib/utils/ids";

const b = t.admin.bookings;

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase } = await requireAdminPage();
  const [booking, settings] = await Promise.all([getBooking(supabase, id), getSettingsForAdmin(supabase)]);
  if (!booking) notFound();

  const tel = telLink(booking.phone);
  const wa = whatsappLink(booking.phone, b.whatsappMessage(booking.customer_name), settings.phone_country_code);
  const needsCountryCode = booking.phone.replace(/\D/g, "").startsWith("0") && !settings.phone_country_code;

  const rows: [string, string | null][] = [
    [b.phone, booking.phone],
    [b.service, booking.service_title],
    [b.package, booking.package_title ? `${booking.package_title}${booking.package_price ? ` — ${booking.package_price}` : ""}` : null],
    [b.requestedDate, formatDate(booking.requested_date)],
    [b.time, booking.preferred_time],
    [b.location, booking.location],
    [b.createdAt, formatDateTime(booking.created_at)],
  ];

  return (
    <>
      <AdminPageHeader
        title={booking.customer_name}
        back={<BackLink href="/admin/bookings" label={b.title} />}
        actions={<BookingStatusBadge status={booking.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="grid content-start gap-6">
          <div className="flex flex-wrap gap-2">
            {tel && (
              <a href={tel} className="btn btn-primary flex-1 sm:flex-none">
                <PhoneIcon size={18} /> {b.call}
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline flex-1 sm:flex-none">
                <WhatsAppIcon size={18} /> {b.whatsapp}
              </a>
            )}
          </div>
          {needsCountryCode && <p className="text-sm text-muted">{b.countryHint}</p>}

          <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 px-4 py-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="break-words" dir={label === b.phone ? "ltr" : undefined} style={label === b.phone ? { textAlign: "right" } : undefined}>
                  {value || b.noValue}
                </dd>
              </div>
            ))}
          </dl>

          <section className="rounded-2xl border border-line bg-surface p-4" aria-labelledby="customer-notes">
            <h2 id="customer-notes" className="text-sm text-muted">{b.notes}</h2>
            <p className="mt-2 whitespace-pre-line">{booking.notes || b.noValue}</p>
          </section>
        </div>

        <div className="grid content-start gap-6">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <BookingStatusPicker id={booking.id} status={booking.status} />
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <BookingNotes id={booking.id} notes={booking.admin_notes} />
          </div>
          <div>
            <DeleteBookingButton id={booking.id} />
          </div>
        </div>
      </div>
    </>
  );
}
