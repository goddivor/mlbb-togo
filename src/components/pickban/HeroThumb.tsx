'use client';

import { mlbbImg } from '@/lib/api';
import { cn } from '@/lib/helpers';

// Square hero portrait with a graceful placeholder when the image is missing.
export default function HeroThumb({
  src,
  name,
  size = 96,
  className,
  dimmed = false,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  dimmed?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-2 dark:bg-meta-4',
        dimmed && 'grayscale opacity-60',
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mlbbImg(src, size)}
          alt={name}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-body dark:text-bodydark">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}
