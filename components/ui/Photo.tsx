"use client";

import Image from "next/image";
import { useState } from "react";
import { storageUrl } from "@/lib/utils/storage";
import { ImageIcon } from "@/components/icons";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

interface PhotoProps {
  path: string | null | undefined;
  alt: string;
  /** Fill the parent (parent must be position:relative with a size). */
  fill?: boolean;
  width?: number | null;
  height?: number | null;
  sizes: string;
  priority?: boolean;
  quality?: 60 | 75 | 85;
  blurDataURL?: string | null;
  className?: string;
  imgClassName?: string;
}

/**
 * Optimised photo from Supabase Storage via next/image: responsive sizes,
 * modern formats, lazy loading below the fold, blurred placeholder, and a calm
 * fallback if the file is missing.
 */
export function Photo({
  path,
  alt,
  fill,
  width,
  height,
  sizes,
  priority,
  quality = 75,
  blurDataURL,
  className,
  imgClassName,
}: PhotoProps) {
  const [failed, setFailed] = useState(false);
  const src = storageUrl(path);

  if (!src || failed) {
    return (
      <div
        className={cn("flex items-center justify-center bg-surface-2 text-muted", fill ? "absolute inset-0" : "aspect-[4/3] w-full", className)}
        role="img"
        aria-label={alt || t.errors.imageFailed}
      >
        <ImageIcon size={28} />
      </div>
    );
  }

  const placeholder = blurDataURL ? "blur" : "empty";

  if (fill || !width || !height) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL ?? undefined}
        className={cn("object-cover", imgClassName)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      quality={quality}
      placeholder={placeholder}
      blurDataURL={blurDataURL ?? undefined}
      className={cn("h-auto w-full", imgClassName)}
      onError={() => setFailed(true)}
    />
  );
}
