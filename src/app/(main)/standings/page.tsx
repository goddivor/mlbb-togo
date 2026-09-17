'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, ListOrdered, Lock, SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { useSelectedSeason } from '@/store/useSeasonStore';
import { Badge, Button, EmptyState, LoadingSpinner, PageHeader, SectionCard, Tabs } from '@/components/ui';
import SeasonSwitcher from '@/components/seasons/SeasonSwitcher';
import { SeasonStatusBadge, fmtSeasonDate } from '@/components/seasons/shared';
import StandingsTable from '@/components/standings/StandingsTable';
import H2HModal from '@/components/standings/H2HModal';
import type { DeltaWindow, StandingRow, StandingsPayload, StandingsType } from '@/components/standings/bits';

const TYPES: StandingsType[] = ['league', 'playoff', 'all'];

export default function StandingsPage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang) as string;
  const { season, seasonId, ready } = useSelectedSeason();

  const [type, setType] = useState<StandingsType>('league');
  const [typeTouched, setTypeTouched] = useState(false);
  const [deltaWindow, setDeltaWindow] = useState<DeltaWindow>('d7');
  const [advanced, setAdvanced] = useState(false);
  const [data, setData] = useState<StandingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StandingRow['team'] | null>(null);

  // A closed season opens on its frozen table (built on every match).
  useEffect(() => {
    if (!season || typeTouched) return;
    setType(season.status === 'closed' ? 'all' : 'league');
  }, [season, typeTouched]);

  const load = useCallback(() => {
    if (!ready) return;
    if (!seasonId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.standings
      .get(seasonId, type)
      .then((res: StandingsPayload | null) => setData(res && Array.isArray(res.rows) ? res : null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ready, seasonId, type]);

  useEffect(() => {
    load();
  }, [load]);

  const tabs = useMemo(() => TYPES.map((id) => ({ id, label: t('standings.tab.' + id) })), [t]);

  const qualifyTop = data?.settings.qualifyTop ?? 4;
  const rows = data?.rows ?? [];
  const frozenDate = data?.frozenAt ? fmtSeasonDate(data.frozenAt, lang) : null;

  const exportPdf = () => {
    if (!seasonId) return;
    window.open(api.standings.exportUrl(seasonId, type, lang), '_blank', 'noopener');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('standings.title')}
        subtitle={t('standings.subtitle')}
        action={
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={!seasonId || rows.length === 0}>
            <Download size={14} />
            {t('standings.export')}
          </Button>
        }
      />

      <SectionCard className="!p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <SeasonSwitcher variant="inline" allowAll={false} />
            {season && <SeasonStatusBadge status={season.status} t={t} />}
            {data?.frozen && (
              <Badge variant="gold" size="sm" className="gap-1">
                <Lock size={12} />
                {t('standings.frozen')}
                {frozenDate ? ` · ${frozenDate}` : ''}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              tabs={tabs}
              active={type}
              onChange={(id: StandingsType) => {
                setTypeTouched(true);
                setType(id);
              }}
            />
            <div className="inline-flex rounded-sm border border-stroke bg-white p-1 dark:border-strokedark dark:bg-boxdark">
              {(['d7', 'd30'] as DeltaWindow[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setDeltaWindow(w)}
                  className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
                    deltaWindow === w ? 'bg-primary text-white' : 'text-body hover:bg-gray dark:text-bodydark dark:hover:bg-meta-4'
                  }`}
                  title={t('standings.hint.delta')}
                >
                  {t(w === 'd7' ? 'standings.delta.7d' : 'standings.delta.30d')}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAdvanced((v) => !v)}
              className={`md:hidden inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
                advanced
                  ? 'border-primary bg-primary text-white'
                  : 'border-stroke bg-white text-body dark:border-strokedark dark:bg-boxdark dark:text-bodydark'
              }`}
              aria-pressed={advanced}
            >
              <SlidersHorizontal size={14} />
              {t('standings.advanced')}
            </button>
          </div>
        </div>
      </SectionCard>

      {!ready || loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : !seasonId ? (
        <EmptyState icon={<ListOrdered size={26} />} title={t('standings.noSeason')} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<ListOrdered size={26} />} title={t('standings.empty')} />
      ) : (
        <SectionCard className="!p-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke px-4 py-3 text-xs text-body dark:border-strokedark dark:text-bodydark">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm bg-success/60" />
              {t('standings.qualifyZone', { n: qualifyTop })}
            </span>
            <span className="hidden sm:inline">{t('standings.clickTeam')}</span>
          </div>
          {data?.frozen && (
            <p className="border-b border-stroke bg-warning/5 px-4 py-2 text-xs text-warning dark:border-strokedark">
              {t('standings.frozenHint')}
            </p>
          )}
          <StandingsTable
            rows={rows}
            qualifyTop={qualifyTop}
            deltaWindow={deltaWindow}
            advanced={advanced}
            onSelectTeam={(row) => setSelected(row.team)}
            t={t}
            accent={data?.season.color}
          />
          <div className="flex flex-col gap-1 border-t border-stroke px-4 py-3 text-[11px] text-bodydark2 dark:border-strokedark sm:flex-row sm:flex-wrap sm:gap-x-4">
            <span>{t('standings.tieBreakers')}</span>
            {data && <span>{t('standings.pointsRule', data.settings.points)}</span>}
            {data && <span>{t('standings.matchesCount', { n: data.meta.matches.scoped })}</span>}
            <span className="md:hidden">{t('standings.sortHint')}</span>
          </div>
        </SectionCard>
      )}

      {seasonId && (
        <H2HModal
          open={!!selected}
          onClose={() => setSelected(null)}
          seasonId={seasonId}
          type={type}
          team={selected}
          t={t}
          lang={lang}
        />
      )}
    </div>
  );
}
