'use client';

import { FrameArt, resolveFrame } from '@/components/game/frames';
import { cn } from '@/lib/helpers';

/** Frame preview without avatar (reward pickers, achievement badges). */
export default function FrameThumb({
  frame,
  size = 40,
  label,
  className,
}: {
  /** `id` or `id:variant`. */
  frame?: string | null;
  size?: number;
  label?: string;
  className?: string;
}) {
  const resolved = resolveFrame(frame);
  if (!resolved) return null;
  return (
    <span className={cn('inline-block shrink-0 align-middle', className)} style={{ width: size, height: size }}>
      <FrameArt frame={resolved.frame} variant={resolved.variant} size={size} label={label}>
        <span className="block h-full w-full bg-surface-3" />
      </FrameArt>
    </span>
  );
}
