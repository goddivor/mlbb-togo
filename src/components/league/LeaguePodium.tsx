'use client';

import Link from 'next/link';
import { Crown } from 'lucide-react';
import type { TFn } from '@/components/matches/shared';

export interface PodiumRow {
  rank: number;
  team: { id: string; name: string; image?: string | null };
  points: number;
  wins: number;
  losses: number;
  played: number;
}

const MEDAL: Record<number, { bar: string; ring: string; height: string }> = {
  1: { bar: 'from-yellow-400 to-amber-600', ring: 'ring-yellow-400', height: 'h-28 sm:h-36' },
  2: { bar: 'from-slate-200 to-slate-400', ring: 'ring-slate-300', height: 'h-20 sm:h-24' },
  3: { bar: 'from-orange-300 to-amber-800', ring: 'ring-orange-400', height: 'h-14 sm:h-16' },
};

/** Current top 3 of the standings, drawn as a podium (2 - 1 - 3), dark theme. */
export default function LeaguePodium({ rows, t }: { rows: PodiumRow[]; t: TFn }) {
  const top = rows.filter((r) => r.rank >= 1 && r.rank <= 3);
  if (top.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">{t('seasons.podium.empty')}</p>;
  }
  const order = [2, 1, 3].map((p) => top.find((r) => r.rank === p)).filter(Boolean) as PodiumRow[];
  return (
    <div className="grid grid-cols-3 items-end gap-3 sm:gap-6 max-w-2xl mx-auto">
      {order.map((r) => {
        const m = MEDAL[r.rank];
        return (
          <Link
            key={r.rank}
            href={`/teams/${r.team.id}`}
            className="group flex flex-col items-center gap-2 min-w-0"
          >
            {r.rank === 1 && <Crown size={22} className="text-yellow-400 drop-shadow" />}
            {r.team.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.team.image}
                alt={r.team.name}
                referrerPolicy="no-referrer"
                className={`${r.rank === 1 ? 'h-20 w-20 sm:h-24 sm:w-24' : 'h-14 w-14 sm:h-16 sm:w-16'} rounded-full object-cover ring-2 ${m.ring} transition-transform group-hover:scale-105`}
              />
            ) : (
              <div
                className={`${r.rank === 1 ? 'h-20 w-20 sm:h-24 sm:w-24 text-2xl' : 'h-14 w-14 sm:h-16 sm:w-16 text-lg'} rounded-full bg-white/10 text-white flex items-center justify-center font-bold ring-2 ${m.ring}`}
              >
                {r.team.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <p className="text-sm sm:text-base font-semibold text-white text-center truncate w-full">{r.team.name}</p>
            <p className="text-xs text-gray-400 tabular-nums">
              {t('league.podium.record', { pts: r.points, w: r.wins, l: r.losses })}
            </p>
            <div
              className={`w-full ${m.height} rounded-t-xl bg-gradient-to-t ${m.bar} flex items-start justify-center pt-2 text-black font-black text-2xl shadow-lg`}
            >
              {r.rank}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
