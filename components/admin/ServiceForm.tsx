"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@/components/icons";
import { useFeedback } from "@/components/admin/Feedback";
import { AdminPageHeader, SaveBar, SubmitButton, TextArea, TextField, Toggle } from "@/components/admin/fields";
import { BackLink } from "@/components/admin/BackLink";
import { ImageField } from "@/components/admin/ImageField";
import { deleteService, saveService } from "@/lib/actions/services";
import { t } from "@/lib/i18n";
import type { Service } from "@/types/content";

const s = t.admin.services;
const c = t.admin.common;

export function ServiceForm({ service }: { service: Service | null }) {
  const router = useRouter();
  const { report, confirm } = useFeedback();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: service?.title ?? "",
    description: service?.description ?? "",
    image_path: service?.image_path ?? null,
    active: service?.active ?? true,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveService({ id: service?.id ?? null, ...form });
      if (report(result)) {
        setErrors({});
        if (!service && result.ok && result.data) router.replace(`/admin/services/${result.data.id}`);
        else router.refresh();
      } else if (!result.ok) setErrors(result.fieldErrors ?? {});
    });
  };

  const remove = async () => {
    if (!service || !(await confirm({ title: `${c.delete}: ${service.title}`, body: s.deleteConfirm, danger: true }))) return;
    startTransition(async () => {
      if (report(await deleteService(service.id))) router.replace("/admin/services");
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      <AdminPageHeader title={service ? s.edit : s.new} back={<BackLink href="/admin/services" label={s.title} />} />
      <div className="grid max-w-2xl gap-6">
        <TextField label={s.titleField} value={form.title} onValue={(v) => setForm({ ...form, title: v })} error={errors.title} maxLength={120} required />
        <TextArea label={s.description} value={form.description} onValue={(v) => setForm({ ...form, description: v })} error={errors.description} rows={4} maxLength={1500} optional />
        <ImageField label={s.image} value={form.image_path} onChange={(p) => setForm({ ...form, image_path: p })} folder="services" aspect="3 / 2" />
        <Toggle label={s.active} checked={form.active} onChange={(v) => setForm({ ...form, active: v })} />
      </div>
      <SaveBar>
        <SubmitButton pending={pending} label={service ? c.save : c.create} />
        {service && (
          <button type="button" className="btn btn-ghost ms-auto text-danger" onClick={remove} disabled={pending}>
            <TrashIcon size={18} /> {c.delete}
          </button>
        )}
      </SaveBar>
    </form>
  );
}
