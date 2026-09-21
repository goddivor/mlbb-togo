'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Trophy, Crown, Flame, Medal, Swords } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useSelectedSeason } from '@/store/useSeasonStore';
import { MLBB_ROLES } from '@/lib/constants';
import {
  PageHeader,
  SectionCard,
  Badge,
  DataTable,
  EmptyState,
  Skeleton,
  Tabs,
  type DataColumn,
} from '@/components/ui';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import AvatarFrame from '@/components/game/AvatarFrame';
import RoleIcon from '@/components/game/RoleIcon';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import { fadeUp, stagger, still } from '@/lib/motion';

type Metric = 'winRate' | 'wins' | 'mvpCount' | 'streak';

const METRICS: { id: Metric; labelKey: string }[] = [
  { id: 'winRate', labelKey: 'leaderboard.metric.winRate' },
  { id: 'wins', labelKey: 'leaderboard.metric.wins' },
  { id: 'mvpCount', labelKey: 'leaderboard.metric.mvp' },
  { id: 'streak', labelKey: 'leaderboard.metric.streak' },
];

/** Value shown in the highlighted column, per metric. */
function metricValue(entry: any, metric: Metric): string {
  if (metric === 'winRate') return `${entry.winRate ?? 0}%`;
  if (metric === 'wins') return String(entry.wins ?? 0);
  if (metric === 'mvpCount') return String(entry.mvpCount ?? 0);
  return String(entry.streak ?? 0);
}

const PODIUM = [
  { tier: 'gold' as const, badge: 'tier-gold', order: 'sm:order-2 sm:-mt-6', size: 96, glow: true },
  { tier: 'silver' as const, badge: 'tier-silver', order: 'sm:order-1', size: 72, glow: false },
  { tier: 'bronze' as const, badge: 'tier-bronze', order: 'sm:order-3', size: 72, glow: false },
];

const selectClass =
  'rounded border border-line-strong bg-surface-1 py-2 pl-3 pr-8 text-sm text-ink-1 outline-none transition-[border-color,box-shadow] duration-base focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60';

