'use client';

import { cn } from '@/lib/helpers';
import { rankTier, type RankTier } from '@/config/theme';
import RankBadge, { hasRankBadge } from './RankBadge';

/** Frame gradients per tier (border ring) + glow. */
const TIER_RING: Record<RankTier, string> = {
  mythic: 'from-accent-red via-accent-violet to-accent-cyan',
  gold: 'from-amber-300 via-accent-gold to-amber-700',
  silver: 'from-slate-200 via-slate-400 to-slate-600',
  bronze: 'from-orange-300 via-orange-600 to-orange-900',
  none: 'from-line-strong to-line-strong',
};

const TIER_GLOW: Record<RankTier, string> = {
  mythic: 'shadow-glow-violet',
  gold: 'shadow-glow-gold',
  silver: '',
  bronze: '',
  none: '',
};

/**
 * Avatar wrapped in a chamfered frame coloured by rank tier, with the in-game
 * rank emblem pinned to the bottom edge. Accepts the same fields as the user
 * objects returned by `/users/:id` (`avatar`, `gameRank`).
 */
export default function RankFrame({
  name,
  src,
  rank,
  tier,
  size = 64,
  showBadge = true,
  className,
}: {
  name?: string | null;
  src?: string | null;
  rank?: string | null;
  /** Force a tier (defaults to the one derived from `rank`). */
  tier?: RankTier;
  size?: number;
  showBadge?: boolean;
  className?: string;
}) {
  const t = tier ?? rankTier(rank);
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const badgeSize = Math.max(18, Math.round(size * 0.38));
  return (
    <div className={cn('relative inline-block shrink-0', className)} style={{ width: size, height: size }}>
      <div
        className={cn('cut-corners bg-gradient-to-br p-[2px]', TIER_RING[t], TIER_GLOW[t])}
        style={{ width: size, height: size, ['--cut' as any]: `${Math.round(size * 0.16)}px` }}
      >
        <div
          className="cut-corners flex h-full w-full items-center justify-center overflow-hidden bg-surface-2 font-display font-bold text-ink-1"
          style={{ ['--cut' as any]: `${Math.round(size * 0.15)}px`, fontSize: size * 0.34 }}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={name || ''} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
      </div>
      {showBadge && rank && hasRankBadge(rank) && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
          <RankBadge rank={rank} size={badgeSize} />
        </span>
      )}
    </div>
  );
}
