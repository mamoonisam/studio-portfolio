"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "@/components/icons";
import { useFeedback } from "@/components/admin/Feedback";
import { reorderItems } from "@/lib/actions/media";
import { t } from "@/lib/i18n";

type Table = "categories" | "albums" | "services" | "packages" | "videos";

interface Props<T extends { id: string }> {
  table: Table;
  items: T[];
  render: (item: T) => React.ReactNode;
}

/**
 * A list whose order the photographer changes with up/down buttons
 * (works the same with a finger on a phone or with a keyboard).
 */
export function ReorderableList<T extends { id: string }>({ table, items, render }: Props<T>) {
  const router = useRouter();
  const { report } = useFeedback();
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const [sourceItems, setSourceItems] = useState(items);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New data from the server replaces any local ordering.
  if (sourceItems !== items) {
    setSourceItems(items);
    setLocalOrder(null);
  }

  const byId = new Map(items.map((i) => [i.id, i]));
  const ordered = (localOrder ?? items.map((i) => i.id)).map((id) => byId.get(id)).filter((x): x is T => Boolean(x));

  const move = (index: number, delta: number) => {
    const ids = ordered.map((i) => i.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setLocalOrder(ids);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const result = await reorderItems({ table, ids });
      if (report(result)) router.refresh();
    }, 600);
  };

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {ordered.map((item, index) => (
        <li key={item.id} className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
          {ordered.length > 1 && (
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                className="btn btn-icon btn-ghost h-8 min-h-8 w-8 min-w-8"
                aria-label={t.admin.common.moveUp}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ChevronUp size={18} />
              </button>
              <button
                type="button"
                className="btn btn-icon btn-ghost h-8 min-h-8 w-8 min-w-8"
                aria-label={t.admin.common.moveDown}
                disabled={index === ordered.length - 1}
                onClick={() => move(index, 1)}
              >
                <ChevronDown size={18} />
              </button>
            </div>
          )}
          <div className="min-w-0 flex-1">{render(item)}</div>
        </li>
      ))}
    </ul>
  );
}
