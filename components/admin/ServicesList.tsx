"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { useFeedback } from "@/components/admin/Feedback";
import { AdminPageHeader, EmptyState, Toggle } from "@/components/admin/fields";
import { ReorderableList } from "@/components/admin/ReorderableList";
import { Photo } from "@/components/ui/Photo";
import { deleteService, toggleService } from "@/lib/actions/services";
import { t } from "@/lib/i18n";
import type { Service } from "@/types/content";

const s = t.admin.services;
const c = t.admin.common;

export function ServicesList({ services }: { services: Service[] }) {
  const router = useRouter();
  const { report, confirm } = useFeedback();
  const [pending, startTransition] = useTransition();

  const remove = async (svc: Service) => {
    if (!(await confirm({ title: `${c.delete}: ${svc.title}`, body: s.deleteConfirm, danger: true }))) return;
    startTransition(async () => {
      if (report(await deleteService(svc.id))) router.refresh();
    });
  };

  const toggle = (svc: Service, active: boolean) =>
    startTransition(async () => {
      if (report(await toggleService(svc.id, active))) router.refresh();
    });

  return (
    <>
      <AdminPageHeader
        title={s.title}
        actions={<Link href="/admin/services/new" className="btn btn-sm btn-primary"><PlusIcon size={18} /> {s.add}</Link>}
      />
      {services.length === 0 ? (
        <EmptyState title={s.empty} hint={s.emptyHint} action={<Link href="/admin/services/new" className="btn btn-primary">{s.add}</Link>} />
      ) : (
        <ReorderableList
          table="services"
          items={services}
          render={(svc) => (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {svc.image_path && <Photo path={svc.image_path} alt="" fill sizes="80px" quality={60} />}
              </div>
              <Link href={`/admin/services/${svc.id}`} className="min-w-0 flex-1 hover:text-accent">
                <p className="truncate font-medium">{svc.title}</p>
                {svc.description && <p className="truncate text-sm text-muted">{svc.description}</p>}
              </Link>
              <div className="flex items-center gap-1">
                <Toggle label={svc.active ? c.visible : c.hidden} checked={svc.active} onChange={(v) => toggle(svc, v)} disabled={pending} />
                <Link href={`/admin/services/${svc.id}`} className="btn btn-icon btn-ghost" aria-label={`${c.edit} ${svc.title}`}>
                  <EditIcon size={18} />
                </Link>
                <button type="button" className="btn btn-icon btn-ghost text-danger" aria-label={`${c.delete} ${svc.title}`} onClick={() => remove(svc)} disabled={pending}>
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
