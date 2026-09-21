'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { EmptyState, SectionCard, Skeleton, Tabs } from '@/components/ui';
import {
  HeroChips,
  LaneCell,
  PlayerCell,
  RankBubble,
  SortableTable,
  WinRateBar,
  fmt,
  type Column,
  type HeroRef,
  type TeamRef,
  type UserRef,
} from './shared';

const LANES = ['roam', 'jungle', 'mid', 'exp', 'gold'];
const SORTS = ['kills', 'kda', 'mvp', 'games', 'assists', 'winRate'] as const;
type Sort = (typeof SORTS)[number];

type PlayerRow = {
  rank: number;
  userId: string;
  user: UserRef;
  team: TeamRef;
  role: string | null;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kda: number;
  mvpCount: number;
  topHeroes: HeroRef[];
};

const selectClass =
  'rounded border border-line-strong bg-surface-1 py-2 pl-3 pr-8 text-sm text-ink-1 outline-none transition-[border-color,box-shadow] duration-base focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60';

export default function PlayersTab({ scope, ready }: { scope: string; ready: boolean }) {
  const t = useT();
  const [role, setRole] = useState('');
  const [sort, setSort] = useState<Sort>('kills');
  const [rows, setRows] = useState<PlayerRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    setLoading(true);
    api.leagueStats
      .players({ seasonId: scope, role: role || undefined, sort, limit: 100 })
      .then((res: any) => alive && setRows(Array.isArray(res?.items) ? res.items : []))
      .catch(() => alive && setRows([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [scope, ready, role, sort]);

  const kdaCell = (r: PlayerRow) => (
    <span className="whitespace-nowrap">
      <span className="text-accent-green">{r.kills}</span>
      <span className="text-ink-3"> / </span>
      <span className="text-accent-red">{r.deaths}</span>
      <span className="text-ink-3"> / </span>
      <span className="text-accent-cyan">{r.assists}</span>
      <span className="block text-[11px] text-ink-3">
        {fmt(r.avgKills)} / {fmt(r.avgDeaths)} / {fmt(r.avgAssists)} {t('lstats.avg')}
      </span>
    </span>
  );

  const columns: Column<PlayerRow>[] = [
    { key: 'rank', label: t('lstats.col.rank'), value: (r) => r.rank, render: (r) => <RankBubble rank={r.rank} />, className: 'w-12' },
    {
      key: 'player',
      label: t('lstats.col.player'),
      value: (r) => r.user.displayName || r.user.username,
      render: (r) => <PlayerCell user={r.user} team={r.team} />,
    },
    { key: 'role', label: t('lstats.col.role'), value: (r) => r.role ?? '', render: (r) => <LaneCell role={r.role} />, hideOnMobile: true },
    { key: 'games', label: t('lstats.col.games'), value: (r) => r.games, render: (r) => r.games, align: 'right' },
    { key: 'kills', label: 'K / D / A', value: (r) => r.kills, render: kdaCell, align: 'right' },
    { key: 'kda', label: t('lstats.col.kda'), value: (r) => r.kda, render: (r) => fmt(r.kda, 2), align: 'right' },
    { key: 'mvp', label: t('lstats.col.mvp'), value: (r) => r.mvpCount, render: (r) => r.mvpCount, align: 'right' },
    { key: 'winRate', label: t('lstats.col.winRate'), value: (r) => r.winRate, render: (r) => <WinRateBar value={r.winRate} />, hideOnMobile: true },
    { key: 'assists', label: t('lstats.col.assists'), value: (r) => r.assists, render: (r) => r.assists, align: 'right', hideOnMobile: true },
    { key: 'heroes', label: t('lstats.col.heroes'), render: (r) => <HeroChips heroes={r.topHeroes} />, hideOnMobile: true },
  ];

  return (
    <div className="space-y-3">
      <SectionCard className="!p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="overflow-x-auto overflow-y-hidden">
            <Tabs
              size="sm"
              tabs={SORTS.map((s) => ({ id: s, label: t(`lstats.sort.${s}`) }))}
              active={sort}
              onChange={(s: Sort) => setSort(s)}
              className="whitespace-nowrap"
            />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={selectClass} aria-label={t('lstats.col.role')}>
            <option value="">{t('lstats.players.allRoles')}</option>
            {LANES.map((l) => (
              <option key={l} value={l}>
                {t(`lane.${l}`)}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs text-ink-3">{t('lstats.players.minGames')}</p>
      </SectionCard>

      {loading || !rows ? (
        <Skeleton className="h-72 w-full rounded-lg" />
      ) : rows.length === 0 ? (
        <EmptyState icon={<Users size={26} />} title={t('lstats.empty.title')} description={t('lstats.empty.desc')} />
      ) : (
        <SectionCard className="!p-0 overflow-hidden">
          <SortableTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.userId}
            highlight={sort === 'mvp' ? 'mvp' : sort === 'winRate' ? 'winRate' : sort}
          />
        </SectionCard>
      )}
    </div>
  );
}
