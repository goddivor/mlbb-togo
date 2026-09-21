'use client';

import { cn } from '@/lib/helpers';
import { useLangStore } from '@/store/useStore';
import { titleLabel } from './titles';

/** Equipped level title shown under a player name (renders nothing without a title). */
export default function PlayerTitle({
  id,
  size = 'sm',
  className,
}: {
  id?: string | null;
  size?: 'xs' | 'sm';
  className?: string;
}) {
  const lang = useLangStore((s: any) => s.lang);
  const label = titleLabel(id, lang);
  if (!label) return null;
  return (
    <span
      className={cn(
        'inline-block truncate font-semibold italic tracking-wide text-accent-violet/90',
        size === 'xs' ? 'text-[11px]' : 'text-xs',
        className,
      )}
    >
      {label}
    </span>
  );
}
