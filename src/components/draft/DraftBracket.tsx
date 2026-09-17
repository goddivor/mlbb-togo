'use client';

import { useMemo } from 'react';
import { Crown, Trophy } from 'lucide-react';
import { useT } from '@/lib/i18n';

type Team = {
  id: string;
  name: string;
  icon?: string;
  complete?: boolean;
  eliminated?: boolean;
};
type Match = {
  id: string;
  round: number;
  position: number;
  teamAId?: string | null;
  teamBId?: string | null;
  winnerTeamId?: string | null;
  status?: string;
};

/** Single-elimination bracket. Pass `onSetWinner` (admin) to pick winners. */
export default function DraftBracket({
  teams,
  matches,
  onSetWinner,
}: {
  teams: Team[];
  matches: Match[];
  onSetWinner?: (matchId: string, teamId: string) => void;
}) {
  const t = useT();
  const teamMap = useMemo(() => new Map(teams.map((tm) => [tm.id, tm])), [teams]);

  const rounds = useMemo(() => {
    const by = new Map<number, Match[]>();
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
        {t('draft.bracket')} —
      </div>
    );
  }

  const slot = (teamId?: string | null, match?: Match) => {
    const team = teamId ? teamMap.get(teamId) : null;
    const isWinner = match?.winnerTeamId && match.winnerTeamId === teamId;
    const canPick =
      onSetWinner && match && !match.winnerTeamId && match.teamAId && match.teamBId && teamId;
    return (
      <button
        type="button"
        disabled={!canPick}
        onClick={() => canPick && onSetWinner!(match!.id, teamId!)}
        className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition ${
          isWinner
            ? 'border-primary bg-primary/10 font-semibold text-black dark:text-white'
            : 'border-stroke text-body dark:border-strokedark dark:text-bodydark'
        } ${canPick ? 'cursor-pointer hover:border-primary hover:bg-primary/5' : 'cursor-default'}`}
      >
        {team?.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={team.icon} alt="" className="h-6 w-6 rounded bg-gray-2 dark:bg-meta-4" />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-2 text-bodydark2 dark:bg-meta-4">
            ?
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">{team?.name || t('draft.tbd')}</span>
        {isWinner && <Crown size={14} className="shrink-0 text-primary" />}
      </button>
    );
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-6">
        {rounds.map(({ round, matches: ms }, ri) => (
          <div key={round} className="flex min-w-[220px] flex-col justify-around gap-4">
            <p className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-bodydark2">
              {ri === rounds.length - 1 ? (
                <span className="inline-flex items-center gap-1 text-primary">
                  <Trophy size={13} /> {t('draft.round', { n: round })}
                </span>
              ) : (
                t('draft.round', { n: round })
              )}
            </p>
            {ms.map((m) => (
              <div
                key={m.id}
                className="space-y-1 rounded-lg border border-stroke bg-white p-2 shadow-sm dark:border-strokedark dark:bg-boxdark"
              >
                {slot(m.teamAId, m)}
                {slot(m.teamBId, m)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
