'use client';

import { useState } from 'react';
import { cn } from '@/lib/helpers';

/**
 * Aspect ratio used before the browser has decoded the image, and the range the
 * measured one is clamped to: a panorama or a very tall screenshot would
 * otherwise either become a thin strip or eat the whole page.
 */
const FALLBACK_RATIO = 16 / 9;
const MIN_RATIO = 3 / 4;
const MAX_RATIO = 21 / 9;

/**
 * One attachment. The box takes the ratio of the image itself and the image is
 * `object-contain` inside it, so nothing is ever cut: a face at the top of a
 * poster stays visible (#165). The height is capped rather than fixed, so a
 * portrait screenshot does not push the rest of the feed off the screen.
 */
function PostImage({
  src,
  compact,
  ratio: forced,
  overlay,
}: {
  src: string;
  compact: boolean;
  /** Ratio imposed by the grid (several images side by side). */
  ratio?: number;
  overlay?: React.ReactNode;
}) {
  const [ratio, setRatio] = useState<number | null>(null);
  const measured = forced ?? ratio ?? FALLBACK_RATIO;
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-lg border border-line-subtle bg-surface-2',
        compact ? 'max-h-72' : 'max-h-[32rem]',
      )}
      style={{ aspectRatio: String(Math.min(Math.max(measured, MIN_RATIO), MAX_RATIO)) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight);
        }}
        className="h-full w-full object-contain"
      />
      {overlay}
    </div>
  );
}

/** Image attachment grid (URLs are user-provided, so plain <img> is used). */
export default function PostImages({
  images,
  compact = false,
  className,
}: {
  images: string[];
  compact?: boolean;
  className?: string;
}) {
  if (!images?.length) return null;
  const shown = compact ? images.slice(0, 3) : images;
  const extra = images.length - shown.length;
  const single = shown.length === 1;
  return (
    <div className={cn('grid gap-2', single ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3', className)}>
      {shown.map((src, i) => (
        <PostImage
          key={`${src}-${i}`}
          src={src}
          compact={compact}
          // Side by side, the cells share one ratio so the row stays even; a
          // lone image keeps its own.
          ratio={single ? undefined : 4 / 3}
          overlay={
            extra > 0 && i === shown.length - 1 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white">
                +{extra}
              </div>
            ) : null
          }
        />
      ))}
    </div>
  );
}
