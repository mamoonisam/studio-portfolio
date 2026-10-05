"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, CloseIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { useFeedback } from "@/components/admin/Feedback";
import { AdminPageHeader, SaveBar, SubmitButton, TextArea, TextField, Toggle } from "@/components/admin/fields";
import { BackLink } from "@/components/admin/BackLink";
import { ImageField } from "@/components/admin/ImageField";
import { deletePackage, savePackage } from "@/lib/actions/packages";
import { t } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils/format";
import type { Package } from "@/types/content";

const p = t.admin.packages;
const c = t.admin.common;

type FeatureRow = { key: string; text: string };
const newRow = (): FeatureRow => ({ key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: "" });

export function PackageForm({ pkg }: { pkg: Package | null }) {
  const router = useRouter();
  const { report, confirm } = useFeedback();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: pkg?.title ?? "",
    description: pkg?.description ?? "",
    price: pkg?.price === null || pkg?.price === undefined ? "" : String(pkg.price),
    currency: pkg?.currency ?? "",
    cover_image_path: pkg?.cover_image_path ?? null,
    featured: pkg?.featured ?? false,
    active: pkg?.active ?? true,
  });
  const [features, setFeatures] = useState<FeatureRow[]>(() =>
    (pkg?.features?.length ? pkg.features : [""]).map((text, i) => ({ key: `initial-${i}`, text })),
  );

  const setFeature = (key: string, text: string) => setFeatures((list) => list.map((f) => (f.key === key ? { ...f, text } : f)));
  const moveFeature = (index: number, delta: number) =>
    setFeatures((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const preview = formatPrice(form.price.trim() === "" || Number.isNaN(Number(form.price.replace(/[,\s]/g, ""))) ? null : Number(form.price.replace(/[,\s]/g, "")), form.currency);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await savePackage({ id: pkg?.id ?? null, ...form, features: features.map((f) => f.text) });
      if (report(result)) {
        setErrors({});
        if (!pkg && result.ok && result.data) router.replace(`/admin/packages/${result.data.id}`);
        else router.refresh();
      } else if (!result.ok) setErrors(result.fieldErrors ?? {});
    });
  };

  const remove = async () => {
    if (!pkg || !(await confirm({ title: `${c.delete}: ${pkg.title}`, body: p.deleteConfirm, danger: true }))) return;
    startTransition(async () => {
      if (report(await deletePackage(pkg.id))) router.replace("/admin/packages");
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      <AdminPageHeader title={pkg ? p.edit : p.new} back={<BackLink href="/admin/packages" label={p.title} />} />
      <div className="grid max-w-2xl gap-6">
        <TextField label={p.titleField} value={form.title} onValue={(v) => setForm({ ...form, title: v })} error={errors.title} maxLength={120} required />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <TextField
            label={p.price}
            hint={preview ? `${p.priceHint} — ${preview}` : p.priceHint}
            value={form.price}
            onValue={(v) => setForm({ ...form, price: v })}
            error={errors.price}
            inputMode="decimal"
            dir="ltr"
            maxLength={20}
            optional
          />
          <TextField label={p.currency} hint={p.currencyHint} value={form.currency} onValue={(v) => setForm({ ...form, currency: v })} error={errors.currency} maxLength={12} />
        </div>
        <TextArea label={p.description} value={form.description} onValue={(v) => setForm({ ...form, description: v })} error={errors.description} rows={3} maxLength={1500} optional />

        <fieldset className="grid gap-2">
          <legend className="field-label mb-2">{p.features}</legend>
          {features.map((f, index) => (
            <div key={f.key} className="flex items-center gap-1.5">
              <input
                className="input flex-1"
                value={f.text}
                onChange={(e) => setFeature(f.key, e.target.value)}
                placeholder={p.featurePlaceholder}
                maxLength={200}
                aria-label={`${p.features} ${index + 1}`}
              />
              <button type="button" className="btn btn-icon btn-ghost h-10 min-h-10 w-10 min-w-10" aria-label={c.moveUp} disabled={index === 0} onClick={() => moveFeature(index, -1)}>
                <ChevronUp size={18} />
              </button>
              <button type="button" className="btn btn-icon btn-ghost h-10 min-h-10 w-10 min-w-10" aria-label={c.moveDown} disabled={index === features.length - 1} onClick={() => moveFeature(index, 1)}>
                <ChevronDown size={18} />
              </button>
              <button type="button" className="btn btn-icon btn-ghost h-10 min-h-10 w-10 min-w-10 text-danger" aria-label={p.removeFeature} onClick={() => setFeatures((list) => list.filter((x) => x.key !== f.key))}>
                <CloseIcon size={18} />
              </button>
            </div>
          ))}
          {errors.features && <p className="field-error">{errors.features}</p>}
          <button type="button" className="btn btn-sm btn-outline justify-self-start" onClick={() => setFeatures((list) => [...list, newRow()])} disabled={features.length >= 40}>
            <PlusIcon size={16} /> {p.addFeature}
          </button>
        </fieldset>

        <ImageField label={p.image} value={form.cover_image_path} onChange={(path) => setForm({ ...form, cover_image_path: path })} folder="packages" aspect="16 / 10" />
        <Toggle label={p.featured} checked={form.featured} onChange={(v) => setForm({ ...form, featured: v })} />
        <Toggle label={p.active} checked={form.active} onChange={(v) => setForm({ ...form, active: v })} />
      </div>
      <SaveBar>
        <SubmitButton pending={pending} label={pkg ? c.save : c.create} />
        {pkg && (
          <button type="button" className="btn btn-ghost ms-auto text-danger" onClick={remove} disabled={pending}>
            <TrashIcon size={18} /> {c.delete}
          </button>
        )}
      </SaveBar>
    </form>
  );
}
