'use client';

import { useEffect, useState } from 'react';
import { History, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { Badge, Button, EmptyState, LoadingSpinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useLangStore } from '@/store/useStore';
import { useSelectedSeason } from '@/store/useSeasonStore';
import SeasonSwitcher from '@/components/seasons/SeasonSwitcher';
import { ResultBadge, TeamChip, RESULT_BORDER, fmtDate, type TFn } from './shared';

const PAGE_SIZE = 10;

export function HistoryRow({ m, t, lang }: { m: any; t: TFn; lang: string }) {
  const border = RESULT_BORDER[m.result] || RESULT_BORDER.D;
  return (
    <div className={`flex items-center gap-3 rounded-sm border border-l-4 border-stroke bg-white p-3 shadow-default dark:border-strokedark dark:bg-boxdark ${border}`}>
      <ResultBadge result={m.result} t={t} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-bold tabular-nums text-black dark:text-white">{m.scoreFor} - {m.scoreAgainst}</span>
          <span className="text-xs text-bodydark2">{t('teams.schedule.vs')}</span>
          <TeamChip team={m.opponent} size={6} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-body dark:text-bodydark">
          <Badge variant="purple" size="sm">{t('matchType.' + (m.type || 'friendly'))}</Badge>
          {m.season && <Badge variant="gold" size="sm" className="gap-1"><Award size={11} /> {m.season}</Badge>}
          {m.date && <span className="text-bodydark2">{fmtDate(m.date, lang)}</span>}
        </div>
      </div>
    </div>
  );
}

export default function TeamHistory({ teamId, t }: { teamId: string; t: TFn }) {
  const lang = useLangStore((s: any) => s.lang);
  // Follows the global season switcher ("all" = full history).
  const { seasonId, season, ready: seasonsReady } = useSelectedSeason();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Back to the first page whenever the season changes.
  useEffect(() => {
    setPage(1);
  }, [seasonId]);

  useEffect(() => {
    if (!teamId || !seasonsReady) return;
    let alive = true;
    setLoading(true);
    api.esport
      .teamHistory(teamId, page, PAGE_SIZE, seasonId ?? undefined)
      .then((d: any) => { if (alive) setData(d); })
      .catch(() => { if (alive) setData(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [teamId, page, seasonId, seasonsReady]);

  if ((loading && !data) || !seasonsReady) return <LoadingSpinner size="lg" className="py-12" />;

  const items: any[] = Array.isArray(data?.items) ? data.items : [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  const filterBar = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs text-body dark:text-bodydark">
        {season ? t('teams.history.seasonFilter', { season: season.name }) : t('teams.history.allSeasons')}
      </span>
      <SeasonSwitcher variant="inline" />
    </div>
  );

  if (total === 0) {
    return (
      <div className="space-y-3">
        {filterBar}
        <EmptyState icon={<History size={28} />} title={t('teams.history.empty')} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filterBar}
      <div className="flex items-center justify-between text-xs text-body dark:text-bodydark">
        <span>{t('teams.history.total', { n: total })}</span>
        <span>{t('teams.history.page', { page, pages })}</span>
      </div>
      <div className={`space-y-2 ${loading ? 'opacity-60' : ''}`}>
        {items.map((m) => <HistoryRow key={m.id} m={m} t={t} lang={lang} />)}
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <Button size="sm" variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft size={14} /> {t('teams.history.prev')}
          </Button>
          <Button size="sm" variant="secondary" disabled={page >= pages || loading} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
            {t('teams.history.next')} <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
