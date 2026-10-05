import Link from "next/link";
import { AdminPageHeader, EmptyState } from "@/components/admin/fields";
import { BookingStatusBadge } from "@/components/admin/BookingStatusBadge";
import { PhoneIcon } from "@/components/icons";
import { requireAdminPage } from "@/lib/auth";
import { listBookings } from "@/lib/data/admin";
import { t } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { telLink } from "@/lib/utils/contact";
import { cn } from "@/lib/utils/cn";
import { BOOKING_STATUSES, type BookingStatus } from "@/types/content";

const b = t.admin.bookings;

type Props = { searchParams: Promise<{ status?: string }> };

export default async function BookingsPage({ searchParams }: Props) {
  const { supabase } = await requireAdminPage();
  const params = await searchParams;
  const status = (BOOKING_STATUSES as readonly string[]).includes(params.status ?? "") ? (params.status as BookingStatus) : null;
  const { bookings, countsByStatus } = await listBookings(supabase, status);
  const total = Object.values(countsByStatus).reduce((a, n) => a + n, 0);

  const tabs: { key: BookingStatus | null; label: string; count: number }[] = [
    { key: null, label: t.admin.common.all, count: total },
    ...BOOKING_STATUSES.map((s) => ({ key: s, label: b.statuses[s], count: countsByStatus[s] ?? 0 })),
  ];

  return (
    <>
      <AdminPageHeader title={b.title} />

      <nav aria-label={b.status} className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-2">
          {tabs.map((tab) => {
            const active = tab.key === status;
            return (
              <li key={tab.key ?? "all"}>
                <Link
                  href={tab.key ? `/admin/bookings?status=${tab.key}` : "/admin/bookings"}
                  aria-current={active ? "page" : undefined}
                  className={cn("btn btn-sm", active ? "btn-primary" : "btn-outline")}
                >
                  {tab.label}
                  <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-bg/20" : "bg-surface-2")}>{tab.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {bookings.length === 0 ? (
        <EmptyState title={status ? b.emptyFilter : b.empty} />
      ) : (
        <>
          {/* Phones: cards */}
          <ul className="grid gap-2 md:hidden">
            {bookings.map((row) => {
              const tel = telLink(row.phone);
              return (
                <li key={row.id} className="flex items-stretch overflow-hidden rounded-2xl border border-line bg-surface">
                  <Link href={`/admin/bookings/${row.id}`} className="min-w-0 flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium">{row.customer_name}</p>
                      <BookingStatusBadge status={row.status} />
                    </div>
                    <p className="mt-1 truncate text-sm text-muted">{[row.service_title, row.package_title].filter(Boolean).join(" · ") || b.noValue}</p>
                    <p className="mt-1 text-sm">
                      <span className="text-muted">{b.requestedDate}: </span>
                      {formatDate(row.requested_date)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{formatDateTime(row.created_at)}</p>
                  </Link>
                  {tel && (
                    <a href={tel} className="flex w-14 shrink-0 items-center justify-center border-s border-line text-accent" aria-label={`${b.call} ${row.customer_name}`}>
                      <PhoneIcon size={20} />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Tablets and computers: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface md:block">
            <table className="w-full min-w-[46rem] text-start text-[0.95rem]">
              <thead className="border-b border-line bg-surface-2/60 text-sm text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{b.customer}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{b.phone}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{b.service}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{b.package}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{b.requestedDate}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{b.createdAt}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{b.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {bookings.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-2/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${row.id}`} className="font-medium hover:text-accent">{row.customer_name}</Link>
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      <span className="block text-end">{row.phone}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{row.service_title || b.noValue}</td>
                    <td className="px-4 py-3 text-muted">{row.package_title || b.noValue}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(row.requested_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted">{formatDateTime(row.created_at)}</td>
                    <td className="px-4 py-3"><BookingStatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
