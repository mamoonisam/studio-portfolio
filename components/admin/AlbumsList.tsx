"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { EditIcon, ExternalIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { useFeedback } from "@/components/admin/Feedback";
import { AdminPageHeader, EmptyState } from "@/components/admin/fields";
import { ReorderableList } from "@/components/admin/ReorderableList";
import { Photo } from "@/components/ui/Photo";
import { deleteAlbum } from "@/lib/actions/albums";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import type { AlbumWithCover } from "@/types/content";

const a = t.admin.albums;
const c = t.admin.common;

export function AlbumsList({ albums }: { albums: AlbumWithCover[] }) {
  const router = useRouter();
  const { report, confirm } = useFeedback();
  const [pending, startTransition] = useTransition();

  const remove = async (album: AlbumWithCover) => {
    if (!(await confirm({ title: `${c.delete}: ${album.title}`, body: a.deleteConfirm, danger: true }))) return;
    startTransition(async () => {
      if (report(await deleteAlbum(album.id))) router.refresh();
    });
  };

  return (
    <>
      <AdminPageHeader title={a.title} actions={<Link href="/admin/albums/new" className="btn btn-sm btn-primary"><PlusIcon size={18} /> {a.add}</Link>} />
      {albums.length === 0 ? (
        <EmptyState title={a.empty} hint={a.emptyHint} action={<Link href="/admin/albums/new" className="btn btn-primary">{a.add}</Link>} />
      ) : (
        <ReorderableList
          table="albums"
          items={albums}
          render={(album) => (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {album.cover && <Photo path={album.cover.storage_path} alt="" fill sizes="64px" quality={60} />}
              </div>
              <Link href={`/admin/albums/${album.id}`} className="min-w-0 flex-1 hover:text-accent">
                <p className="truncate font-medium">{album.title}</p>
                <p className="flex items-center gap-2 text-sm text-muted">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs", album.status === "published" ? "bg-success/15 text-success" : "bg-surface-2 text-muted")}>
                    {album.status === "published" ? a.published : a.draft}
                  </span>
                  {t.portfolio.photoCount(album.photo_count)}
                </p>
              </Link>
              <div className="flex items-center gap-1">
                {album.status === "published" && (
                  <Link href={`/portfolio/${encodeURIComponent(album.slug)}`} target="_blank" className="btn btn-icon btn-ghost" aria-label={a.view} title={a.view}>
                    <ExternalIcon size={18} />
                  </Link>
                )}
                <Link href={`/admin/albums/${album.id}`} className="btn btn-icon btn-ghost" aria-label={`${c.edit} ${album.title}`}>
                  <EditIcon size={18} />
                </Link>
                <button type="button" className="btn btn-icon btn-ghost text-danger" aria-label={`${c.delete} ${album.title}`} onClick={() => remove(album)} disabled={pending}>
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
