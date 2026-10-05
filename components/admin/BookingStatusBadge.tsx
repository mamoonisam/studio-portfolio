import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import type { BookingStatus } from "@/types/content";

const STYLES: Record<BookingStatus, string> = {
  new: "bg-accent text-accent-ink",
  contacted: "bg-info/15 text-info",
  confirmed: "bg-success/15 text-success",
  completed: "bg-surface-2 text-muted",
  cancelled: "bg-danger/10 text-danger line-through decoration-1",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", STYLES[status])}>
      {t.admin.bookings.statuses[status]}
    </span>
  );
}
