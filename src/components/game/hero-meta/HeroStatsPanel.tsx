'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import { Delta, FilterBar, HeroPortrait, PanelSkeleton, RankTierTabs, Unavailable, WindowTabs, fmtPct } from './shared';
import { useMeta } from './useMeta';

const RATES = [
  { key: 'winRate', label: 'heroes.winRate', color: 'text-accent-green', bar: 'bg-accent-green', max: 100 },
  { key: 'pickRate', label: 'heroes.pickRate', color: 'text-accent-cyan', bar: 'bg-accent-cyan', max: 5 },
  { key: 'banRate', label: 'heroes.banRate', color: 'text-accent-red', bar: 'bg-accent-red', max: 60 },
] as const;

/** Win/pick/ban for a rank tier and window, with day-over-period deltas and ranking positions. */
export default function HeroStatsPanel({ heroId }: { heroId: number }) {
  const t = useT();
  const [rank, setRank] = useState('all');
  const [days, setDays] = useState(7);
  const { data, loading } = useMeta<any>(() => api.heroes.metaStats(heroId, { rank, days }), [heroId, rank, days]);

  return (
    <div>
      <FilterBar>
        <RankTierTabs value={rank} onChange={setRank} />
        <WindowTabs value={days} onChange={setDays} />
      </FilterBar>

      {loading && !data ? (
        <PanelSkeleton />
      ) : !data?.available ? (
        <Unavailable />
      ) : (
        <div className={cn('space-y-6 transition-opacity', loading && 'opacity-60')}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {RATES.map((r) => {
              const value: number | null = data[r.key];
              const position: number | null = data.positions?.[r.key] ?? null;
              return (
                <div key={r.key} className="rounded-lg border border-line-subtle bg-surface-2/40 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t(r.label)}</p>
                  <p className={cn('mt-1 font-display text-3xl font-bold num', r.color)}>{fmtPct(value, 2)}</p>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                    <Delta value={data.deltas?.[r.key]} />
                    {position != null && (
                      <span className="text-xs text-ink-3 num">
                        {t('heroMeta.position', { n: position, total: data.total })}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={cn('h-full rounded-full', r.bar)}
                      style={{ width: `${Math.min(100, ((value ?? 0) / r.max) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {data.deltas?.from && (
            <p className="text-xs text-ink-3">{t('heroMeta.deltaHint', { from: data.deltas.from, to: data.deltas.to })}</p>
          )}

          {data.teammates?.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-semibold text-accent-cyan">{t('heroes.bestTeammates')}</h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {data.teammates.map((h: any) => (
                  <div key={h.heroId} className="flex items-center gap-2.5 rounded border border-line-subtle bg-surface-2/60 p-1.5 pr-3">
                    <HeroPortrait src={h.image} name={h.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-1">{h.name ?? `#${h.heroId}`}</p>
                      <Delta value={h.increaseWinRate} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
