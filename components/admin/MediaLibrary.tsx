"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronBack, ChevronForward, CloseIcon, EyeOffIcon, StarIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { useFeedback } from "@/components/admin/Feedback";
import { AdminPageHeader, EmptyState } from "@/components/admin/fields";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { MediaEditDialog } from "@/components/admin/MediaEditDialog";
import { Photo } from "@/components/ui/Photo";
import { addMediaToAlbum, bulkUpdateMedia, deleteMedia, reorderItems } from "@/lib/actions/media";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import type { MediaWithAlbums } from "@/lib/data/admin";
import type { Album, Category } from "@/types/content";

const m = t.admin.media;
const c = t.admin.common;

interface Props {
  media: MediaWithAlbums[];
  categories: Pick<Category, "id" | "name">[];
  albums: Pick<Album, "id" | "title" | "status">[];
  startWithUpload: boolean;
}

export function MediaLibrary({ media, categories, albums, startWithUpload }: Props) {
  const router = useRouter();
  const { report, confirm } = useFeedback();
  const [pending, startTransition] = useTransition();
  const [showUpload, setShowUpload] = useState(startWithUpload || media.length === 0);
  const [category, setCategory] = useState("");
  const [album, setAlbum] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [order, setOrder] = useState<string[] | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const byId = useMemo(() => new Map(media.map((x) => [x.id, x])), [media]);

  const filtered = useMemo(() => {
    if (reordering) return (order ?? media.map((x) => x.id)).map((id) => byId.get(id)).filter((x): x is MediaWithAlbums => Boolean(x));
    return media.filter(
      (x) =>
        (!category || (category === "none" ? !x.category_id : x.category_id === category)) &&
        (!album || x.album_ids.includes(album)) &&
        (!featuredOnly || x.featured),
    );
  }, [media, category, album, featuredOnly, reordering, order, byId]);

  const editing = editingId ? byId.get(editingId) ?? null : null;

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const clearSelection = () => {
    setSelected(new Set());
    setSelecting(false);
  };

  const runBulk = (fn: () => Promise<Parameters<typeof report>[0]>) =>
    startTransition(async () => {
      const result = await fn();
      if (report(result)) {
        clearSelection();
        router.refresh();
      }
    });

  const bulkDelete = async () => {
    const ids = [...selected];
    const ok = await confirm({ title: m.deleteMany(ids.length), body: m.deleteManyConfirm(ids.length), danger: true });
    if (ok) runBulk(() => deleteMedia({ ids }));
  };

  const move = (index: number, delta: number) => {
    const ids = order ?? media.map((x) => x.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const result = await reorderItems({ table: "media", ids: next });
      report(result);
    }, 700);
  };

  const finishReorder = () => {
    setReordering(false);
    setOrder(null);
    router.refresh();
  };

  return (
    <>
      <AdminPageHeader
        title={m.title}
        actions={
          <>
            {media.length > 1 && !selecting && (
              <button type="button" className="btn btn-sm btn-outline" onClick={() => (reordering ? finishReorder() : setReordering(true))}>
                {reordering ? m.reorderDone : m.reorder}
              </button>
            )}
            {media.length > 0 && !reordering && (
              <button type="button" className="btn btn-sm btn-outline" onClick={() => (selecting ? clearSelection() : setSelecting(true))}>
                {selecting ? c.clearSelection : c.select}
              </button>
            )}
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowUpload((v) => !v)}>
              <UploadIcon size={18} /> {m.upload}
            </button>
          </>
        }
      />

      {showUpload && (
        <div className="mb-8">
          <MediaUploader onFinished={() => setShowUpload(media.length === 0)} />
        </div>
      )}

      {media.length === 0 ? (
        !showUpload && <EmptyState title={m.empty} hint={m.emptyHint} />
      ) : (
        <>
          {!reordering && (
            <div className="mb-5 flex flex-wrap items-end gap-3">
              <label className="field min-w-40 flex-1 sm:flex-none">
                <span className="field-hint">{m.filterCategory}</span>
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">{c.all}</option>
                  <option value="none">{c.none}</option>
                  {categories.map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </label>
              {albums.length > 0 && (
                <label className="field min-w-40 flex-1 sm:flex-none">
                  <span className="field-hint">{m.filterAlbum}</span>
                  <select className="input" value={album} onChange={(e) => setAlbum(e.target.value)}>
                    <option value="">{c.all}</option>
                    {albums.map((x) => (
                      <option key={x.id} value={x.id}>{x.title}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex min-h-[2.875rem] cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-line bg-surface px-3">
                <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />
                <span className="text-[0.95rem]">{m.filterFeatured}</span>
              </label>
              <p className="ms-auto text-sm text-muted tabular-nums">{filtered.length} / {media.length}</p>
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState title={t.portfolio.emptyCategory} />
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {filtered.map((x, index) => {
                const isSelected = selected.has(x.id);
                return (
                  <li key={x.id} className="relative">
                    <button
                      type="button"
                      onClick={() => (reordering ? undefined : selecting ? toggleSelect(x.id) : setEditingId(x.id))}
                      aria-pressed={selecting ? isSelected : undefined}
                      aria-label={x.title || x.alt_text || m.editTitle}
                      className={cn(
                        "relative block aspect-square w-full overflow-hidden rounded-lg bg-surface-2 outline-offset-2",
                        isSelected && "ring-[3px] ring-accent",
                        reordering && "cursor-default",
                      )}
                    >
                      <Photo path={x.storage_path} alt="" fill blurDataURL={x.blur_data_url} sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw" quality={60} />
                      <span className="absolute inset-x-1 top-1 flex justify-between">
                        {x.featured ? (
                          <span className="rounded-full bg-black/55 p-1 text-white" title={c.featured}><StarIcon size={14} filled /></span>
                        ) : <span />}
                        {!x.published ? (
                          <span className="rounded-full bg-black/55 p-1 text-white" title={c.hidden}><EyeOffIcon size={14} /></span>
                        ) : null}
                      </span>
                      {selecting && (
                        <span className={cn("absolute bottom-1.5 start-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs", isSelected ? "border-accent bg-accent text-accent-ink" : "border-white bg-black/30")}>
                          {isSelected ? "✓" : ""}
                        </span>
                      )}
                    </button>
                    {reordering && (
                      <div className="mt-1 flex justify-between">
                        <button type="button" className="btn btn-icon btn-ghost h-9 min-h-9 w-9 min-w-9" aria-label={c.moveUp} disabled={index === 0} onClick={() => move(index, -1)}>
                          <ChevronBack size={18} />
                        </button>
                        <button type="button" className="btn btn-icon btn-ghost h-9 min-h-9 w-9 min-w-9" aria-label={c.moveDown} disabled={index === filtered.length - 1} onClick={() => move(index, 1)}>
                          <ChevronForward size={18} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* Bulk actions bar */}
      {selecting && selected.size > 0 && (
        <div
          className="fixed inset-x-0 bottom-14 z-40 border-t border-line bg-surface/97 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:bottom-0 lg:start-64"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
            <span className="me-2 text-sm font-medium">{c.selected(selected.size)}</span>
            <button type="button" className="btn btn-sm btn-outline" disabled={pending} onClick={() => runBulk(() => bulkUpdateMedia({ ids: [...selected], featured: true }))}>
              <StarIcon size={16} /> {m.bulkFeature}
            </button>
            <button type="button" className="btn btn-sm btn-outline" disabled={pending} onClick={() => runBulk(() => bulkUpdateMedia({ ids: [...selected], featured: false }))}>
              {m.bulkUnfeature}
            </button>
            <select
              className="input h-[2.375rem] min-h-0 w-auto py-1 text-sm"
              aria-label={m.bulkCategory}
              value=""
              disabled={pending}
              onChange={(e) => {
                const v = e.target.value;
                if (v) runBulk(() => bulkUpdateMedia({ ids: [...selected], set_category: true, category_id: v === "none" ? null : v }));
              }}
            >
              <option value="">{m.bulkCategory}</option>
              <option value="none">{c.none}</option>
              {categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            {albums.length > 0 && (
              <select
                className="input h-[2.375rem] min-h-0 w-auto py-1 text-sm"
                aria-label={m.bulkAlbum}
                value=""
                disabled={pending}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) runBulk(() => addMediaToAlbum(v, [...selected]));
                }}
              >
                <option value="">{m.bulkAlbum}</option>
                {albums.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
              </select>
            )}
            <button type="button" className="btn btn-sm btn-danger" disabled={pending} onClick={bulkDelete}>
              <TrashIcon size={16} /> {c.delete}
            </button>
            <button type="button" className="btn btn-icon btn-ghost ms-auto" aria-label={c.clearSelection} onClick={clearSelection}>
              <CloseIcon size={18} />
            </button>
          </div>
        </div>
      )}

      {editing && <MediaEditDialog key={editing.id} media={editing} categories={categories} albums={albums} onClose={() => setEditingId(null)} />}
    </>
  );
}
