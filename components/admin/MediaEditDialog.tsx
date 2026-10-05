"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, useFeedback } from "@/components/admin/Feedback";
import { SelectField, TextArea, TextField, Toggle } from "@/components/admin/fields";
import { Photo } from "@/components/ui/Photo";
import { CopyIcon, SpinnerIcon, TrashIcon } from "@/components/icons";
import { deleteMedia, updateMedia } from "@/lib/actions/media";
import { t } from "@/lib/i18n";
import { formatBytes, formatDateTime } from "@/lib/utils/format";
import { storageUrl } from "@/lib/utils/storage";
import type { MediaWithAlbums } from "@/lib/data/admin";
import type { Album, Category } from "@/types/content";

const m = t.admin.media;
const c = t.admin.common;

interface Props {
  media: MediaWithAlbums;
  categories: Pick<Category, "id" | "name">[];
  albums: Pick<Album, "id" | "title" | "status">[];
  onClose: () => void;
}

export function MediaEditDialog({ media, categories, albums, onClose }: Props) {
  const router = useRouter();
  const { report, confirm } = useFeedback();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: media.title ?? "",
    alt_text: media.alt_text ?? "",
    category_id: media.category_id ?? "",
    featured: media.featured,
    published: media.published,
    album_ids: media.album_ids,
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = () =>
    startTransition(async () => {
      const result = await updateMedia({ id: media.id, ...form });
      if (report(result)) {
        router.refresh();
        onClose();
      }
    });

  const remove = async () => {
    const ok = await confirm({ title: m.deleteOne, body: m.deleteConfirm, danger: true });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteMedia({ ids: [media.id] });
      if (report(result)) {
        router.refresh();
        onClose();
      }
    });
  };

  const copyLink = async () => {
    const url = storageUrl(media.storage_path);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      report({ ok: true }, t.contact.copied);
    } catch {
      /* ignore */
    }
  };

  return (
    <Modal
      title={m.editTitle}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-primary" onClick={save} disabled={pending}>
            {pending ? <><SpinnerIcon /> {c.saving}</> : c.save}
          </button>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={pending}>{c.cancel}</button>
          <button type="button" className="btn btn-ghost ms-auto text-danger" onClick={remove} disabled={pending}>
            <TrashIcon size={18} /> {m.deleteOne}
          </button>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-xl bg-surface-2" style={{ aspectRatio: media.width && media.height ? `${media.width} / ${media.height}` : "4 / 3" }}>
            <Photo path={media.storage_path} alt={media.alt_text || ""} fill blurDataURL={media.blur_data_url} sizes="(min-width: 768px) 40vw, 90vw" imgClassName="object-contain" />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {media.width && media.height ? (
              <>
                <dt className="text-muted">{m.dimensions}</dt>
                <dd dir="ltr" className="text-end tabular-nums">{media.width} × {media.height}</dd>
              </>
            ) : null}
            {media.size_bytes ? (
              <>
                <dt className="text-muted">{m.size}</dt>
                <dd dir="ltr" className="text-end tabular-nums">{formatBytes(media.size_bytes)}</dd>
              </>
            ) : null}
            <dt className="text-muted">{m.uploadedAt}</dt>
            <dd className="text-end">{formatDateTime(media.created_at)}</dd>
          </dl>
          <button type="button" className="btn btn-sm btn-ghost mt-2" onClick={copyLink}>
            <CopyIcon size={16} /> {m.copyLink}
          </button>
        </div>

        <div className="grid content-start gap-5">
          <TextField label={m.titleField} value={form.title} onValue={(v) => set("title", v)} maxLength={200} optional />
          <TextArea label={m.altField} hint={m.altHint} value={form.alt_text} onValue={(v) => set("alt_text", v)} maxLength={300} rows={2} optional />
          <SelectField
            label={m.category}
            value={form.category_id}
            onValue={(v) => set("category_id", v)}
            options={[{ value: "", label: c.none }, ...categories.map((x) => ({ value: x.id, label: x.name }))]}
          />
          {albums.length > 0 && (
            <fieldset className="grid gap-2">
              <legend className="field-label mb-2">{m.albums}</legend>
              <div className="grid max-h-44 gap-1 overflow-y-auto rounded-xl border border-line p-2">
                {albums.map((a) => {
                  const checked = form.album_ids.includes(a.id);
                  return (
                    <label key={a.id} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-surface-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[var(--accent)]"
                        checked={checked}
                        onChange={(e) =>
                          set("album_ids", e.target.checked ? [...form.album_ids, a.id] : form.album_ids.filter((id) => id !== a.id))
                        }
                      />
                      <span className="flex-1 text-[0.95rem]">{a.title}</span>
                      {a.status === "draft" && <span className="text-xs text-muted">{t.admin.albums.draft}</span>}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
          <Toggle label={m.featuredField} checked={form.featured} onChange={(v) => set("featured", v)} />
          <Toggle label={m.publishedField} checked={form.published} onChange={(v) => set("published", v)} />
        </div>
      </div>
    </Modal>
  );
}
