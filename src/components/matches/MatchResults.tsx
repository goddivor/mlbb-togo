'use client';

import { useMemo } from 'react';
import { Swords } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import MatchCard from './MatchCard';
import { DisplayStatus, EsportMatch, MatchTeam, TFn, displayStatus } from './shared';

const selectCls =
  'rounded-sm border border-stroke bg-gray-2 py-2 pl-3 pr-8 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white';

export type ResultsFilter = { teamId: string; status: '' | DisplayStatus };

/**
 * Results view: every match of the selection, newest first, with team and
 * status filters applied client side (the list is already season/stage
 * scoped by the API).
 */
export default function MatchResults({
  matches,
  filter,
  onFilterChange,
  t,
  lang,
}: {
  matches: EsportMatch[];
  filter: ResultsFilter;
  onFilterChange: (f: ResultsFilter) => void;
  t: TFn;
  lang: string;
}) {
  const teams = useMemo(() => {
    const map = new Map<string, MatchTeam>();
    for (const m of matches) {
      if (m.teamA?.id) map.set(m.teamA.id, m.teamA);
      if (m.teamB?.id) map.set(m.teamB.id, m.teamB);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [matches]);

  const list = useMemo(() => {
    const out = matches.filter((m) => {
      if (filter.teamId && m.teamA?.id !== filter.teamId && m.teamB?.id !== filter.teamId) return false;
      if (filter.status && displayStatus(m) !== filter.status) return false;
      return true;
    });
    // Newest first; undated matches at the end.
    return out.sort((a, b) => {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : -Infinity;
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : -Infinity;
      return tb - ta;
    });
  }, [matches, filter]);

  const statuses: ('' | DisplayStatus)[] = ['', 'completed', 'live', 'scheduled', 'cancelled'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={selectCls}
          value={filter.teamId}
          onChange={(e) => onFilterChange({ ...filter, teamId: e.target.value })}
          aria-label={t('matches.filters.team')}
        >
          <option value="">{t('matches.filters.allTeams')}</option>
          {teams.map((tm) => (
            <option key={tm.id} value={tm.id}>
              {tm.name}
            </option>
          ))}
        </select>
        <select
          className={selectCls}
          value={filter.status}
          onChange={(e) => onFilterChange({ ...filter, status: e.target.value as ResultsFilter['status'] })}
          aria-label={t('matches.filters.status')}
        >
          {statuses.map((s) => (
            <option key={s || 'all'} value={s}>
              {s ? t('matches.status.' + s) : t('matches.filters.allStatuses')}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-body dark:text-bodydark">
          {t('matches.results.count', { n: list.length })}
        </span>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Swords size={28} />} title={t('matches.results.empty')} description={t('matches.results.emptyHint')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {list.map((m) => (
            <MatchCard key={m.id} match={m} t={t} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
