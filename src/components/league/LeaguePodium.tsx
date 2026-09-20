'use client';

import Link from 'next/link';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/helpers';
import type { TFn } from '@/components/matches/shared';
import { PLACE_TIER, PodiumTeamLogo } from '@/components/seasons/shared';

export interface PodiumRow {
  rank: number;
  team: { id: string; name: string; image?: string | null };
  points: number;
  wins: number;
  losses: number;
  played: number;
}

const HEIGHT: Record<number, string> = {
  1: 'h-28 sm:h-36',
  2: 'h-20 sm:h-24',
  3: 'h-14 sm:h-16',
};

/** Current top 3 of the standings, drawn as a podium (2 - 1 - 3). */
export default function LeaguePodium({ rows, t }: { rows: PodiumRow[]; t: TFn }) {
  const top = rows.filter((r) => r.rank >= 1 && r.rank <= 3);
  if (top.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-2">{t('seasons.podium.empty')}</p>;
  }
  const order = [2, 1, 3].map((p) => top.find((r) => r.rank === p)).filter(Boolean) as PodiumRow[];
  return (
    <div className="mx-auto grid max-w-2xl grid-cols-3 items-end gap-3 sm:gap-6">
      {order.map((r) => (
        <Link
          key={r.rank}
          href={`/teams/${r.team.id}`}
          className="group flex min-w-0 flex-col items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          {r.rank === 1 && <Crown size={22} className="text-accent-gold" />}
          <PodiumTeamLogo
            team={r.team}
            placement={r.rank}
            className={cn(
              'transition-transform duration-base ease-out group-hover:-translate-y-0.5',
              r.rank === 1 ? 'h-20 w-20 text-2xl sm:h-24 sm:w-24' : 'h-14 w-14 text-lg sm:h-16 sm:w-16'
            )}
          />
          <p className="w-full truncate text-center font-display text-sm font-bold text-ink-1 sm:text-base">{r.team.name}</p>
          <p className="text-xs text-ink-2 num">{t('league.podium.record', { pts: r.points, w: r.wins, l: r.losses })}</p>
          <div
            className={cn(
              'flex w-full items-start justify-center rounded-t-md pt-2 font-display text-2xl font-bold num sm:text-3xl',
              HEIGHT[r.rank],
              PLACE_TIER[r.rank]
            )}
          >
            {r.rank}
          </div>
        </Link>
      ))}
    </div>
  );
}
