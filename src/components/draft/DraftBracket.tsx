'use client';

import { useMemo } from 'react';
import EliminationBracket from '@/components/tournaments/EliminationBracket';

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
  // Draft teams carry a 0-based `seed` used for icons only; keep the generic
  // bracket's "?" placeholder instead of showing it.
  const bracketTeams = useMemo(
    () => teams.map((tm) => ({ id: tm.id, name: tm.name, icon: tm.icon })),
    [teams],
  );
  return <EliminationBracket teams={bracketTeams} matches={matches} onSetWinner={onSetWinner} />;
}
