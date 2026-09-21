'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { avatarSrc, mlbbImg } from '@/lib/api';
import { Table, Td, Th } from '@/components/ui';
import { cn } from '@/lib/helpers';
import { useSelectedSeason } from '@/store/useSeasonStore';
import RoleIcon from '@/components/game/RoleIcon';

/* ------------------------------------------------------------------ */
/* Season scope shared by every tab                                    */
/* ------------------------------------------------------------------ */

/**
 * Maps the global season switcher to the `seasonId` query the league-stats
 * API expects ('current', 'all' or a season id).
 */
export function useStatsScope() {
  const { selection, season, seasons, current, ready, setSelection } = useSelectedSeason();
  const scope = selection === 'all' ? 'all' : selection === 'current' ? 'current' : season?.id ?? 'all';
  return { scope, selection, setSelection, season, seasons, current, ready };
}

export type TeamRef = { id: string; name: string; image?: string | null };
export type UserRef = { id: string; username: string; displayName?: string | null; avatar?: string | null };
export type HeroRef = { name: string; image?: string | null; role?: string | null; count?: number };

export const fmt = (n: number | null | undefined, digits = 1) =>
  n === null || n === undefined ? '–' : Number.isInteger(n) ? String(n) : n.toFixed(digits);

export const fmtInt = (n: number | null | undefined, lang = 'fr') =>
  n === null || n === undefined ? '–' : new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'fr-FR').format(Math.round(n));

/* ------------------------------------------------------------------ */
/* Cells                                                               */
/* ------------------------------------------------------------------ */

export function TeamLogo({ team, size = 32 }: { team: TeamRef; size?: number }) {
  if (team.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.image}
        alt={team.name}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className="shrink-0 rounded cut-corners-sm bg-surface-2 object-cover ring-1 ring-inset ring-line-subtle"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded cut-corners-sm bg-surface-3 text-xs font-bold text-ink-2"
    >
      {team.name?.slice(0, 2).toUpperCase() || '?'}
    </div>
  );
}

export function TeamCell({ team, size = 32, muted = false }: { team: TeamRef; size?: number; muted?: boolean }) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className={`inline-flex min-w-0 items-center gap-2.5 transition-colors hover:text-primary ${
        muted ? 'text-xs text-ink-2' : 'font-semibold text-ink-1'
      }`}
    >
      <TeamLogo team={team} size={size} />
      <span className="truncate">{team.name}</span>
    </Link>
  );
}

export function PlayerAvatar({ user, size = 32 }: { user: UserRef; size?: number }) {
  const name = user.displayName || user.username || '';
  if (user.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarSrc(user.avatar, size * 2)}
        alt={name}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className="shrink-0 rounded cut-corners-sm object-cover ring-1 ring-inset ring-line-subtle"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded cut-corners-sm bg-surface-3 text-xs font-bold text-ink-2"
    >
      {name[0]?.toUpperCase() || 'J'}
    </div>
  );
}

