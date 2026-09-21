'use client';

import { cn } from '@/lib/helpers';
import RankBadge, { hasRankBadge } from './RankBadge';
import RankFrame from './RankFrame';
import { FrameArt, resolveFrame } from './frames';

/**
 * Player avatar with its equipped reward frame (`User.equippedFrame`).
 *
 * - `frame` is `id` or `id:variant` (e.g. `champion_saison:S2`). No frame or
 *   an unknown id renders the rank frame (`RankFrame`) unchanged.
 * - `size` is the frame box in px; the avatar fills 68.75% of it. Square
 *   frames get a rounded-square avatar.
 * - The rank emblem sits bottom-centre on circular frames and in the
 *   bottom-right corner on square frames.
 */
export default function AvatarFrame({
  frame,
  src,
  name,
  size = 64,
  rank,
  showBadge = true,
  className,
}: {
  frame?: string | null;
  src?: string | null;
  name?: string | null;
  size?: number;
  rank?: string | null;
  showBadge?: boolean;
  className?: string;
}) {
  const resolved = resolveFrame(frame);
  if (!resolved) {
    return <RankFrame name={name} src={src} rank={rank} size={size} showBadge={showBadge} className={className} />;
  }
  const { frame: info, variant } = resolved;
  const square = info.shape === 'square';
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const badgeSize = Math.max(12, Math.round(size * 0.3));
  const withBadge = showBadge && !!rank && hasRankBadge(rank);

  return (
    <div className={cn('relative inline-block shrink-0 align-middle', className)} style={{ width: size, height: size }}>
      <FrameArt frame={info} variant={variant} size={size}>
        <div
          className="flex h-full w-full items-center justify-center bg-surface-2 font-display font-bold text-ink-1"
          style={{ fontSize: Math.max(9, size * 0.24) }}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={name || ''} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
      </FrameArt>
      {withBadge && (
        <span
          className={cn(
            'pointer-events-none absolute leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]',
            square ? 'right-0 bottom-0 translate-x-[12%] translate-y-[12%]' : 'bottom-0 left-1/2 -translate-x-1/2 translate-y-[18%]',
          )}
        >
          <RankBadge rank={rank} size={badgeSize} className="block" />
        </span>
      )}
    </div>
  );
}
