'use client';

import { Calendar, Crown, Play } from 'lucide-react';
import { Badge } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { cn, formatDateTime } from '@/lib/helpers';
import { MATCH_STATUS_VARIANT, TeamLogo, roundLabelKey } from './tournament-utils';

export type TeamRef = { id: string; name: string; logo?: string | null; seed?: number | null } | null;

export type DetailedMatch = {
  id: string;
  round: number;
  position: number;
  teamAId?: string | null;
  teamBId?: string | null;
  teamA?: TeamRef;
  teamB?: TeamRef;
  scoreA?: number;
  scoreB?: number;
  winnerTeamId?: string | null;
  status?: string;
  scheduledAt?: string | null;
  streamUrl?: string | null;
};

/** Scoreline row "Team A  x - y  Team B" with status, date and round (tournament matches). */
export default function MatchSummary({
  match,
  roundKey,
  onClick,
  className = '',
}: {
  match: DetailedMatch;
  roundKey?: string;
  onClick?: () => void;
  className?: string;
}) {
  const t = useT();
  const status = match.status || 'pending';
  const live = status === 'live';
  const showScore = status === 'finished' || live;
  const isWinner = (id?: string | null) => !!id && match.winnerTeamId === id;

  const side = (team: TeamRef | undefined, id: string | null | undefined, align: 'left' | 'right') => (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-2.5 sm:text-left',
        align === 'right' && 'sm:flex-row-reverse sm:text-right'
      )}
    >
      <TeamLogo name={team?.name} logo={team?.logo} size="md" />
      <span
        className={cn(
          'line-clamp-2 min-w-0 break-words text-xs sm:truncate sm:text-sm',
          isWinner(id) ? 'font-bold text-ink-1' : 'font-medium text-ink-2'
        )}
      >
        {team?.name || t('draft.tbd')}
      </span>
      {isWinner(id) && <Crown size={13} className="shrink-0 text-accent-gold" />}
    </div>
  );

  const Wrapper: any = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'relative w-full overflow-hidden rounded-lg border bg-surface-1 px-4 py-3 text-left shadow-elev-1 transition-[border-color,box-shadow] duration-base ease-out dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1',
        live ? 'border-accent-red/50' : 'border-line-subtle',
        onClick && 'hover:border-primary/40 hover:shadow-elev-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        className
      )}
    >
      {live && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-accent-red" />}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
          {roundKey ? t(roundLabelKey(roundKey), { n: match.round }) : t('draft.round', { n: match.round })}
          <span className="mx-1.5 text-line-strong">/</span>
          {t('tournament.match.n', { n: match.position + 1 })}
        </span>
        <div className="flex items-center gap-2">
          {match.scheduledAt && (
            <span className="inline-flex items-center gap-1 text-xs num text-ink-3">
              <Calendar size={12} /> {formatDateTime(match.scheduledAt)}
            </span>
          )}
          {match.streamUrl && <Play size={12} className="text-primary" />}
          <Badge variant={MATCH_STATUS_VARIANT[status] || 'default'} size="sm">
            {t(`tournament.match.status.${status}`)}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {side(match.teamA, match.teamAId, 'left')}
        <div
          className={cn(
            'shrink-0 rounded cut-corners-sm px-3 py-1.5 font-display text-base font-bold leading-none num',
            showScore ? 'bg-surface-2 text-ink-1' : 'bg-surface-2 text-ink-3'
          )}
        >
          {showScore ? (
            <>
              <span className={cn(isWinner(match.teamAId) && 'text-primary')}>{match.scoreA ?? 0}</span>
              <span className="mx-1.5 text-ink-3">:</span>
              <span className={cn(isWinner(match.teamBId) && 'text-primary')}>{match.scoreB ?? 0}</span>
            </>
          ) : (
            'VS'
          )}
        </div>
        {side(match.teamB, match.teamBId, 'right')}
      </div>
    </Wrapper>
  );
}
