'use client';

import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import { FilterBar, HeroPortrait, PanelSkeleton, RankTierTabs, Unavailable } from './shared';
import { useMeta } from './useMeta';

const PER_LIST = 8;

type Ref = { heroId: number; name: string | null; image: string | null; increaseWinRate: number };

function MatchupList({ title, hint, color, list, onPick }: { title: string; hint: string; color: string; list: Ref[]; onPick?: (id: number) => void }) {
  const t = useT();
  if (!list.length) return null;
  const max = Math.max(...list.map((r) => Math.abs(r.increaseWinRate)), 0.01);
  return (
    <div className="rounded-lg border border-line-subtle bg-surface-2/40 p-4">
      <h4 className={cn('text-sm font-semibold', color)}>{title}</h4>
      <p className="mb-3 text-xs text-ink-3">{hint}</p>
      <ul className="space-y-1.5">
        {list.map((h) => {
          const positive = h.increaseWinRate >= 0;
          const Comp: any = onPick ? 'button' : 'div';
          return (
            <li key={h.heroId}>
              <Comp
                type={onPick ? 'button' : undefined}
                onClick={onPick ? () => onPick(h.heroId) : undefined}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded p-1 text-left',
                  onPick && 'transition-colors hover:bg-surface-3/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                )}
              >
                <HeroPortrait src={h.image} name={h.name} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink-1">{h.name ?? `#${h.heroId}`}</span>
                    <span className={cn('shrink-0 text-xs font-semibold num', positive ? 'text-accent-green' : 'text-accent-red')}>
                      {positive ? '+' : ''}
                      {h.increaseWinRate.toFixed(2)} {t('heroMeta.points')}
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={cn('h-full rounded-full', positive ? 'bg-accent-green' : 'bg-accent-red')}
                      style={{ width: `${(Math.abs(h.increaseWinRate) / max) * 100}%` }}
                    />
                  </div>
                </div>
              </Comp>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Best/worst matchups and teammates from the full Academy matrix (every hero). */
export default function HeroMatchupsPanel({ heroId, onPick }: { heroId: number; onPick?: (id: number) => void }) {
  const t = useT();
  const [rank, setRank] = useState('all');
  const { data, loading } = useMeta<any>(() => api.heroes.metaMatchups(heroId, { rank }), [heroId, rank]);

  const lists = useMemo(() => {
    const counters: Ref[] = data?.counters ?? [];
    const mates: Ref[] = data?.teammates ?? [];
    const asc = (l: Ref[]) => [...l].sort((a, b) => a.increaseWinRate - b.increaseWinRate);
    return {
      strong: counters.filter((r) => r.increaseWinRate > 0).slice(0, PER_LIST),
      weak: asc(counters).filter((r) => r.increaseWinRate < 0).slice(0, PER_LIST),
      best: mates.filter((r) => r.increaseWinRate > 0).slice(0, PER_LIST),
      worst: asc(mates).filter((r) => r.increaseWinRate < 0).slice(0, PER_LIST),
      total: counters.length,
    };
  }, [data]);

  return (
    <div>
      <FilterBar>
        <RankTierTabs value={rank} onChange={setRank} />
        {lists.total > 0 && <span className="text-xs text-ink-3">{t('heroMeta.matchups.count', { n: lists.total })}</span>}
      </FilterBar>
      {loading && !data ? (
        <PanelSkeleton rows={4} />
      ) : !lists.total ? (
        <Unavailable />
      ) : (
        <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-2', loading && 'opacity-60')}>
          <MatchupList title={t('heroes.strongAgainst')} hint={t('heroMeta.matchups.strongHint')} color="text-accent-green" list={lists.strong} onPick={onPick} />
          <MatchupList title={t('heroes.weakAgainst')} hint={t('heroMeta.matchups.weakHint')} color="text-accent-red" list={lists.weak} onPick={onPick} />
          <MatchupList title={t('heroes.bestTeammates')} hint={t('heroMeta.matchups.bestHint')} color="text-accent-cyan" list={lists.best} onPick={onPick} />
          <MatchupList title={t('heroes.worstTeammates')} hint={t('heroMeta.matchups.worstHint')} color="text-ink-2" list={lists.worst} onPick={onPick} />
        </div>
      )}
    </div>
  );
}
