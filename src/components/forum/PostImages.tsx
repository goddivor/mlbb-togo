'use client';

import { cn } from '@/lib/helpers';

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
  return (
    <div
      className={cn(
        'grid gap-2',
        shown.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3',
        className,
      )}
    >
      {shown.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className="relative overflow-hidden rounded-lg border border-line-subtle bg-surface-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            loading="lazy"
            className={cn('w-full object-cover', compact ? 'h-32 sm:h-40' : 'max-h-[28rem] h-auto')}
          />
          {extra > 0 && i === shown.length - 1 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white">
              +{extra}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