export function PlayerCell({ user, team, size = 32 }: { user: UserRef; team?: TeamRef | null; size?: number }) {
  const name = user.displayName || user.username;
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Link href={`/players/${user.id}`} className="shrink-0">
        <PlayerAvatar user={user} size={size} />
      </Link>
      <div className="min-w-0">
        <Link
          href={`/players/${user.id}`}
          className="block truncate font-semibold text-ink-1 transition-colors hover:text-primary"
        >
          {name}
        </Link>
        {team && (
          <Link
            href={`/teams/${team.id}`}
            className="flex items-center gap-1 truncate text-[11px] text-ink-3 hover:text-primary"
          >
            <TeamLogo team={team} size={14} />
            <span className="truncate">{team.name}</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export function HeroThumb({ hero, size = 28, className = '' }: { hero: HeroRef; size?: number; className?: string }) {
  if (hero.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={mlbbImg(hero.image, size * 2)}
        alt={hero.name}
        title={hero.name}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-full object-cover ring-1 ring-inset ring-line-subtle ${className}`}
      />
    );
  }
  return (
    <div
      title={hero.name}
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-surface-3 text-[10px] font-bold text-ink-2 ${className}`}
    >
      {hero.name?.[0] ?? '?'}
    </div>
  );
}

/** Row of hero thumbnails with a pick count badge. */
export function HeroChips({ heroes }: { heroes: HeroRef[] }) {
  if (!heroes.length) return <span className="text-ink-3">–</span>;
  return (
    <div className="flex items-center gap-1.5">
      {heroes.map((h) => (
        <span key={h.name} className="relative" title={`${h.name}${h.count ? ` · ${h.count}` : ''}`}>
          <HeroThumb hero={h} size={28} />
          {h.count !== undefined && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-ink-1 px-1 text-[9px] font-bold num leading-4 text-surface-0">
              {h.count}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export function LaneCell({ role }: { role?: string | null }) {
  if (!role) return <span className="text-ink-3">–</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <RoleIcon role={role} size={16} />
      <span className="capitalize">{role}</span>
    </span>
  );
}

export function WinRateBar({ value }: { value: number }) {
  const color = value >= 60 ? 'bg-accent-green' : value >= 45 ? 'bg-accent-cyan' : 'bg-accent-red';
  return (
    <div className="flex min-w-[6rem] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="w-12 text-right font-display font-bold num">{fmt(value)}%</span>
    </div>
  );
}

/** Small info icon with a hover / focus tooltip (used for data sources). */
export function InfoTip({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <span className="relative inline-flex group">
      {/* A span (not a button): the tip may sit inside a sortable header button. */}
      <span
        tabIndex={0}
        role="img"
        aria-label={label ?? 'info'}
        className="inline-flex cursor-help items-center justify-center rounded-full text-ink-3 hover:text-primary focus:text-primary focus:outline-none"
      >
        <Info size={14} />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 w-64 -translate-x-1/2 rounded border border-line-strong bg-surface-1 p-2.5 text-left text-xs font-normal normal-case tracking-normal text-ink-2 shadow-elev-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Sortable table                                                      */
/* ------------------------------------------------------------------ */

export type Column<T> = {
  key: string;
  label: ReactNode;
  /** Value used for sorting (numbers sort desc first, strings asc first). */
  value?: (row: T) => number | string | null | undefined;
  render: (row: T, index: number) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  /** Hide below the `md` breakpoint to keep the table readable on phones. */
  hideOnMobile?: boolean;
};

export function SortableTable<T>({
  columns,
  rows,
  rowKey,
  defaultSort,
  highlight,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
  /** Column key rendered with an accent (the current ranking metric). */
  highlight?: string;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(defaultSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.value) return rows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = col.value!(a);
      const vb = col.value!(b);
      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [rows, sort, columns]);

  const toggle = (col: Column<T>) => {
    if (!col.value) return;
    setSort((s) => {
      if (s?.key !== col.key) {
        // Numbers start from the top, labels from A.
        const sample = rows.length ? col.value!(rows[0]) : null;
        return { key: col.key, dir: typeof sample === 'string' ? 'asc' : 'desc' };
      }
      return { key: col.key, dir: s.dir === 'desc' ? 'asc' : 'desc' };
    });
  };

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[640px]">
        <thead className="bg-surface-2">
          <tr className="border-b border-line-subtle">
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <Th
                  key={c.key}
                  align={c.align}
                  sortable={!!c.value}
                  sorted={active ? sort!.dir : null}
                  onSort={() => toggle(c)}
                  className={cn(
                    'py-3',
                    c.hideOnMobile && 'hidden md:table-cell',
                    c.className,
                    highlight === c.key && 'text-primary'
                  )}
                >
                  {c.label}
                </Th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={rowKey(row)}
              className={cn(
                'border-b border-line-subtle last:border-0 transition-colors duration-fast hover:bg-surface-2/60',
                i % 2 === 1 && 'bg-surface-2/40'
              )}
            >
              {columns.map((c) => (
                <Td
                  key={c.key}
                  align={c.align}
                  className={cn(
                    'py-2.5',
                    c.hideOnMobile && 'hidden md:table-cell',
                    c.className,
                    highlight === c.key && 'font-display font-bold text-primary'
                  )}
                >
                  {c.render(row, i)}
                </Td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export function RankBubble({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? 'tier-gold'
      : rank === 2
        ? 'tier-silver'
        : rank === 3
          ? 'tier-bronze'
          : 'bg-surface-3 text-ink-2';
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded cut-corners-sm font-display text-xs font-bold num ${tone}`}>
      {rank}
    </span>
  );
}
