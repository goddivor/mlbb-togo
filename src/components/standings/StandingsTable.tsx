'use client';

import { useMemo, useState } from 'react';
import { Table, Td, Th } from '@/components/ui';
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

  const cell = 'px-1.5 py-2.5 sm:px-3';

  return (
    <div className="overflow-x-auto">
      <Table>
        <thead className="bg-surface-2">
          <tr className="border-b border-line-subtle">
            {COLUMNS.map((c) => {
              const active = c.sortable && sortKey === c.key;
              return (
                <Th
                  key={c.key}
                  align={c.align}
                  sortable={c.sortable}
                  sorted={active ? dir : null}
                  onSort={() => toggleSort(c.key as SortKey)}
                  className={cn(cell, c.width, hideCls(c))}
                  title={c.hintKey ? t(c.hintKey) : undefined}
                >
                  {t(c.labelKey)}
                </Th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const divider = byRank && row.rank === qualifyTop && row.rank < rows.length;
            const podium = byRank && row.rank === 1;
            return (
              <tr
                key={row.teamId}
                onClick={onSelectTeam ? () => onSelectTeam(row) : undefined}
                className={cn(
                  'border-b border-line-subtle transition-colors duration-fast last:border-b-0',
                  row.qualified && 'bg-accent-green/5',
                  onSelectTeam && 'cursor-pointer hover:bg-primary/5',
                  divider && 'border-b-2 border-b-accent-green',
                )}
              >
                <Td align="right" className={cell}>
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded cut-corners-sm font-display text-xs font-bold',
                      row.qualified ? 'bg-accent-green text-white' : 'bg-surface-3 text-ink-2',
                      podium && 'shadow-glow-cyan',
                    )}
                    style={row.qualified && accent ? { backgroundColor: accent } : undefined}
                  >
                    {row.rank}
                  </span>
                </Td>
                <Td className={cell}>
                  <span className="flex min-w-0 items-center gap-2.5">
                    <TeamAvatar team={row.team} size={30} />
                    <span className={cn('truncate font-semibold text-ink-1 max-w-[6.5rem] sm:max-w-none', podium && 'font-display')}>
                      {row.team.name}
                    </span>
                  </span>
                </Td>
                <Td align="right" className={cn(cell, 'text-ink-2')}>{row.played}</Td>
                <Td align="right" className={cn(cell, 'font-medium text-accent-green')}>{row.wins}</Td>
                <Td align="right" className={cn(cell, 'font-medium text-accent-red')}>{row.losses}</Td>
                <Td align="right" className={cn(cell, 'text-ink-2', hideCls(COLUMNS[5]))}>{row.winRate}%</Td>
                <Td
                  align="right"
                  className={cn(
                    cell,
                    hideCls(COLUMNS[6]),
                    row.scoreDiff > 0 ? 'text-accent-green' : row.scoreDiff < 0 ? 'text-accent-red' : 'text-ink-2',
                  )}
                >
                  {fmtDiff(row.scoreDiff)}
                </Td>
                <Td align="right" className={cn(cell, 'font-display text-base font-bold')}>
                  {row.points}
                </Td>
                <Td align="center" className={cn(cell, hideCls(COLUMNS[8]))}>
                  <RankDelta value={row.delta[deltaWindow]} t={t} />
                </Td>
                <Td align="center" className={cn(cell, hideCls(COLUMNS[9]))}>
                  <StreakChip streak={row.streak} t={t} />
                </Td>
                <Td align="center" className={cn(cell, hideCls(COLUMNS[10]))}>
                  <FormPills form={row.form} t={t} />
                </Td>
                <Td align="right" className={cn(cell, 'text-ink-2', hideCls(COLUMNS[11]))}>
                  {row.sos == null ? '-' : `${row.sos}%`}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
