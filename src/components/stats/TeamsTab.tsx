'use client';

import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { EmptyState, SectionCard, Skeleton } from '@/components/ui';
import {
  HeroChips,
  RankBubble,
  SortableTable,
  TeamCell,
  WinRateBar,
  fmt,
  type Column,
  type HeroRef,
  type TeamRef,
} from './shared';

type TeamRow = {
  rank: number;
  teamId: string;
  team: TeamRef;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  scoreFor: number;
  scoreAgainst: number;
  gamesWithStats: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgDurationMin: number | null;
  mvpCount: number;
  topHeroes: HeroRef[];
};

export default function TeamsTab({ scope, ready }: { scope: string; ready: boolean }) {
  const t = useT();
  const [data, setData] = useState<{ items: TeamRow[]; matches: number; hasPlayerStats: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    setLoading(true);
    api.leagueStats
      .teams(scope)
      .then((res: any) => alive && setData(res && Array.isArray(res.items) ? res : { items: [], matches: 0, hasPlayerStats: false }))
      .catch(() => alive && setData({ items: [], matches: 0, hasPlayerStats: false }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [scope, ready]);

  if (loading || !data) {
    return <Skeleton className="h-72 w-full rounded-lg" />;
  }

  if (!data.items.length) {
    return <EmptyState icon={<Shield size={26} />} title={t('lstats.empty.title')} description={t('lstats.empty.desc')} />;
  }

  const columns: Column<TeamRow>[] = [
    { key: 'rank', label: t('lstats.col.rank'), value: (r) => r.rank, render: (r) => <RankBubble rank={r.rank} />, className: 'w-12' },
    { key: 'team', label: t('lstats.col.team'), value: (r) => r.team.name, render: (r) => <TeamCell team={r.team} /> },
    { key: 'games', label: t('lstats.col.games'), value: (r) => r.games, render: (r) => r.games, align: 'right' },
    {
      key: 'wl',
      label: t('lstats.col.wl'),
      value: (r) => r.wins,
      render: (r) => (
        <span>
          <span className="font-semibold text-accent-green">{r.wins}</span>
          <span className="text-ink-3"> / </span>
          <span className="font-semibold text-accent-red">{r.losses}</span>
          {r.draws > 0 && <span className="text-ink-3"> ({r.draws})</span>}
        </span>
      ),
      align: 'right',
    },
    { key: 'winRate', label: t('lstats.col.winRate'), value: (r) => r.winRate, render: (r) => <WinRateBar value={r.winRate} /> },
    {
      key: 'avgKills',
      label: t('lstats.col.avgKills'),
      value: (r) => r.avgKills,
      render: (r) => (r.gamesWithStats ? fmt(r.avgKills) : '–'),
      align: 'right',
      hideOnMobile: true,
    },
    {
      key: 'avgDeaths',
      label: t('lstats.col.avgDeaths'),
      value: (r) => r.avgDeaths,
      render: (r) => (r.gamesWithStats ? fmt(r.avgDeaths) : '–'),
      align: 'right',
      hideOnMobile: true,
    },
    {
      key: 'duration',
      label: t('lstats.col.duration'),
      value: (r) => r.avgDurationMin,
      render: (r) =>
        r.avgDurationMin === null ? (
          <span className="text-xs text-ink-3" title={t('lstats.durationNA')}>
            –
          </span>
        ) : (
          `${fmt(r.avgDurationMin)} min`
        ),
      align: 'right',
      hideOnMobile: true,
    },
    { key: 'mvp', label: t('lstats.col.mvp'), value: (r) => r.mvpCount, render: (r) => r.mvpCount, align: 'right' },
    { key: 'heroes', label: t('lstats.col.heroes'), render: (r) => <HeroChips heroes={r.topHeroes} />, hideOnMobile: true },
  ];

  return (
    <div className="space-y-3">
      {!data.hasPlayerStats && (
        <p className="rounded-lg border border-accent-gold/40 bg-accent-gold/10 px-3 py-2 text-xs text-ink-2">
          {t('lstats.noPlayerStats')}
        </p>
      )}
      <SectionCard className="!p-0 overflow-hidden">
        <SortableTable columns={columns} rows={data.items} rowKey={(r) => r.teamId} highlight="winRate" />
      </SectionCard>
    </div>
  );
}
