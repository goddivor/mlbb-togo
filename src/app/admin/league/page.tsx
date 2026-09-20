'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ExternalLink, Flag, RefreshCw, Sparkles, Settings2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { useSeasonStore, useSelectedSeason } from '@/store/useSeasonStore';
import { Button, Card, EmptyState, LoadingSpinner, PageHeader } from '@/components/ui';
import SeasonSwitcher from '@/components/seasons/SeasonSwitcher';
import { SeasonStatusBadge, seasonPeriod, fmtSeasonDate } from '@/components/seasons/shared';
import { useSeasonLifecycle } from '@/components/admin/seasons/useSeasonLifecycle';
import SeasonLifecycleButtons from '@/components/admin/seasons/SeasonLifecycleButtons';
import SeasonLifecycleModals from '@/components/admin/seasons/SeasonLifecycleModals';
import type { LeagueOverview } from '@/components/admin/league/types';
import {
  AnnounceWidget,
  AwardsWidget,
  ChecklistWidget,
  Kpi,
  RecomputeWidget,
  SponsorsWidget,
  StandingsWidget,
  StreamWidget,
} from '@/components/admin/league/widgets';

/**
 * League control room (#56): one screen to pilot the current season. Every
 * block deep-links into the dedicated admin page (seasons, matches, awards,
 * sponsors, stream) instead of duplicating it.
 */
export default function AdminLeaguePage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const { selection, ready } = useSelectedSeason();
  const refreshSeasons = useSeasonStore((s) => s.load);
  // `current` / `all` -> let the API resolve the current season.
  const seasonKey = selection === 'current' || selection === 'all' ? null : selection;

  const [overview, setOverview] = useState<LeagueOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const data = (await api.admin.league.overview(seasonKey)) as LeagueOverview;
        setOverview(data?.season ? data : null);
        setError(null);
      } catch (e: any) {
        setOverview(null);
        setError(e?.message || t('admin.esport.errorGeneric'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seasonKey],
  );

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  // Lifecycle actions refresh both the overview and the global season list.
  const lifecycle = useSeasonLifecycle(async () => {
    await refreshSeasons(true);
    await load(true);
  });

  const season = overview?.season ?? null;
  const period = season ? seasonPeriod(season, lang) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Flag size={28} />}
        title={t('admin.league.title')}
        subtitle={t('admin.league.subtitle')}
        variant="cyan"
        action={
          <div className="flex items-center gap-2">
            <SeasonSwitcher variant="admin" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => load(true)}
              disabled={refreshing || loading}
              title={t('admin.league.refresh')}
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </Button>
          </div>
        }
      />

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : !overview || !season ? (
        <EmptyState
          icon={<CalendarDays size={28} />}
          title={t('admin.league.noSeason')}
          description={error ?? undefined}
          action={
            <Link href="/admin/seasons">
              <Button size="sm">
                <CalendarDays size={14} /> {t('admin.league.goSeasons')}
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Season strip */}
          <Card
            className="!p-0 overflow-hidden"
            style={season.color ? { borderLeft: `4px solid ${season.color}` } : undefined}
          >
            <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {season.number != null && (
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-bodydark2">
                      {t('seasons.numberLabel', { n: season.number })}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-black dark:text-white truncate">{season.name}</h3>
                  <SeasonStatusBadge status={season.status} t={t} />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-body dark:text-bodydark">
                  {season.theme && (
                    <span className="inline-flex items-center gap-1">
                      <Sparkles size={12} className="text-warning" /> {season.theme}
                    </span>
                  )}
                  {period && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={12} /> {period}
                    </span>
                  )}
                  {season.playoffsStartDate && (
                    <span className="inline-flex items-center gap-1">
                      <Flag size={12} /> {t('seasons.playoffsFrom', { date: fmtSeasonDate(season.playoffsStartDate, lang) || '' })}
                    </span>
                  )}
                  {season.slogan && <span className="italic">« {season.slogan} »</span>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <SeasonLifecycleButtons season={season} lifecycle={lifecycle} />
                <Link href="/admin/seasons">
                  <Button size="sm" variant="ghost" title={t('admin.league.goSeasons')}>
                    <Settings2 size={14} /> {t('admin.league.goSeasons')}
                  </Button>
                </Link>
                {season.slug && (
                  <Link
                    href={`/seasons/${season.slug}`}
                    target="_blank"
                    className="inline-flex items-center px-2 py-1.5 rounded-md text-body hover:bg-gray dark:text-bodydark dark:hover:bg-meta-4"
                    title={t('seasons.viewPublic')}
                  >
                    <ExternalLink size={14} />
                  </Link>
                )}
              </div>
            </div>
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <Kpi label={t('admin.league.kpi.teams')} value={overview.teams} href="/admin/esport" />
            <Kpi
              label={t('admin.league.kpi.matches')}
              value={`${overview.matches.byStatus.completed}/${overview.matches.total}`}
              hint={t('admin.league.kpi.matchesHint', {
                league: overview.matches.byStage.league,
                playoff: overview.matches.byStage.playoff,
                scrim: overview.matches.byStage.scrim,
              })}
              href={`/admin/matches?season=${encodeURIComponent(season.id)}`}
            />
            <Kpi
              label={t('admin.league.kpi.thisWeek')}
              value={overview.matches.completedThisWeek}
              tone="success"
              href={`/admin/matches?season=${encodeURIComponent(season.id)}&status=completed`}
            />
            <Kpi
              label={t('admin.league.kpi.pendingResults')}
              value={overview.matches.pendingResults}
              tone={overview.matches.pendingResults ? 'warning' : 'default'}
              href={`/admin/matches?season=${encodeURIComponent(season.id)}&status=pending`}
            />
            <Kpi
              label={t('admin.league.kpi.unscheduled')}
              value={overview.matches.unscheduled}
              tone={overview.matches.unscheduled ? 'warning' : 'default'}
              href={`/admin/matches?season=${encodeURIComponent(season.id)}&status=scheduled`}
            />
            <Kpi
              label={t('admin.league.kpi.overdue')}
              value={overview.matches.overdue}
              tone={overview.matches.overdue ? 'danger' : 'default'}
              href={`/admin/matches?season=${encodeURIComponent(season.id)}&status=scheduled`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              <ChecklistWidget overview={overview} onClose={() => lifecycle.openClose(season)} />
              <StandingsWidget overview={overview} />
              <AnnounceWidget onPublished={() => load(true)} />
            </div>
            <div className="space-y-4">
              <AwardsWidget overview={overview} />
              <RecomputeWidget overview={overview} seasonKey={seasonKey} onDone={() => load(true)} />
              <SponsorsWidget overview={overview} />
              <StreamWidget overview={overview} />
              <Card className="!p-5">
                <p className="text-xs text-body dark:text-bodydark">
                  {t('admin.league.announcements.week', { n: overview.announcements.last7Days })}
                </p>
                <p className="mt-1 text-[11px] text-bodydark2">
                  {t('admin.league.generatedAt', { date: new Date(overview.generatedAt).toLocaleString() })}
                </p>
              </Card>
            </div>
          </div>
        </>
      )}

      <SeasonLifecycleModals lifecycle={lifecycle} />
    </div>
  );
}
