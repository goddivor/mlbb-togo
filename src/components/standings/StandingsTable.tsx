'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/helpers';
import {
  DeltaWindow,
  FormPills,
  RankDelta,
  StandingRow,
  StreakChip,
  TeamAvatar,
  TFn,
  fmtDiff,
} from './bits';

type SortKey =
  | 'rank'
  | 'played'
  | 'wins'
  | 'losses'
  | 'winRate'
  | 'scoreDiff'
  | 'points'
  | 'sos'
  | 'delta';

type Column = {
  key: SortKey | 'team' | 'streak' | 'form';
  labelKey: string;
  hintKey?: string;
  sortable: boolean;
  /** Hidden on small screens unless "advanced columns" is on. */
  advanced?: boolean;
  align: 'left' | 'center' | 'right';
  width?: string;
};

const COLUMNS: Column[] = [
  { key: 'rank', labelKey: 'standings.col.rank', sortable: true, align: 'right', width: 'w-12' },
  { key: 'team', labelKey: 'standings.col.team', sortable: false, align: 'left' },
  { key: 'played', labelKey: 'standings.col.played', hintKey: 'standings.hint.played', sortable: true, align: 'right' },
  { key: 'wins', labelKey: 'standings.col.wins', sortable: true, align: 'right' },
  { key: 'losses', labelKey: 'standings.col.losses', sortable: true, align: 'right' },
  { key: 'winRate', labelKey: 'standings.col.winRate', sortable: true, align: 'right', advanced: true },
  { key: 'scoreDiff', labelKey: 'standings.col.diff', hintKey: 'standings.hint.diff', sortable: true, align: 'right', advanced: true },
  { key: 'points', labelKey: 'standings.col.points', sortable: true, align: 'right' },
  { key: 'delta', labelKey: 'standings.col.delta', hintKey: 'standings.hint.delta', sortable: true, align: 'center', advanced: true },
  { key: 'streak', labelKey: 'standings.col.streak', sortable: false, align: 'center', advanced: true },
  { key: 'form', labelKey: 'standings.col.form', hintKey: 'standings.hint.form', sortable: false, align: 'center', advanced: true },
  { key: 'sos', labelKey: 'standings.col.sos', hintKey: 'standings.hint.sos', sortable: true, align: 'right', advanced: true },
];

const ALIGN: Record<Column['align'], string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/** Value used to sort a row on a column (null-safe). */
export function sortValue(row: StandingRow, key: SortKey, window: DeltaWindow): number {
  if (key === 'delta') return row.delta[window] ?? Number.NEGATIVE_INFINITY;
  if (key === 'sos') return row.sos ?? Number.NEGATIVE_INFINITY;
  return row[key];
}

export function sortRows(rows: StandingRow[], key: SortKey, dir: 'asc' | 'desc', window: DeltaWindow) {
  const sign = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = sortValue(a, key, window);
    const vb = sortValue(b, key, window);
    if (va === vb) return a.rank - b.rank;
    return (va < vb ? -1 : 1) * sign;
  });
}

