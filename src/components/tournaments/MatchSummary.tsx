'use client';

import { Calendar, Crown, Radio, Play } from 'lucide-react';
import { Badge } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { formatDateTime } from '@/lib/helpers';
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

/** Compact "Team A  x - y  Team B" row with status, date and round. */
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
  const showScore = status === 'finished' || status === 'live';
  const isWinner = (id?: string | null) => !!id && match.winnerTeamId === id;

  const side = (team: TeamRef | undefined, id: string | null | undefined, align: 'left' | 'right') => (
    <div
      className={`flex min-w-0 flex-1 flex-col items-center gap-1 text-center sm:flex-row sm:gap-2 sm:text-left ${
        align === 'right' ? 'sm:flex-row-reverse sm:text-right' : ''
      }`}
    >
      <TeamLogo name={team?.name} logo={team?.logo} size="md" />
      <span
        className={`line-clamp-2 min-w-0 break-words text-xs sm:truncate sm:text-sm ${
          isWinner(id) ? 'font-bold text-black dark:text-white' : 'text-body dark:text-bodydark'
        }`}
      >
        {team?.name || t('draft.tbd')}
      </span>
      {isWinner(id) && <Crown size={14} className="shrink-0 text-primary" />}
    </div>
  );

  const Wrapper: any = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full rounded-lg border bg-white p-3 text-left dark:bg-boxdark ${
        status === 'live' ? 'border-danger/60' : 'border-stroke dark:border-strokedark'
      } ${onClick ? 'transition hover:border-primary' : ''} ${className}`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-bodydark2">
        <span className="font-medium uppercase tracking-wide">
          {roundKey ? t(roundLabelKey(roundKey), { n: match.round }) : t('draft.round', { n: match.round })}
          {' · '}
          {t('tournament.match.n', { n: match.position + 1 })}
        </span>
        <div className="flex items-center gap-2">
          {match.scheduledAt && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} /> {formatDateTime(match.scheduledAt)}
            </span>
          )}
          {match.streamUrl && <Play size={12} className="text-primary" />}
          <Badge variant={MATCH_STATUS_VARIANT[status] || 'default'} size="sm">
            {status === 'live' && <Radio size={10} className="animate-pulse" />}
            {t(`tournament.match.status.${status}`)}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {side(match.teamA, match.teamAId, 'left')}
        <div className="shrink-0 rounded-md bg-gray-2 px-3 py-1 text-sm font-bold text-black dark:bg-meta-4 dark:text-white">
          {showScore ? `${match.scoreA ?? 0} - ${match.scoreB ?? 0}` : 'VS'}
        </div>
        {side(match.teamB, match.teamBId, 'right')}
      </div>
    </Wrapper>
  );
}
