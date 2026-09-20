'use client';

import Link from 'next/link';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { Badge } from '@/components/ui';
import { teamTag } from './TeamCard';

export type ScorelineTeam = { id: string; name: string; image?: string | null; tag?: string | null };

/** Subset of the esport match payload (`/esport/matches`). */
export type ScorelineMatch = {
  id?: string;
  teamA: ScorelineTeam;
  teamB: ScorelineTeam;
  scoreA: number;
  scoreB: number;
  status: 'scheduled' | 'completed' | 'cancelled' | string;
  scheduledAt?: string | null;
  stage?: string | null;
  format?: string | null;
  winnerTeamId?: string | null;
};

const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

export function scorelineStatus(m: Pick<ScorelineMatch, 'status' | 'scheduledAt'>, now = Date.now()) {
  if (m.status === 'completed' || m.status === 'cancelled') return m.status;
  if (m.scheduledAt) {
    const t = new Date(m.scheduledAt).getTime();
    if (!isNaN(t) && t <= now && now - t < LIVE_WINDOW_MS) return 'live';
  }
  return 'scheduled';
}

function Side({ team, winner, align }: { team: ScorelineTeam; winner: boolean; align: 'left' | 'right' }) {
  return (
    <div className={cn('flex min-w-0 flex-1 items-center gap-2.5', align === 'right' && 'flex-row-reverse text-right')}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded cut-corners-sm bg-surface-2 ring-1 ring-inset ring-line-subtle">
        {team.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={team.image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] font-bold text-ink-2">{teamTag(team)}</span>
        )}
      </div>
      <span className={cn('truncate text-sm font-semibold', winner ? 'text-ink-1' : 'text-ink-2')}>{team.name}</span>
    </div>
  );
}

export default function MatchScoreline({
  match,
  href,
  compact = false,
  className,
}: {
  match: ScorelineMatch;
  href?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const t = useT();
  const status = scorelineStatus(match);
  const live = status === 'live';
  const done = status === 'completed';
  const winA = done && (match.winnerTeamId ? match.winnerTeamId === match.teamA.id : match.scoreA > match.scoreB);
  const winB = done && (match.winnerTeamId ? match.winnerTeamId === match.teamB.id : match.scoreB > match.scoreA);
  const link = href === undefined && match.id ? `/matches/${match.id}` : href;
  const when = match.scheduledAt
    ? new Date(match.scheduledAt).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  const body = (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border bg-surface-1 shadow-elev-1 transition-[border-color,box-shadow] duration-base ease-out hover:shadow-elev-2 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1',
        live ? 'border-accent-red/50' : 'border-line-subtle hover:border-primary/40',
        compact ? 'px-3 py-2.5' : 'px-4 py-3',
        className
      )}
    >
      {live && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-accent-red" />}
      <div className="flex items-center gap-3">
        <Side team={match.teamA} winner={winA} align="left" />
        <div className="flex shrink-0 flex-col items-center">
          <div className="flex items-center gap-2 font-display text-2xl font-bold leading-none num">
            <span className={cn(winA ? 'text-ink-1' : 'text-ink-3')}>{status === 'scheduled' ? '–' : match.scoreA}</span>
            <span className="text-xs font-semibold text-ink-3">VS</span>
            <span className={cn(winB ? 'text-ink-1' : 'text-ink-3')}>{status === 'scheduled' ? '–' : match.scoreB}</span>
          </div>
          {!compact && (
            <div className="mt-1.5 flex items-center gap-1.5">
              {live ? (
                <Badge variant="live" size="sm">{t('matches.status.live')}</Badge>
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
                  {status === 'scheduled' ? when : t(`matches.status.${status}`)}
                </span>
              )}
              {match.format && <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-2">{match.format}</span>}
            </div>
          )}
        </div>
        <Side team={match.teamB} winner={winB} align="right" />
      </div>
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
