'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, ListOrdered, Lock, SlidersHorizontal, Swords, Shield, Trophy, Crown } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { useSelectedSeason } from '@/store/useSeasonStore';
import { Badge, Button, EmptyState, PageHeader, SectionCard, Skeleton, StatCard, Tabs } from '@/components/ui';
import { TeamAvatar } from '@/components/standings/bits';
import { cn } from '@/lib/helpers';
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
  const leader = rows.find((r) => r.rank === 1) ?? null;
  const seasonColor = data?.season.color || season?.color || null;

  const exportPdf = () => {
    if (!seasonId) return;
    window.open(api.standings.exportUrl(seasonId, type, lang), '_blank', 'noopener');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={season ? season.name : t('nav.section.esport')}
        icon={<ListOrdered size={20} />}
        variant="purple"
        title={t('standings.title')}
        subtitle={t('standings.subtitle')}
        action={
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={!seasonId || rows.length === 0}>
            <Download size={14} />
            {t('standings.export')}
          </Button>
        }
      />

      {/* Season strip + KPIs */}
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
              size="sm"
              tabs={tabs}
              active={type}
              onChange={(id: StandingsType) => {
                setTypeTouched(true);
                setType(id);
              }}
            />
            <Tabs
              size="sm"
              tabs={(['d7', 'd30'] as DeltaWindow[]).map((w) => ({ id: w, label: t(w === 'd7' ? 'standings.delta.7d' : 'standings.delta.30d') }))}
              active={deltaWindow}
              onChange={(w: DeltaWindow) => setDeltaWindow(w)}
            />
            <Button
              size="sm"
              variant={advanced ? 'primary' : 'outline'}
              onClick={() => setAdvanced((v) => !v)}
              className="md:hidden"
              aria-pressed={advanced}
            >
              <SlidersHorizontal size={14} />
              {t('standings.advanced')}
            </Button>
          </div>
        </div>
      </SectionCard>

      {!ready || loading ? (
        <div className="space-y-6" aria-busy="true">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
          </div>
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      ) : !seasonId ? (
        <EmptyState icon={<ListOrdered size={26} />} title={t('standings.noSeason')} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<ListOrdered size={26} />} title={t('standings.empty')} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Crown size={18} />}
              accent="gold"
              label={t('standings.col.rank') + ' 1'}
              value={
                leader ? (
                  <span className="flex items-center gap-2 text-xl">
                    <TeamAvatar team={leader.team} size={28} />
                    <span className="truncate">{leader.team.name}</span>
                  </span>
                ) : '—'
              }
              hint={leader ? `${leader.points} ${t('standings.col.points')} · ${leader.wins}-${leader.losses}` : undefined}
            />
            <StatCard icon={<Shield size={18} />} label={t('standings.col.team')} value={rows.length} />
            <StatCard icon={<Swords size={18} />} accent="violet" label={t('standings.tab.' + type)} value={data?.meta.matches.scoped ?? 0} hint={t('standings.matchesCount', { n: data?.meta.matches.scoped ?? 0 })} />
            <StatCard icon={<Trophy size={18} />} accent="green" label={t('standings.qualifyZone', { n: qualifyTop })} value={`${t('standings.col.rank')} 1-${qualifyTop}`} />
          </div>

        <SectionCard className="!p-0 overflow-hidden" style={seasonColor ? { borderTopColor: seasonColor, borderTopWidth: 2 } : undefined}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-subtle px-4 py-3 text-xs text-ink-2">
            <span className="inline-flex items-center gap-2">
              <span className={cn('inline-block h-3 w-3 rounded-sm bg-accent-green/70')} style={seasonColor ? { backgroundColor: seasonColor } : undefined} />
              {t('standings.qualifyZone', { n: qualifyTop })}
            </span>
            <span className="hidden sm:inline">{t('standings.clickTeam')}</span>
          </div>
          {data?.frozen && (
            <p className="border-b border-line-subtle bg-accent-gold/5 px-4 py-2 text-xs text-accent-gold">
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
          <div className="flex flex-col gap-1 border-t border-line-subtle px-4 py-3 text-[11px] text-ink-3 sm:flex-row sm:flex-wrap sm:gap-x-4">
            <span>{t('standings.tieBreakers')}</span>
            {data && <span>{t('standings.pointsRule', data.settings.points)}</span>}
            {data && <span>{t('standings.matchesCount', { n: data.meta.matches.scoped })}</span>}
            <span className="md:hidden">{t('standings.sortHint')}</span>
          </div>
        </SectionCard>
        </>
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
