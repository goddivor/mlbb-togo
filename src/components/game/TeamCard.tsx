'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { StatTile } from '@/components/ui';

export type TeamCardTeam = {
  id: string;
  name: string;
  image?: string | null;
  tag?: string | null;
  memberCount?: number | null;
  color?: string | null;
};

export type TeamCardRecord = { wins: number; losses: number; draws?: number; points?: number };
export type FormResult = 'W' | 'L' | 'D';

const FORM_CLS: Record<FormResult, string> = {
  W: 'bg-accent-green text-white',
  L: 'bg-accent-red text-white',
  D: 'bg-surface-3 text-ink-2',
};

/** Team tag derived from the name when not provided ("Lomé Titans" -> "LT"). */
export function teamTag(team: Pick<TeamCardTeam, 'name' | 'tag'>): string {
  if (team.tag) return team.tag.toUpperCase();
  return team.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
}

export default function TeamCard({
  team,
  record,
  form,
  rank,
  href,
  className,
}: {
  team: TeamCardTeam;
  record?: TeamCardRecord | null;
  /** Last results, oldest first (same shape as standings rows). */
  form?: FormResult[] | null;
  rank?: number | null;
  href?: string | null;
  className?: string;
}) {
  const t = useT();
  const link = href === undefined ? `/dashboard/teams/${team.id}` : href;
  const accent = team.color || 'rgb(var(--accent-cyan))';
  const played = record ? record.wins + record.losses + (record.draws ?? 0) : 0;
  const winRate = played ? Math.round((record!.wins / played) * 100) : null;

  const body = (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-line-subtle bg-surface-1 p-4 shadow-elev-1 transition-[transform,box-shadow,border-color] duration-base ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elev-2 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1',
        className
      )}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 -skew-x-12" style={{ background: accent }} />
      <div className="flex items-center gap-4 pl-2">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md cut-corners-sm bg-surface-2 ring-1 ring-inset ring-line-subtle">
          {team.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={team.image} alt={team.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-lg font-bold text-ink-1">{teamTag(team)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {rank != null && <span className="font-display text-sm font-bold num text-ink-3">#{rank}</span>}
            <h3 className="truncate font-display text-lg font-bold leading-tight tracking-tight2 text-ink-1">{team.name}</h3>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-ink-2">
            <span className="rounded bg-surface-3 px-1.5 py-0.5 font-semibold tracking-wider text-ink-2">{teamTag(team)}</span>
            {team.memberCount != null && (
              <span className="inline-flex items-center gap-1">
                <Users size={12} /> {team.memberCount} {t('teams.members')}
              </span>
            )}
          </div>
        </div>
        {record && (
          <div className="text-right">
            <p className="font-display text-xl font-bold leading-none num text-ink-1">
              <span className="text-accent-green">{record.wins}</span>
              <span className="text-ink-3"> - </span>
              <span className="text-accent-red">{record.losses}</span>
            </p>
            {winRate != null && <p className="mt-1 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{winRate}% WR</p>}
          </div>
        )}
      </div>
      {(form?.length || record?.points != null) && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-subtle pl-2 pt-3">
          {form?.length ? (
            <div className="flex items-center gap-1" aria-label={t('standings.col.form')}>
              {form.slice(-5).map((r, i) => (
                <span key={i} className={cn('inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold', FORM_CLS[r] ?? FORM_CLS.D)}>
                  {r}
                </span>
              ))}
            </div>
          ) : (
            <span />
          )}
          {record?.points != null && <StatTile label="PTS" value={record.points} align="right" />}
        </div>
      )}
    </div>
  );

  return link ? (
    <Link href={link} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
      {body}
    </Link>
  ) : (
    body
  );
}
