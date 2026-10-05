"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@/components/icons";
import { useFeedback } from "@/components/admin/Feedback";
import { SubmitButton, TextArea } from "@/components/admin/fields";
import { deleteBooking, saveBookingNotes, setBookingStatus } from "@/lib/actions/bookings";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import { BOOKING_STATUSES, type BookingStatus } from "@/types/content";

const b = t.admin.bookings;
const c = t.admin.common;

export function BookingStatusPicker({ id, status }: { id: string; status: BookingStatus }) {
  const router = useRouter();
  const { report } = useFeedback();
  const [current, setCurrent] = useState(status);
  const [pending, startTransition] = useTransition();

  const change = (next: BookingStatus) => {
    if (next === current) return;
    const previous = current;
    setCurrent(next);
    startTransition(async () => {
      const result = await setBookingStatus({ id, status: next });
      if (report(result)) router.refresh();
      else setCurrent(previous);
    });
  };

  return (
    <fieldset disabled={pending}>
      <legend className="field-label mb-2">{b.status}</legend>
      <div className="flex flex-wrap gap-2">
        {BOOKING_STATUSES.map((s) => (
          <label
            key={s}
            className={cn(
              "flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[0.95rem] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
              current === s ? "border-ink bg-ink text-bg" : "border-line hover:border-ink",
            )}
          >
            <input type="radio" name="status" value={s} checked={current === s} onChange={() => change(s)} className="sr-only" />
            {b.statuses[s]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function BookingNotes({ id, notes }: { id: string; notes: string | null }) {
  const { report } = useFeedback();
  const [value, setValue] = useState(notes ?? "");
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          report(await saveBookingNotes({ id, admin_notes: value }));
        });
      }}
    >
      <TextArea label={b.adminNotes} hint={b.adminNotesHint} value={value} onValue={setValue} rows={4} maxLength={5000} />
      <SubmitButton pending={pending} className="justify-self-start" />
    </form>
  );
}

export function DeleteBookingButton({ id }: { id: string }) {
  const router = useRouter();
  const { report, confirm } = useFeedback();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-ghost text-danger"
      disabled={pending}
      onClick={async () => {
        if (!(await confirm({ title: c.confirmDelete, body: b.deleteConfirm, danger: true }))) return;
        startTransition(async () => {
          if (report(await deleteBooking(id))) router.replace("/admin/bookings");
        });
      }}
    >
      <TrashIcon size={18} /> {c.delete}
    </button>
  );
}
