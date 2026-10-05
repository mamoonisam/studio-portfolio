"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronBack, ChevronForward, CloseIcon, ExternalIcon, ImageIcon, PlusIcon, StarIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { Modal, useFeedback } from "@/components/admin/Feedback";
import { AdminPageHeader, SaveBar, SelectField, SubmitButton, TextArea, TextField, Toggle } from "@/components/admin/fields";
import { BackLink } from "@/components/admin/BackLink";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { Photo } from "@/components/ui/Photo";
import { deleteAlbum, saveAlbum, setAlbumCover, setAlbumMedia } from "@/lib/actions/albums";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import type { Album, Category, Media } from "@/types/content";

const a = t.admin.albums;
const c = t.admin.common;

type LibraryItem = Pick<Media, "id" | "storage_path" | "blur_data_url" | "title" | "category_id">;

interface Props {
  album: Album | null;
  media: Media[];
  categories: Pick<Category, "id" | "name">[];
  library: LibraryItem[];
}

export function AlbumEditor({ album, media, categories, library }: Props) {
  const router = useRouter();
  const { report, confirm } = useFeedback();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: album?.title ?? "",
    slug: album?.slug ?? "",
    description: album?.description ?? "",
    category_id: album?.category_id ?? "",
    event_date: album?.event_date ?? "",
    published: album ? album.status === "published" : false,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveAlbum({
        id: album?.id ?? null,
        title: form.title,
        slug: album ? form.slug : "",
        description: form.description,
        category_id: form.category_id,
        cover_media_id: album?.cover_media_id ?? null,
        status: form.published ? "published" : "draft",
        event_date: form.event_date,
      });
      if (report(result)) {
        setErrors({});
        if (!album && result.ok && result.data) router.replace(`/admin/albums/${result.data.id}`);
        else router.refresh();
      } else if (!result.ok) setErrors(result.fieldErrors ?? {});
    });
  };

  const remove = async () => {
    if (!album || !(await confirm({ title: `${c.delete}: ${album.title}`, body: a.deleteConfirm, danger: true }))) return;
    startTransition(async () => {
      if (report(await deleteAlbum(album.id))) router.replace("/admin/albums");
    });
  };

  return (
    <>
      <form onSubmit={submit} noValidate>
        <AdminPageHeader
          title={album ? a.edit : a.new}
          back={<BackLink href="/admin/albums" label={a.title} />}
          actions={
            album?.status === "published" ? (
              <Link href={`/portfolio/${encodeURIComponent(album.slug)}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                <ExternalIcon size={16} /> {a.view}
              </Link>
            ) : undefined
          }
        />
        <div className="grid max-w-2xl gap-6">
          <TextField label={a.titleField} value={form.title} onValue={(v) => setForm({ ...form, title: v })} error={errors.title} maxLength={200} required placeholder="حفل زفاف أحمد وسارة" />
          {album && (
            <TextField label={a.slug} hint={a.slugHint} value={form.slug} onValue={(v) => setForm({ ...form, slug: v })} error={errors.slug} maxLength={120} dir="auto" />
          )}
          <TextArea label={a.description} value={form.description} onValue={(v) => setForm({ ...form, description: v })} rows={3} maxLength={3000} optional />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label={a.category}
              value={form.category_id}
              onValue={(v) => setForm({ ...form, category_id: v })}
              options={[{ value: "", label: c.none }, ...categories.map((x) => ({ value: x.id, label: x.name }))]}
            />
            <TextField label={a.eventDate} type="date" value={form.event_date} onValue={(v) => setForm({ ...form, event_date: v })} optional />
          </div>
          <Toggle label={`${a.status}: ${form.published ? a.published : a.draft}`} checked={form.published} onChange={(v) => setForm({ ...form, published: v })} />
        </div>
        <SaveBar>
          <SubmitButton pending={pending} label={album ? c.save : c.create} />
          {album && (
            <button type="button" className="btn btn-ghost ms-auto text-danger" onClick={remove} disabled={pending}>
              <TrashIcon size={18} /> {c.delete}
            </button>
          )}
        </SaveBar>
      </form>

      {album && <AlbumPhotos album={album} media={media} categories={categories} library={library} />}
    </>
  );
}

function AlbumPhotos({ album, media, library }: { album: Album; media: Media[]; categories: Pick<Category, "id" | "name">[]; library: LibraryItem[] }) {
  const router = useRouter();
  const { report } = useFeedback();
  const [source, setSource] = useState(media);
  const [ids, setIds] = useState(() => media.map((m) => m.id));
  const [picker, setPicker] = useState(false);
  const [uploader, setUploader] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fresh server data (after refresh) replaces the local list.
  if (source !== media) {
    setSource(media);
    setIds(media.map((m) => m.id));
  }

  const byId = useMemo(() => {
    const map = new Map<string, LibraryItem>();
    for (const l of library) map.set(l.id, l);
    for (const m of media) map.set(m.id, m);
    return map;
  }, [library, media]);

  const cover = album.cover_media_id ?? ids[0] ?? null;

  const persist = (next: string[]) => {
    setIds(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const result = await setAlbumMedia({ album_id: album.id, media_ids: next });
      if (report(result)) router.refresh();
    }, 500);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  };

  const makeCover = async (id: string) => {
    if (report(await setAlbumCover(album.id, id))) router.refresh();
  };

  return (
    <section className="mt-12 border-t border-line pt-8" aria-labelledby="album-photos">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="album-photos" className="font-sans text-xl font-semibold">
          {a.photos} <span className="text-base font-normal text-muted">({ids.length})</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm btn-outline" onClick={() => setPicker(true)}>
            <PlusIcon size={16} /> {a.addPhotos}
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setUploader((v) => !v)}>
            <UploadIcon size={16} /> {a.uploadPhotos}
          </button>
        </div>
      </div>

      {uploader && (
        <div className="mb-6">
          <MediaUploader albumId={album.id} categoryId={album.category_id} compact onFinished={() => setUploader(false)} />
        </div>
      )}

      {ids.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-muted">
          <ImageIcon size={28} className="mx-auto mb-2" />
          {a.noPhotos}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ids.map((id, index) => {
            const item = byId.get(id);
            if (!item) return null;
            const isCover = id === cover;
            return (
              <li key={id} className="overflow-hidden rounded-xl border border-line bg-surface">
                <div className="relative aspect-square bg-surface-2">
                  <Photo path={item.storage_path} alt="" fill blurDataURL={item.blur_data_url} sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw" quality={60} />
                  <span className="absolute start-1.5 top-1.5 rounded-full bg-black/60 px-2 text-xs leading-6 text-white tabular-nums">{index + 1}</span>
                  {isCover && (
                    <span className="absolute end-1.5 top-1.5 flex items-center gap-1 rounded-full bg-accent px-2 text-xs leading-6 text-accent-ink">
                      <StarIcon size={12} filled /> {a.isCover}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1 p-1">
                  <button type="button" className="btn btn-icon btn-ghost h-9 min-h-9 w-9 min-w-9" aria-label={c.moveUp} disabled={index === 0} onClick={() => move(index, -1)}>
                    <ChevronBack size={18} />
                  </button>
                  <button
                    type="button"
                    className={cn("btn btn-icon btn-ghost h-9 min-h-9 w-9 min-w-9", isCover && "text-accent")}
                    aria-label={a.setCover}
                    title={a.setCover}
                    disabled={isCover && Boolean(album.cover_media_id)}
                    onClick={() => makeCover(id)}
                  >
                    <StarIcon size={18} filled={isCover} />
                  </button>
                  <button type="button" className="btn btn-icon btn-ghost h-9 min-h-9 w-9 min-w-9 text-danger" aria-label={a.removePhoto} title={a.removePhoto} onClick={() => persist(ids.filter((x) => x !== id))}>
                    <CloseIcon size={18} />
                  </button>
                  <button type="button" className="btn btn-icon btn-ghost h-9 min-h-9 w-9 min-w-9" aria-label={c.moveDown} disabled={index === ids.length - 1} onClick={() => move(index, 1)}>
                    <ChevronForward size={18} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {picker && (
        <PhotoPicker
          library={library.filter((l) => !ids.includes(l.id))}
          onClose={() => setPicker(false)}
          onAdd={(chosen) => {
            setPicker(false);
            persist([...ids, ...chosen]);
          }}
        />
      )}
    </section>
  );
}

function PhotoPicker({ library, onClose, onAdd }: { library: LibraryItem[]; onClose: () => void; onAdd: (ids: string[]) => void }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const toggle = (id: string) => setChosen((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  return (
    <Modal
      title={a.pickerTitle}
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={chosen.length === 0} onClick={() => onAdd(chosen)}>
            {a.pickerAdd(chosen.length)}
          </button>
          <button type="button" className="btn btn-outline" onClick={onClose}>{c.cancel}</button>
        </div>
      }
    >
      {library.length === 0 ? (
        <p className="py-10 text-center text-muted">{a.pickerEmpty}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {library.map((item) => {
            const index = chosen.indexOf(item.id);
            const isChosen = index >= 0;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={isChosen}
                  aria-label={item.title || c.select}
                  onClick={() => toggle(item.id)}
                  className={cn("relative block aspect-square w-full overflow-hidden rounded-lg bg-surface-2", isChosen && "ring-[3px] ring-accent")}
                >
                  <Photo path={item.storage_path} alt="" fill blurDataURL={item.blur_data_url} sizes="(min-width: 1024px) 16vw, 33vw" quality={60} />
                  {isChosen && (
                    <span className="absolute bottom-1.5 start-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-ink tabular-nums">
                      {index + 1}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