export default function StandingsTable({
  rows,
  qualifyTop,
  deltaWindow,
  advanced,
  onSelectTeam,
  t,
  accent,
}: {
  rows: StandingRow[];
  qualifyTop: number;
  deltaWindow: DeltaWindow;
  /** Show every column on small screens too. */
  advanced: boolean;
  onSelectTeam?: (row: StandingRow) => void;
  t: TFn;
  accent?: string | null;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => sortRows(rows, sortKey, dir, deltaWindow), [rows, sortKey, dir, deltaWindow]);
  const byRank = sortKey === 'rank' && dir === 'asc';

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    // Numeric columns read best from the highest value; rank from 1.
    setDir(key === 'rank' || key === 'losses' ? 'asc' : 'desc');
  };

  const hideCls = (c: Column) => (c.advanced && !advanced ? 'hidden md:table-cell' : '');

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-2 text-xs uppercase text-bodydark2 dark:bg-meta-4">
            {COLUMNS.map((c) => {
              const active = c.sortable && sortKey === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  className={cn('py-3 px-1.5 sm:px-3 font-medium whitespace-nowrap', ALIGN[c.align], c.width, hideCls(c))}
                  title={c.hintKey ? t(c.hintKey) : undefined}
                  aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key as SortKey)}
                      className={cn(
                        'inline-flex items-center gap-1 uppercase transition-colors hover:text-primary',
                        active && 'text-primary',
                      )}
                    >
                      {t(c.labelKey)}
                      {active ? (
                        dir === 'asc' ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )
                      ) : (
                        <ChevronsUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    t(c.labelKey)
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const divider = byRank && row.rank === qualifyTop && row.rank < rows.length;
            return (
              <tr
                key={row.teamId}
                onClick={onSelectTeam ? () => onSelectTeam(row) : undefined}
                className={cn(
                  'border-t border-stroke transition-colors dark:border-strokedark',
                  row.qualified ? 'bg-success/5 dark:bg-success/10' : '',
                  onSelectTeam && 'cursor-pointer hover:bg-gray-2 dark:hover:bg-meta-4',
                  divider && 'border-b-2 border-b-success',
                )}
              >
                <td className={cn('py-2.5 px-1.5 sm:px-3 tabular-nums', ALIGN.right)}>
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      row.qualified ? 'bg-success text-white' : 'bg-gray text-body dark:bg-meta-4 dark:text-bodydark',
                    )}
                    style={row.qualified && accent ? { backgroundColor: accent } : undefined}
                  >
                    {row.rank}
                  </span>
                </td>
                <td className="py-2.5 px-1.5 sm:px-3">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <TeamAvatar team={row.team} size={30} />
                    <span className="font-semibold text-black dark:text-white truncate max-w-[6.5rem] sm:max-w-none">
                      {row.team.name}
                    </span>
                  </span>
                </td>
                <td className={cn('py-2.5 px-1.5 sm:px-3 tabular-nums', ALIGN.right)}>{row.played}</td>
                <td className={cn('py-2.5 px-1.5 sm:px-3 tabular-nums text-success font-medium', ALIGN.right)}>{row.wins}</td>
                <td className={cn('py-2.5 px-1.5 sm:px-3 tabular-nums text-danger font-medium', ALIGN.right)}>{row.losses}</td>
                <td className={cn('py-2.5 px-1.5 sm:px-3 tabular-nums', ALIGN.right, hideCls(COLUMNS[5]))}>{row.winRate}%</td>
                <td
                  className={cn(
                    'py-2.5 px-1.5 sm:px-3 tabular-nums',
                    ALIGN.right,
                    hideCls(COLUMNS[6]),
                    row.scoreDiff > 0 ? 'text-success' : row.scoreDiff < 0 ? 'text-danger' : '',
                  )}
                >
                  {fmtDiff(row.scoreDiff)}
                </td>
                <td className={cn('py-2.5 px-1.5 sm:px-3 tabular-nums font-bold text-black dark:text-white', ALIGN.right)}>
                  {row.points}
                </td>
                <td className={cn('py-2.5 px-1.5 sm:px-3', ALIGN.center, hideCls(COLUMNS[8]))}>
                  <RankDelta value={row.delta[deltaWindow]} t={t} />
                </td>
                <td className={cn('py-2.5 px-1.5 sm:px-3', ALIGN.center, hideCls(COLUMNS[9]))}>
                  <StreakChip streak={row.streak} t={t} />
                </td>
                <td className={cn('py-2.5 px-1.5 sm:px-3', ALIGN.center, hideCls(COLUMNS[10]))}>
                  <FormPills form={row.form} t={t} />
                </td>
                <td className={cn('py-2.5 px-1.5 sm:px-3 tabular-nums', ALIGN.right, hideCls(COLUMNS[11]))}>
                  {row.sos == null ? '-' : `${row.sos}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
