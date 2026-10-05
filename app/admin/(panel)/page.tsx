import Link from "next/link";
import { AlbumIcon, BoxIcon, CalendarIcon, ChevronForward, SettingsIcon, UploadIcon } from "@/components/icons";
import { AdminPageHeader } from "@/components/admin/fields";
import { BookingStatusBadge } from "@/components/admin/BookingStatusBadge";
import { requireAdminPage } from "@/lib/auth";
import { getDashboardData, getSettingsForAdmin } from "@/lib/data/admin";
import { t } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/utils/format";

const d = t.admin.dashboard;

export default async function DashboardPage() {
  const { supabase } = await requireAdminPage();
  const [{ counts, recent }, settings] = await Promise.all([getDashboardData(supabase), getSettingsForAdmin(supabase)]);
  const needsSetup = !settings.hero_image_path || (!settings.phone && !settings.whatsapp);

  const stats = [
    { label: d.newBookings, value: counts.newBookings, href: "/admin/bookings?status=new", highlight: counts.newBookings > 0 },
    { label: d.photos, value: counts.media, href: "/admin/media" },
    { label: d.albums, value: counts.albums, href: "/admin/albums" },
    { label: d.packages, value: counts.packages, href: "/admin/packages" },
    { label: d.services, value: counts.services, href: "/admin/services" },
  ];

  const quick = [
    { href: "/admin/media?upload=1", label: d.addPhotos, Icon: UploadIcon },
    { href: "/admin/packages/new", label: d.addPackage, Icon: BoxIcon },
    { href: "/admin/albums/new", label: d.addAlbum, Icon: AlbumIcon },
    { href: "/admin/bookings", label: d.viewBookings, Icon: CalendarIcon },
    { href: "/admin/settings", label: d.editSettings, Icon: SettingsIcon },
  ];

  return (
    <>
      <AdminPageHeader title={d.title} />

      {needsSetup && (
        <Link href="/admin/settings" className="mb-6 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent-soft p-4 text-[0.95rem]">
          <SettingsIcon size={20} className="shrink-0 text-accent" />
          <span className="flex-1">{d.setupHint}</span>
          <ChevronForward size={18} />
        </Link>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className={`flex h-full flex-col justify-between gap-3 rounded-2xl border p-4 transition-colors hover:border-ink ${s.highlight ? "border-accent bg-accent-soft" : "border-line bg-surface"}`}
            >
              <span className="text-sm text-muted">{s.label}</span>
              <span className="text-3xl font-semibold tabular-nums">{s.value}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-8" aria-labelledby="quick">
        <h2 id="quick" className="mb-3 font-sans text-base font-semibold">{d.quick}</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {quick.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link href={href} className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-surface px-4 text-[0.95rem] hover:border-ink">
                <Icon size={20} className="shrink-0 text-accent" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="recent">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent" className="font-sans text-base font-semibold">{d.recentBookings}</h2>
          {recent.length > 0 && (
            <Link href="/admin/bookings" className="text-sm text-muted hover:text-ink">{t.admin.nav.bookings}</Link>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-muted">{d.noBookings}</div>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {recent.map((b) => (
              <li key={b.id}>
                <Link href={`/admin/bookings/${b.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{b.customer_name}</p>
                    <p className="truncate text-sm text-muted">
                      {[b.service_title, b.package_title].filter(Boolean).join(" · ") || "—"} · {formatDate(b.requested_date)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <BookingStatusBadge status={b.status} />
                    <span className="text-xs text-muted">{formatDateTime(b.created_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
