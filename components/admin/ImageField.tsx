"use client";

import { useId, useRef, useState } from "react";
import { ImageIcon, SpinnerIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { Photo } from "@/components/ui/Photo";
import { useFeedback } from "@/components/admin/Feedback";
import { ALLOWED_IMAGE_TYPES, type StorageFolder } from "@/lib/config/media";
import { UploadError, newStoragePath, prepareImage, uploadToStorage } from "@/lib/upload/client";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

const im = t.admin.image;

interface Props {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (path: string | null) => void;
  folder: Exclude<StorageFolder, "portfolio">;
  /** Scale down very large photos (off for logos/icons). */
  optimize?: boolean;
  aspect?: string;
  contain?: boolean;
}

/**
 * Picks one image, uploads it straight to Storage, and hands back its path.
 * The path is saved with the form; the old file is removed on the server
 * after a successful save.
 */
export function ImageField({ label, hint, value, onChange, folder, optimize = true, aspect = "16 / 9", contain }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useFeedback();
  const [progress, setProgress] = useState<number | null>(null);

  const pick = async (file: File) => {
    setProgress(0);
    try {
      const prepared = await prepareImage(file, optimize);
      const path = newStoragePath(folder, prepared.type);
      await uploadToStorage(path, prepared.blob, prepared.type, (f) => setProgress(f));
      onChange(path);
    } catch (error) {
      toast(error instanceof UploadError ? error.message : t.admin.media.uploadFailed, "error");
    } finally {
      setProgress(null);
    }
  };

  const uploading = progress !== null;

  return (
    <div className="field">
      <span className="field-label" id={`${id}-label`}>{label}</span>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className={cn("relative w-full overflow-hidden rounded-xl border border-line bg-surface-2 sm:w-56", contain && "bg-[repeating-conic-gradient(var(--surface-2)_0_25%,var(--surface)_0_50%)] bg-[length:16px_16px]")}
          style={{ aspectRatio: aspect }}
        >
          {value ? (
            <Photo path={value} alt={label} fill sizes="224px" imgClassName={contain ? "object-contain p-3" : "object-cover"} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted">
              <ImageIcon size={26} />
              <span className="text-xs">{im.none}</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white">
              <SpinnerIcon />
              <span className="text-xs tabular-nums">{Math.round((progress ?? 0) * 100)}%</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm btn-outline" onClick={() => inputRef.current?.click()} disabled={uploading} aria-describedby={`${id}-label`}>
            <UploadIcon size={16} /> {value ? im.replace : im.choose}
          </button>
          {value && (
            <button type="button" className="btn btn-sm btn-ghost text-danger" onClick={() => onChange(null)} disabled={uploading}>
              <TrashIcon size={16} /> {im.remove}
            </button>
          )}
        </div>
      </div>
      {hint && <p className="field-hint">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void pick(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