export default function LeaderboardPage() {
  const t = useT();
  const reduce = useReducedMotion();

  const [metric, setMetric] = useState<Metric>('winRate');
  const [role, setRole] = useState('');
  const [rankedOnly, setRankedOnly] = useState(true);

  // Season filter follows the global season switcher (persisted).
  const { selection, setSelection, seasonId: selectedSeasonId, seasons, ready: seasonsReady } = useSelectedSeason();
  const seasonId = selectedSeasonId ?? '';

  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!seasonsReady) return;
    setLoading(true);
    api.users
      .leaderboard({
        metric,
        role: role || undefined,
        seasonId: seasonId || undefined,
        // Win rate is meaningless on a 1-0 record: ask for a real sample.
        minGames: rankedOnly && metric === 'winRate' ? 10 : undefined,
        limit: 100,
      })
      .then((res: any) => {
        setEntries(Array.isArray(res?.entries) ? res.entries : []);
        setTotal(res?.total ?? 0);
      })
      .catch(() => {
        setEntries([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [metric, role, seasonId, rankedOnly, seasonsReady]);

  useEffect(() => {
    load();
  }, [load]);

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const metricLabel = t(`leaderboard.metric.${metric === 'mvpCount' ? 'mvp' : metric}`);

  const columns: DataColumn<any>[] = [
    {
      key: 'position',
      header: '#',
      align: 'right',
      width: 'w-14',
      render: (e) => <span className="font-display font-bold text-ink-3">{e.position}</span>,
    },
    {
      key: 'player',
      header: t('leaderboard.player'),
      render: (e) => (
        <Link href={`/players/${e.id}`} className="flex min-w-0 items-center gap-2.5 hover:text-primary">
          <AvatarFrame
            frame={e.equippedFrame}
            name={e.displayName || e.username}
            src={e.avatar ? avatarSrc(e.avatar, 64) : null}
            rank={e.gameRank}
            avatarSize={32}
            bleed
            showBadge={false}
          />
          <span className="truncate font-semibold text-ink-1">{e.displayName || e.username}</span>
          {hasRankBadge(e.gameRank) && <RankBadge rank={e.gameRank} size={16} />}
        </Link>
      ),
    },
    {
      key: 'role',
      header: t('leaderboard.role'),
      align: 'center',
      hideBelow: 'sm',
      render: (e) => <RoleIcon role={e.role} size={18} />,
    },
    {
      key: 'record',
      header: t('leaderboard.record'),
      align: 'center',
      hideBelow: 'md',
      render: (e) => (
        <span className="whitespace-nowrap text-ink-2">
          <span className="text-accent-green">{e.wins ?? 0}{t('leaderboard.winShort')}</span> / <span className="text-accent-red">{e.losses ?? 0}{t('leaderboard.lossShort')}</span>
        </span>
      ),
    },
    {
      key: 'mvp',
      header: <Medal size={14} className="inline" aria-label={t('leaderboard.metric.mvp')} />,
      align: 'center',
      hideBelow: 'lg',
      render: (e) => <span className="text-ink-2">{e.mvpCount ?? 0}</span>,
    },
    {
      key: 'streak',
      header: <Flame size={14} className="inline" aria-label={t('leaderboard.metric.streak')} />,
      align: 'center',
      hideBelow: 'lg',
      render: (e) =>
        (e.streak ?? 0) > 0 ? (
          <Badge variant="green" size="sm">{e.streak}</Badge>
        ) : (
          <span className="text-ink-3">—</span>
        ),
    },
    {
      key: 'metric',
      header: metricLabel,
      align: 'right',
      render: (e) => <span className="whitespace-nowrap font-display text-base font-bold text-primary">{metricValue(e, metric)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.section.community')}
        icon={<Trophy size={20} />}
        variant="gold"
        title={t('leaderboard.title')}
        subtitle={loading ? '…' : `${total} ${t('leaderboard.rankedPlayers')}`}
      />

      {/* Filters */}
      <SectionCard className="!p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="overflow-x-auto overflow-y-hidden">
            <Tabs
              size="sm"
              tabs={METRICS.map((m) => ({ id: m.id, label: t(m.labelKey) }))}
              active={metric}
              onChange={(id: Metric) => setMetric(id)}
              className="whitespace-nowrap"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select value={role} onChange={(e) => setRole(e.target.value)} className={selectClass} aria-label={t('leaderboard.role')}>
              <option value="">{t('leaderboard.allRoles')}</option>
              {MLBB_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={selection === 'current' ? 'current' : seasonId ? seasonId : 'all'}
              onChange={(e) => setSelection(e.target.value)}
              className={selectClass}
              aria-label={t('seasons.switcher.current')}
            >
              <option value="current">{t('seasons.switcher.current')}</option>
              <option value="all">{t('leaderboard.allSeasons')}</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {metric === 'winRate' && (
              <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-ink-2">
                <input
                  type="checkbox"
                  checked={rankedOnly}
                  onChange={(e) => setRankedOnly(e.target.checked)}
                  className="accent-primary"
                />
                {t('leaderboard.minGames')}
              </label>
            )}
          </div>
        </div>
        {seasonId && <p className="mt-2 text-xs text-ink-3">{t('leaderboard.seasonNote')}</p>}
      </SectionCard>

      {loading ? (
        <div className="space-y-6" aria-busy="true">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-lg" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={<Trophy size={26} />} title={t('leaderboard.none')} />
      ) : (
        <>
          {/* Podium */}
          <motion.div
            key={`${metric}-${role}-${seasonId}`}
            className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3"
            variants={reduce ? still : stagger(0.08)}
            initial="hidden"
            animate="visible"
          >
            {podium.map((e, i) => {
              const p = PODIUM[i];
              return (
                <motion.div key={e.id} variants={reduce ? still : fadeUp} className={p.order}>
                  <Link
                    href={`/players/${e.id}`}
                    className={cn(
                      'group relative flex flex-col items-center gap-3 overflow-hidden rounded-lg border bg-surface-1 p-5 shadow-elev-1 transition-[transform,box-shadow,border-color] duration-base ease-out hover:-translate-y-0.5 hover:shadow-elev-2 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1',
                      i === 0 ? 'border-accent-gold/50 shadow-glow-gold' : 'border-line-subtle hover:border-primary/40',
                      i === 0 && 'pt-7'
                    )}
                  >
                    {i === 0 && (
                      <Crown size={22} className="absolute left-1/2 top-2 -translate-x-1/2 text-accent-gold" aria-hidden="true" />
                    )}
                    <AvatarFrame
                      frame={e.equippedFrame}
                      name={e.displayName || e.username}
                      src={e.avatar ? avatarSrc(e.avatar, 192) : null}
                      rank={e.gameRank}
                      tier={p.tier}
                      avatarSize={p.size}
                    />

                    <Badge variant={p.badge} size="sm" className="mt-1">#{e.position}</Badge>

                    <p className="max-w-full truncate text-center font-display text-base font-bold tracking-tight2 text-ink-1">
                      {e.displayName || e.username}
                    </p>

                    <p className={cn('font-display font-bold leading-none num text-primary', i === 0 ? 'text-4xl' : 'text-3xl')}>
                      {metricValue(e, metric)}
                    </p>
                    <p className="-mt-1.5 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{metricLabel}</p>

                    <div className="flex items-center gap-2 text-xs num text-ink-3">
                      <RoleIcon role={e.role} size={14} />
                      {hasRankBadge(e.gameRank) && <RankBadge rank={e.gameRank} size={16} />}
                      <span>
                        <span className="text-accent-green">{e.wins ?? 0}{t('leaderboard.winShort')}</span> / <span className="text-accent-red">{e.losses ?? 0}{t('leaderboard.lossShort')}</span>
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Rest of the ranking */}
          {rest.length > 0 && (
            <DataTable columns={columns} rows={rest} rowKey={(e) => e.id} />
          )}

          {total > entries.length && (
            <p className="flex items-center justify-center gap-2 text-center text-xs text-ink-3">
              <Swords size={12} />
              {t('leaderboard.showing')
                .replace('{shown}', String(entries.length))
                .replace('{total}', String(total))}
            </p>
          )}
        </>
      )}
    </div>
  );
}
