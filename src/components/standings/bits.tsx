'use client';

import { ArrowDown, ArrowUp, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/helpers';

export type MatchResult = 'W' | 'L' | 'D';
export type TFn = (key: string, params?: Record<string, string | number>) => string;

export type StandingRow = {
  rank: number;
  teamId: string;
  team: { id: string; name: string; image?: string | null };
  played: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  scoreFor: number;
  scoreAgainst: number;
  scoreDiff: number;
  points: number;
  streak: { type: MatchResult; count: number } | null;
  form: MatchResult[];
  sos: number | null;
  delta: { d7: number | null; d30: number | null };
  qualified: boolean;
};

export type StandingsType = 'league' | 'playoff' | 'all';
export type DeltaWindow = 'd7' | 'd30';

export type StandingsPayload = {
  season: {
    id: string;
    name: string;
    slug: string | null;
    number: number | null;
    status: string;
    color: string | null;
    closedAt: string | null;
  };
  type: StandingsType;
  frozen: boolean;
  frozenAt: string | null;
  settings: { points: { win: number; draw: number; loss: number }; qualifyTop: number };
  meta: {
    qualifyTop: number;
    asOf: string;
    generatedAt: string;
    matches: { total: number; completed: number; scoped: number };
    tieBreakers: string[];
  };
  rows: StandingRow[];
};

const RESULT_CLS: Record<MatchResult, string> = {
  W: 'bg-accent-green text-white',
  L: 'bg-accent-red text-white',
  D: 'bg-surface-3 text-ink-2',
};

/** Last N results as small coloured pills (oldest on the left). */
export function FormPills({ form, t, size = 'sm' }: { form: MatchResult[]; t: TFn; size?: 'sm' | 'md' }) {
  if (!form?.length) return <span className="text-ink-3">-</span>;
  const dim = size === 'md' ? 'h-6 w-6 text-[11px]' : 'h-5 w-5 text-[10px]';
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={t('standings.hint.form')}>
      {form.map((r, i) => (
        <span
          key={i}
          className={cn('inline-flex items-center justify-center rounded-sm font-bold leading-none', dim, RESULT_CLS[r])}
          title={t('standings.result.' + r)}
        >
          {t('standings.result.' + r)}
        </span>
      ))}
    </span>
  );
}

/** Current streak, e.g. "W3" in green or "L2" in red. */
export function StreakChip({ streak, t }: { streak: StandingRow['streak']; t: TFn }) {
  if (!streak) return <span className="text-ink-3">-</span>;
  const tone =
    streak.type === 'W'
      ? 'bg-accent-green/10 text-accent-green'
      : streak.type === 'L'
        ? 'bg-accent-red/10 text-accent-red'
        : 'bg-surface-3 text-ink-2';
  return (
    <span
      className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold num', tone)}
      title={t('standings.streak.' + streak.type, { n: streak.count })}
    >
      {t('standings.result.' + streak.type)}
      {streak.count}
    </span>
  );
}

/** Rank change arrow: up (green), down (red), flat, or "new" when unranked before. */
export function RankDelta({ value, t }: { value: number | null; t: TFn }) {
  if (value == null) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-accent-cyan" title={t('standings.delta.new')}>
        <Sparkles size={12} />
      </span>
    );
  }
  if (value === 0) {
    return (
      <span className="inline-flex items-center text-ink-3" title="0">
        <Minus size={12} />
      </span>
    );
  }
  const up = value > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold num',
        up ? 'text-accent-green' : 'text-accent-red',
      )}
      title={`${up ? '+' : ''}${value}`}
    >
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(value)}
    </span>
  );
}

export function TeamAvatar({ team, size = 32 }: { team: StandingRow['team']; size?: number }) {
  if (team.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.image}
        alt={team.name}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className="shrink-0 rounded cut-corners-sm object-cover ring-1 ring-inset ring-line-subtle"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className="flex shrink-0 items-center justify-center rounded cut-corners-sm bg-surface-3 font-bold text-ink-2"
    >
      {team.name?.[0]?.toUpperCase() || '?'}
    </span>
  );
}

export const fmtDiff = (n: number) => (n > 0 ? `+${n}` : String(n));
