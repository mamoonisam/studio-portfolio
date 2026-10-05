"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Modal, useFeedback } from "@/components/admin/Feedback";
import { AdminPageHeader, EmptyState, SubmitButton, TextField, Toggle } from "@/components/admin/fields";
import { ReorderableList } from "@/components/admin/ReorderableList";
import { deleteVideo, saveVideo, toggleVideo } from "@/lib/actions/videos";
import { t } from "@/lib/i18n";
import { parseYouTube, youtubeThumbnail, youtubeWatchUrl } from "@/lib/utils/youtube";
import type { Video } from "@/types/content";

const v = t.admin.videos;
const c = t.admin.common;

interface Draft {
  url: string;
  title: string;
  vertical: boolean;
  featured: boolean;
  published: boolean;
}

const EMPTY: Draft = { url: "", title: "", vertical: false, featured: true, published: true };

export function VideosManager({ videos }: { videos: Video[] }) {
  const router = useRouter();
  const { report, confirm } = useFeedback();
  const [editing, setEditing] = useState<Video | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const parsed = parseYouTube(draft.url);

  const open = (row: Video | "new") => {
    setEditing(row);
    setDraft(
      row === "new"
        ? EMPTY
        : { url: youtubeWatchUrl(row.youtube_id), title: row.title, vertical: row.vertical, featured: row.featured, published: row.published },
    );
    setErrors({});
  };

  const setUrl = (url: string) => {
    const p = parseYouTube(url);
    // Shorts links are vertical: switch it on automatically (it can still be changed).
    setDraft((d) => ({ ...d, url, vertical: p?.short ? true : d.vertical }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveVideo({ id: editing && editing !== "new" ? editing.id : null, ...draft });
      if (report(result)) {
        setEditing(null);
        router.refresh();
      } else if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
      }
    });
  };

  const toggle = (row: Video, field: "featured" | "published", value: boolean) => {
    startTransition(async () => {
      if (report(await toggleVideo({ id: row.id, field, value }))) router.refresh();
    });
  };

  const remove = async (row: Video) => {
    const ok = await confirm({ title: `${c.delete}: ${row.title}`, body: v.deleteConfirm, danger: true });
    if (!ok) return;
    startTransition(async () => {
      if (report(await deleteVideo(row.id))) router.refresh();
    });
  };

  return (
    <>
      <AdminPageHeader
        title={v.title}
        actions={
          <button type="button" className="btn btn-sm btn-primary" onClick={() => open("new")}>
            <PlusIcon size={18} /> {v.add}
          </button>
        }
      />

      {videos.length === 0 ? (
        <EmptyState
          title={v.empty}
          hint={v.emptyHint}
          action={<button type="button" className="btn btn-primary" onClick={() => open("new")}>{v.add}</button>}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">{v.tip}</p>
          <ReorderableList
            table="videos"
            items={videos}
            render={(row) => (
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={youtubeWatchUrl(row.youtube_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-surface-2"
                  aria-label={`${v.preview}: ${row.title}`}
                >
                  <Image src={youtubeThumbnail(row.youtube_id)} alt="" fill sizes="96px" className="object-cover" />
                </a>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{row.title}</p>
                  <p className="flex flex-wrap gap-x-3 text-sm text-muted">
                    {!row.published && <span className="text-danger">{v.hidden}</span>}
                    {row.published && row.featured && <span className="text-accent">{v.onHome}</span>}
                    {row.vertical && <span>Shorts</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => toggle(row, "published", !row.published)}
                    disabled={pending}
                  >
                    {row.published ? c.visible : c.hidden}
                  </button>
                  <button type="button" className="btn btn-icon btn-ghost" aria-label={`${c.edit} ${row.title}`} onClick={() => open(row)}>
                    <EditIcon size={18} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost text-danger"
                    aria-label={`${c.delete} ${row.title}`}
                    onClick={() => remove(row)}
                    disabled={pending}
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </div>
            )}
          />
        </>
      )}

      {editing && (
        <Modal title={editing === "new" ? v.add : v.edit} onClose={() => setEditing(null)} size="sm">
          <form onSubmit={submit} className="grid gap-5" noValidate>
            <TextField
              label={v.url}
              value={draft.url}
              onValue={setUrl}
              hint={v.urlHint}
              error={errors.url}
              dir="ltr"
              inputMode="url"
              placeholder="https://youtu.be/…"
              required
              autoFocus
            />
            {parsed && (
              <div className={draft.vertical ? "relative mx-auto aspect-[9/16] w-40 overflow-hidden rounded-xl bg-surface-2" : "relative aspect-video overflow-hidden rounded-xl bg-surface-2"}>
                <Image src={youtubeThumbnail(parsed.id)} alt="" fill sizes="400px" className="object-cover" />
              </div>
            )}
            <TextField
              label={v.titleLabel}
              value={draft.title}
              onValue={(title) => setDraft((d) => ({ ...d, title }))}
              error={errors.title}
              maxLength={200}
              required
            />
            <Toggle label={v.vertical} hint={v.verticalHint} checked={draft.vertical} onChange={(vertical) => setDraft((d) => ({ ...d, vertical }))} />
            <Toggle label={v.featured} checked={draft.featured} onChange={(featured) => setDraft((d) => ({ ...d, featured }))} />
            <Toggle label={v.published} checked={draft.published} onChange={(published) => setDraft((d) => ({ ...d, published }))} />
            <div className="flex gap-2">
              <SubmitButton pending={pending} label={editing === "new" ? c.add : c.save} />
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>{c.cancel}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
