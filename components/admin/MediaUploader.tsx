"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertIcon, CheckIcon, CloseIcon, SpinnerIcon, UploadIcon } from "@/components/icons";
import { Toggle } from "@/components/admin/fields";
import { useFeedback } from "@/components/admin/Feedback";
import { discardUpload, registerMedia } from "@/lib/actions/media";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_MB, UPLOAD_CONCURRENCY } from "@/lib/config/media";
import { UploadError, newStoragePath, prepareImage, uploadToStorage } from "@/lib/upload/client";
import { t } from "@/lib/i18n";
import { formatBytes } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Media } from "@/types/content";

const m = t.admin.media;

type Status = "waiting" | "processing" | "uploading" | "saving" | "done" | "error";

interface QueueItem {
  key: string;
  file: File;
  preview: string;
  status: Status;
  progress: number;
  error?: string;
  retryable?: boolean;
}

interface Props {
  categoryId?: string | null;
  albumId?: string | null;
  /** Called once a batch finishes, with the photos that were saved. */
  onFinished?: (uploaded: Media[]) => void;
  compact?: boolean;
}

const ACTIVE: Status[] = ["waiting", "processing", "uploading", "saving"];

export function MediaUploader({ categoryId, albumId, onFinished, compact }: Props) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [optimize, setOptimize] = useState(true);
  const [dragging, setDragging] = useState(false);
  const queue = useRef<QueueItem[]>([]);
  const active = useRef(0);
  const batch = useRef<{ uploaded: Media[]; keys: Set<string> }>({ uploaded: [], keys: new Set() });
  const inputRef = useRef<HTMLInputElement>(null);
  const optimizeRef = useRef(optimize);
  useEffect(() => {
    optimizeRef.current = optimize;
  }, [optimize]);

  const commit = useCallback(() => setItems([...queue.current]), []);
  const patch = useCallback(
    (key: string, p: Partial<QueueItem>) => {
      queue.current = queue.current.map((i) => (i.key === key ? { ...i, ...p } : i));
      commit();
    },
    [commit],
  );

  const busy = items.some((i) => ACTIVE.includes(i.status));

  // Warn before leaving while uploads are running
  useEffect(() => {
    if (!busy) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = m.leaveWarning;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [busy]);

  // Free preview memory on unmount
  useEffect(() => () => queue.current.forEach((i) => URL.revokeObjectURL(i.preview)), []);

  const finishIfIdle = useCallback(() => {
    if (queue.current.some((i) => ACTIVE.includes(i.status))) return;
    const { uploaded, keys } = batch.current;
    const total = keys.size;
    if (total === 0) return;
    if (uploaded.length === total) toast(m.uploaded);
    else if (uploaded.length > 0) toast(m.uploadedSome(uploaded.length, total), "error");
    else toast(m.uploadFailed, "error");
    onFinished?.(uploaded);
    batch.current = { uploaded: [], keys: new Set() };
    router.refresh();
  }, [onFinished, router, toast]);

  const processOne = useCallback(
    async (item: QueueItem) => {
      let uploadedPath: string | null = null;
      try {
        patch(item.key, { status: "processing", progress: 0, error: undefined });
        const prepared = await prepareImage(item.file, optimizeRef.current);
        const path = newStoragePath("portfolio", prepared.type);

        patch(item.key, { status: "uploading" });
        await uploadToStorage(path, prepared.blob, prepared.type, (f) => patch(item.key, { progress: f }));
        uploadedPath = path;

        patch(item.key, { status: "saving", progress: 1 });
        const result = await registerMedia({
          storage_path: path,
          mime_type: prepared.type,
          size_bytes: prepared.blob.size,
          width: prepared.width,
          height: prepared.height,
          blur_data_url: prepared.blurDataURL,
          title: item.file.name.replace(/\.[^.]+$/, "").slice(0, 200),
          category_id: categoryId ?? null,
          album_id: albumId ?? null,
        });
        if (!result.ok) {
          if (result.code === "unauthorized") throw new UploadError(result.error, false);
          throw new UploadError(result.error);
        }
        if (!result.data) throw new UploadError(m.uploadFailed);
        batch.current.uploaded.push(result.data);
        patch(item.key, { status: "done" });
      } catch (error) {
        if (uploadedPath) void discardUpload(uploadedPath);
        const message = error instanceof UploadError ? error.message : m.uploadFailed;
        const retryable = error instanceof UploadError ? error.retryable : true;
        patch(item.key, { status: "error", error: message, retryable });
      }
    },
    [albumId, categoryId, patch],
  );

  const pump = useCallback(() => {
    // Inner named function so a finished upload can start the next one
    // without referencing `pump` before its declaration.
    function run() {
      while (active.current < UPLOAD_CONCURRENCY) {
        const next = queue.current.find((i) => i.status === "waiting");
        if (!next) break;
        active.current += 1;
        // Mark immediately so the loop doesn't pick it twice
        queue.current = queue.current.map((i) => (i.key === next.key ? { ...i, status: "processing" } : i));
        void processOne(next).finally(() => {
          active.current -= 1;
          run();
          finishIfIdle();
        });
      }
      commit();
    }
    run();
  }, [commit, finishIfIdle, processOne]);

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    const fresh: QueueItem[] = list.map((file) => ({
      key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      status: "waiting",
      progress: 0,
    }));
    // Drop finished rows from the previous batch to keep the list short
    queue.current.filter((i) => i.status === "done").forEach((i) => URL.revokeObjectURL(i.preview));
    queue.current = [...queue.current.filter((i) => i.status !== "done"), ...fresh];
    fresh.forEach((i) => batch.current.keys.add(i.key));
    pump();
  };

  const retry = (key: string) => {
    batch.current.keys.add(key);
    patch(key, { status: "waiting", error: undefined, progress: 0 });
    pump();
  };

  const remove = (key: string) => {
    const item = queue.current.find((i) => i.key === key);
    if (item) URL.revokeObjectURL(item.preview);
    queue.current = queue.current.filter((i) => i.key !== key);
    commit();
  };

  const statusLabel = (i: QueueItem) =>
    ({
      waiting: m.waiting,
      processing: m.processing,
      uploading: `${Math.round(i.progress * 100)}%`,
      saving: m.processing,
      done: m.done,
      error: m.failed,
    })[i.status];

  return (
    <div className="grid gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 text-center transition-colors",
          compact ? "py-8" : "py-12",
          dragging ? "border-accent bg-accent-soft" : "border-line bg-surface",
        )}
      >
        <UploadIcon size={30} className="text-accent" />
        <p className="font-medium">{m.dropHere}</p>
        <p className="text-sm text-muted">{m.allowed(MAX_UPLOAD_MB)}</p>
        <button type="button" className="btn btn-primary mt-3" onClick={() => inputRef.current?.click()}>
          {m.upload}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <Toggle label={m.optimize} checked={optimize} onChange={setOptimize} />

      {items.length > 0 && (
        <ul className="grid gap-2" aria-live="polite">
          {items.map((i) => (
            <li key={i.key} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a file not yet uploaded */}
              <img src={i.preview} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" dir="auto">{i.file.name}</p>
                {i.status === "error" ? (
                  <p className="text-xs text-danger">{i.error}</p>
                ) : (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={cn("h-full rounded-full transition-[width] duration-300", i.status === "done" ? "bg-success" : "bg-accent")}
                      style={{ width: `${i.status === "done" ? 100 : i.status === "uploading" ? Math.max(4, i.progress * 100) : i.status === "saving" ? 100 : 4}%` }}
                    />
                  </div>
                )}
                <p className="mt-1 text-xs text-muted">{formatBytes(i.file.size)}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted tabular-nums">
                {i.status === "done" ? (
                  <CheckIcon size={18} className="text-success" />
                ) : i.status === "error" ? (
                  <AlertIcon size={18} className="text-danger" />
                ) : (
                  <SpinnerIcon size={16} />
                )}
                {statusLabel(i)}
              </span>
              {i.status === "error" && i.retryable !== false && (
                <button type="button" className="btn btn-sm btn-outline" onClick={() => retry(i.key)}>{m.retry}</button>
              )}
              {(i.status === "error" || i.status === "done" || i.status === "waiting") && (
                <button type="button" className="btn btn-icon btn-ghost" aria-label={m.remove} onClick={() => remove(i.key)}>
                  <CloseIcon size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
