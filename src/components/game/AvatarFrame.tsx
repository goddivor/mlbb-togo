'use client';

import { cn } from '@/lib/helpers';
import type { RankTier } from '@/config/theme';
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
 * - `avatarSize` (instead of `size`) keeps the avatar itself at that size:
 *   the rank frame is drawn at `avatarSize` and a reward frame box grows to
 *   `avatarSize / 0.6875`, so a framed avatar is never smaller than an
 *   unframed one. With `bleed`, the extra height overflows the layout box
 *   (negative vertical margins) so dense rows keep their height.
 */
const AVATAR_RATIO = 0.6875;

/** Frame box that keeps an avatar of `avatarSize` px inside a reward frame. */
export function framedBoxSize(avatarSize: number): number {
  return Math.round(avatarSize / AVATAR_RATIO);
}

export default function AvatarFrame({
  frame,
  src,
  name,
  size: boxSize = 64,
  avatarSize,
  bleed = false,
  slot = false,
  rank,
  tier,
  showBadge = true,
  className,
}: {
  frame?: string | null;
  src?: string | null;
  name?: string | null;
  size?: number;
  /** Avatar size in px; overrides `size` (see above). */
  avatarSize?: number;
  /** With `avatarSize`: let the frame overflow vertically instead of growing the row. */
  bleed?: boolean;
  /**
   * With `avatarSize`: always reserve the width of a framed avatar so rows
   * with and without a reward frame keep their names aligned (dense lists).
   */
  slot?: boolean;
  rank?: string | null;
  /** Forced rank-frame tier when no reward frame is equipped (e.g. podium). */
  tier?: RankTier;
  showBadge?: boolean;
  className?: string;
}) {
  const resolved = resolveFrame(frame);
  if (slot && avatarSize) {
    return (
      <span className="inline-flex shrink-0 items-center justify-center align-middle" style={{ width: framedBoxSize(avatarSize) }}>
        <AvatarFrame
          frame={frame}
          src={src}
          name={name}
          avatarSize={avatarSize}
          bleed={bleed}
          rank={rank}
          tier={tier}
          showBadge={showBadge}
          className={className}
        />
      </span>
    );
  }
  if (!resolved) {
    return (
      <RankFrame
        name={name}
        src={src}
        rank={rank}
        tier={tier}
        size={avatarSize ?? boxSize}
        showBadge={showBadge}
        className={className}
      />
    );
  }
  const size = avatarSize ? framedBoxSize(avatarSize) : boxSize;
  const overflow = bleed && avatarSize ? -Math.round((size - avatarSize) / 2) : undefined;
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
    <div className={cn('relative inline-block shrink-0 align-middle', className)} style={{ width: size, height: size, marginTop: overflow, marginBottom: overflow }}>
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
