'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown, Info } from 'lucide-react';
import { avatarSrc, mlbbImg } from '@/lib/api';
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

export const fmtInt = (n: number | null | undefined) =>
  n === null || n === undefined ? '–' : new Intl.NumberFormat('fr-FR').format(Math.round(n));

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
        className="shrink-0 rounded-md object-cover border border-stroke bg-white dark:border-strokedark dark:bg-boxdark-2"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="shrink-0 rounded-md bg-primary/15 text-primary flex items-center justify-center text-xs font-bold"
    >
      {team.name?.slice(0, 2).toUpperCase() || '?'}
    </div>
  );
}

export function TeamCell({ team, size = 32, muted = false }: { team: TeamRef; size?: number; muted?: boolean }) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className={`inline-flex items-center gap-2.5 min-w-0 hover:text-primary transition-colors ${
        muted ? 'text-body dark:text-bodydark text-xs' : 'font-semibold text-black dark:text-white'
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
        className="shrink-0 rounded-full object-cover border border-stroke dark:border-strokedark"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white"
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
          className="block truncate font-semibold text-black hover:text-primary dark:text-white transition-colors"
        >
          {name}
        </Link>
        {team && (
          <Link
            href={`/teams/${team.id}`}
            className="flex items-center gap-1 text-[11px] text-bodydark2 hover:text-primary truncate"
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
        className={`shrink-0 rounded-full object-cover border border-stroke dark:border-strokedark ${className}`}
      />
    );
  }
  return (
    <div
      title={hero.name}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-full bg-gray-2 dark:bg-meta-4 flex items-center justify-center text-[10px] font-bold text-body dark:text-bodydark ${className}`}
    >
      {hero.name?.[0] ?? '?'}
    </div>
  );
}

/** Row of hero thumbnails with a pick count badge. */
export function HeroChips({ heroes }: { heroes: HeroRef[] }) {
  if (!heroes.length) return <span className="text-bodydark2">–</span>;
  return (
    <div className="flex items-center gap-1.5">
      {heroes.map((h) => (
        <span key={h.name} className="relative" title={`${h.name}${h.count ? ` · ${h.count}` : ''}`}>
          <HeroThumb hero={h} size={28} />
          {h.count !== undefined && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-boxdark text-white text-[9px] font-bold px-1 leading-4 dark:bg-white dark:text-boxdark">
              {h.count}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export function LaneCell({ role }: { role?: string | null }) {
  if (!role) return <span className="text-bodydark2">–</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <RoleIcon role={role} size={16} />
      <span className="capitalize">{role}</span>
    </span>
  );
}

export function WinRateBar({ value }: { value: number }) {
  const color = value >= 60 ? 'bg-success' : value >= 45 ? 'bg-primary' : 'bg-danger';
  return (
    <div className="flex items-center gap-2 min-w-[6rem]">
      <div className="h-1.5 flex-1 rounded-full bg-gray-2 dark:bg-meta-4 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="w-12 text-right font-medium tabular-nums">{fmt(value)}%</span>
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
        className="inline-flex items-center justify-center rounded-full text-bodydark2 hover:text-primary focus:outline-none focus:text-primary cursor-help"
      >
        <Info size={14} />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 w-64 -translate-x-1/2 rounded-sm border border-stroke bg-white p-2.5 text-left text-xs font-normal normal-case tracking-normal text-body shadow-default opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:border-strokedark dark:bg-boxdark dark:text-bodydark"
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

  const alignCls = (a?: Column<T>['align']) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="bg-gray-2 text-left dark:bg-meta-4">
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th
                  key={c.key}
                  className={`px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-body dark:text-bodydark whitespace-nowrap ${alignCls(
                    c.align,
                  )} ${c.hideOnMobile ? 'hidden md:table-cell' : ''} ${c.className ?? ''} ${
                    highlight === c.key ? 'text-primary dark:text-primary' : ''
                  }`}
                >
                  {c.value ? (
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      className={`inline-flex items-center gap-1 hover:text-primary transition-colors ${
                        active ? 'text-primary' : ''
                      }`}
                    >
                      {c.label}
                      {active ? (
                        sort!.dir === 'desc' ? (
                          <ArrowDown size={12} />
                        ) : (
                          <ArrowUp size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={rowKey(row)}
              className="border-b border-stroke last:border-0 hover:bg-gray-1 dark:border-strokedark dark:hover:bg-meta-4/40 transition-colors"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-3 py-2.5 text-black dark:text-white tabular-nums ${alignCls(c.align)} ${
                    c.hideOnMobile ? 'hidden md:table-cell' : ''
                  } ${c.className ?? ''} ${highlight === c.key ? 'font-bold text-primary dark:text-primary' : ''}`}
                >
                  {c.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RankBubble({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? 'bg-[#FFD700] text-black'
      : rank === 2
        ? 'bg-[#C0C0C0] text-black'
        : rank === 3
          ? 'bg-[#CD7F32] text-white'
          : 'bg-gray-2 text-body dark:bg-meta-4 dark:text-bodydark';
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${tone}`}>
      {rank}
    </span>
  );
}
