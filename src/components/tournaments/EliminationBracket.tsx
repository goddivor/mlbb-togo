'use client';

import { useMemo } from 'react';
import { Crown, Trophy, Radio, Calendar } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { avatarSrc } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';

export type BracketTeam = {
  id: string;
  name: string;
  icon?: string | null;
  seed?: number | null;
};

export type BracketMatch = {
  id: string;
  round: number;
  position: number;
  teamAId?: string | null;
  teamBId?: string | null;
  winnerTeamId?: string | null;
  status?: string;
  scoreA?: number;
  scoreB?: number;
  scheduledAt?: string | null;
  streamUrl?: string | null;
};

export type EliminationBracketProps = {
  teams: BracketTeam[];
  matches: BracketMatch[];
  /** Pick a winner by clicking a team slot (admin use, e.g. draft). */
  onSetWinner?: (matchId: string, teamId: string) => void;
  /** Click on a match card (opens details / admin actions). */
  onSelectMatch?: (match: BracketMatch) => void;
  selectedMatchId?: string | null;
  /** Highlight every match this team played and the ones it won (winner path). */
  highlightTeamId?: string | null;
  /** Click on a team slot when `onSetWinner` is not used (e.g. toggle highlight). */
  onTeamClick?: (teamId: string) => void;
  /** Label for a round column; defaults to "Round n". */
  roundLabel?: (round: number, totalRounds: number) => React.ReactNode;
  /** Show scores, status pills and scheduled dates on match cards. */
  showDetails?: boolean;
  emptyText?: React.ReactNode;
  className?: string;
};

/**
 * Generic single-elimination bracket (rounds as columns, horizontal scroll).
 * Shared by the community draft and the esport tournaments.
 */
export default function EliminationBracket({
  teams,
  matches,
  onSetWinner,
  onSelectMatch,
  selectedMatchId,
  highlightTeamId,
  onTeamClick,
  roundLabel,
  showDetails = false,
  emptyText,
  className,
}: EliminationBracketProps) {
  const t = useT();
  const teamMap = useMemo(() => new Map(teams.map((tm) => [tm.id, tm])), [teams]);

  const rounds = useMemo(() => {
    const by = new Map<number, BracketMatch[]>();
    for (const m of matches) {
      if (!by.has(m.round)) by.set(m.round, []);
      by.get(m.round)!.push(m);
    }
    return [...by.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([round, ms]) => ({ round, matches: ms.sort((a, b) => a.position - b.position) }));
  }, [matches]);

  if (matches.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-body dark:text-bodydark">
        {emptyText ?? <>{t('draft.bracket')} —</>}
      </div>
    );
  }

  const totalRounds = rounds.length;

  const slot = (teamId: string | null | undefined, match: BracketMatch, side: 'A' | 'B') => {
    const team = teamId ? teamMap.get(teamId) : null;
    const isWinner = !!match.winnerTeamId && match.winnerTeamId === teamId;
    const isLoser = !!match.winnerTeamId && !!teamId && match.winnerTeamId !== teamId;
    const isHighlighted = !!highlightTeamId && highlightTeamId === teamId;
    const canPick =
      !!onSetWinner && !match.winnerTeamId && !!match.teamAId && !!match.teamBId && !!teamId;
    const canClick = canPick || (!!onTeamClick && !!teamId);
    const score = side === 'A' ? match.scoreA : match.scoreB;
    const showScore = showDetails && (match.status === 'finished' || match.status === 'live');

    return (
      <button
        type="button"
        disabled={!canClick}
        onClick={(e) => {
          if (!teamId) return;
          if (canPick) {
            e.stopPropagation();
            onSetWinner!(match.id, teamId);
          } else if (onTeamClick) {
            e.stopPropagation();
            onTeamClick(teamId);
          }
        }}
        className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition ${
          isWinner
            ? 'border-primary bg-primary/10 font-semibold text-black dark:text-white'
            : 'border-stroke text-body dark:border-strokedark dark:text-bodydark'
        } ${isHighlighted ? 'ring-2 ring-warning/70' : ''} ${isLoser ? 'opacity-60' : ''} ${
          canClick ? 'cursor-pointer hover:border-primary hover:bg-primary/5' : 'cursor-default'
        }`}
      >
        {team?.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarSrc(team.icon, 48)}
            alt=""
            className="h-6 w-6 rounded bg-gray-2 object-cover dark:bg-meta-4"
          />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-2 text-xs text-bodydark2 dark:bg-meta-4">
            {team?.seed ?? '?'}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">{team?.name || t('draft.tbd')}</span>
        {showScore && (
          <span className={`shrink-0 text-xs font-bold ${isWinner ? 'text-primary' : ''}`}>
            {score ?? 0}
          </span>
        )}
        {isWinner && <Crown size={14} className="shrink-0 text-primary" />}
      </button>
    );
  };

  const statusPill = (m: BracketMatch) => {
    if (!showDetails) return null;
    if (m.status === 'live') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-danger">
          <Radio size={10} className="animate-pulse" /> {t('tournament.match.status.live')}
        </span>
      );
    }
    if (m.scheduledAt && m.status !== 'finished' && m.status !== 'bye') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-bodydark2">
          <Calendar size={10} /> {formatDateTime(m.scheduledAt)}
        </span>
      );
    }
    if (m.status === 'bye') {
      return <span className="text-[10px] uppercase text-bodydark2">{t('tournament.match.status.bye')}</span>;
    }
    return null;
  };

  return (
    <div className={`overflow-x-auto pb-2 ${className ?? ''}`}>
      <div className="flex min-w-max gap-6">
        {rounds.map(({ round, matches: ms }, ri) => (
          <div key={round} className="flex min-w-[220px] flex-col justify-around gap-4">
            <p className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-bodydark2">
              {ri === rounds.length - 1 ? (
                <span className="inline-flex items-center gap-1 text-primary">
                  <Trophy size={13} />{' '}
                  {roundLabel ? roundLabel(round, totalRounds) : t('draft.round', { n: round })}
                </span>
              ) : roundLabel ? (
                roundLabel(round, totalRounds)
              ) : (
                t('draft.round', { n: round })
              )}
            </p>
            {ms.map((m) => {
              const involved =
                !!highlightTeamId && (m.teamAId === highlightTeamId || m.teamBId === highlightTeamId);
              const selected = selectedMatchId === m.id;
              const clickable = !!onSelectMatch;
              return (
                <div
                  key={m.id}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={() => onSelectMatch?.(m)}
                  onKeyDown={(e) => {
                    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSelectMatch!(m);
                    }
                  }}
                  className={`space-y-1 rounded-lg border bg-white p-2 shadow-sm transition dark:bg-boxdark ${
                    selected
                      ? 'border-primary ring-2 ring-primary/30'
                      : involved
                        ? 'border-warning/60'
                        : m.status === 'live'
                          ? 'border-danger/60'
                          : 'border-stroke dark:border-strokedark'
                  } ${clickable ? 'cursor-pointer hover:border-primary' : ''}`}
                >
                  {showDetails && (
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[10px] font-medium uppercase text-bodydark2">
                        {t('tournament.match.n', { n: m.position + 1 })}
                      </span>
                      {statusPill(m)}
                    </div>
                  )}
                  {slot(m.teamAId, m, 'A')}
                  {slot(m.teamBId, m, 'B')}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
