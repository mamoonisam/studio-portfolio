"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { EditIcon, PlusIcon, StarIcon, TrashIcon } from "@/components/icons";
import { useFeedback } from "@/components/admin/Feedback";
import { AdminPageHeader, EmptyState, Toggle } from "@/components/admin/fields";
import { ReorderableList } from "@/components/admin/ReorderableList";
import { deletePackage, setPackageFlags } from "@/lib/actions/packages";
import { t } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Package } from "@/types/content";

const p = t.admin.packages;
const c = t.admin.common;

export function PackagesList({ packages }: { packages: Package[] }) {
  const router = useRouter();
  const { report, confirm } = useFeedback();
  const [pending, startTransition] = useTransition();

  const flags = (pkg: Package, f: { active?: boolean; featured?: boolean }) =>
    startTransition(async () => {
      if (report(await setPackageFlags(pkg.id, f))) router.refresh();
    });

  const remove = async (pkg: Package) => {
    if (!(await confirm({ title: `${c.delete}: ${pkg.title}`, body: p.deleteConfirm, danger: true }))) return;
    startTransition(async () => {
      if (report(await deletePackage(pkg.id))) router.refresh();
    });
  };

  return (
    <>
      <AdminPageHeader title={p.title} actions={<Link href="/admin/packages/new" className="btn btn-sm btn-primary"><PlusIcon size={18} /> {p.add}</Link>} />
      {packages.length === 0 ? (
        <EmptyState title={p.empty} hint={p.emptyHint} action={<Link href="/admin/packages/new" className="btn btn-primary">{p.add}</Link>} />
      ) : (
        <ReorderableList
          table="packages"
          items={packages}
          render={(pkg) => (
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/admin/packages/${pkg.id}`} className="min-w-0 flex-1 hover:text-accent">
                <p className="flex items-center gap-2 truncate font-medium">
                  {pkg.title}
                  {pkg.featured && <StarIcon size={15} filled className="shrink-0 text-accent" />}
                </p>
                <p className="text-sm text-muted tabular-nums">{formatPrice(pkg.price, pkg.currency) ?? t.packages.priceOnRequest}</p>
              </Link>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className={cn("btn btn-icon btn-ghost", pkg.featured && "text-accent")}
                  aria-pressed={pkg.featured}
                  aria-label={c.featured}
                  title={c.featured}
                  onClick={() => flags(pkg, { featured: !pkg.featured })}
                  disabled={pending}
                >
                  <StarIcon size={18} filled={pkg.featured} />
                </button>
                <Toggle label={pkg.active ? c.visible : c.hidden} checked={pkg.active} onChange={(v) => flags(pkg, { active: v })} disabled={pending} />
                <Link href={`/admin/packages/${pkg.id}`} className="btn btn-icon btn-ghost" aria-label={`${c.edit} ${pkg.title}`}>
                  <EditIcon size={18} />
                </Link>
                <button type="button" className="btn btn-icon btn-ghost text-danger" aria-label={`${c.delete} ${pkg.title}`} onClick={() => remove(pkg)} disabled={pending}>
                  <TrashIcon size={18} />
                </button>
              </div>
            </div>
          )}
        />
      )}
    </>
  );
}
