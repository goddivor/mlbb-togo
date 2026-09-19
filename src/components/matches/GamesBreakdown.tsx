'use client';

import { Camera, Clock, Trophy } from 'lucide-react';
import { EsportMatch, MatchGame, MvpAvatar, TFn, TeamLogo, formatDuration, userLabel } from './shared';

/**
 * Game-by-game breakdown of a series: winner crest, duration, per-game MVP
 * and a shortcut to the game screenshot (opens in the gallery).
 */
export default function GamesBreakdown({
  match,
  games,
  t,
  onOpenScreenshot,
}: {
  match: EsportMatch;
  games: MatchGame[];
  t: TFn;
  onOpenScreenshot?: (url: string) => void;
}) {
  if (games.length === 0) return null;
  const teamOf = (id: string | null) =>
    id === match.teamA?.id ? match.teamA : id === match.teamB?.id ? match.teamB : null;

  let a = 0;
  let b = 0;

  return (
    <ol className="divide-y divide-stroke rounded-sm border border-stroke bg-white shadow-default dark:divide-strokedark dark:border-strokedark dark:bg-boxdark">
      {games.map((g) => {
        const winner = teamOf(g.winnerTeamId);
        if (g.winnerTeamId === match.teamA?.id) a++;
        else if (g.winnerTeamId === match.teamB?.id) b++;
        const dur = formatDuration(g.duration);
        return (
          <li key={g.number} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-2 text-xs font-bold text-body dark:bg-meta-4 dark:text-bodydark">
              G{g.number}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {winner ? (
                <>
                  <TeamLogo team={winner} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-black dark:text-white">{winner.name}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-success">
                      <Trophy size={11} /> {t('matches.games.won')}
                    </span>
                  </span>
                </>
              ) : (
                <span className="text-sm text-body dark:text-bodydark">{t('matches.games.pending')}</span>
              )}
            </div>
            <span className="text-xs font-bold tabular-nums text-body dark:text-bodydark" title={t('matches.games.running')}>
              {a} - {b}
            </span>
            {dur && (
              <span className="inline-flex items-center gap-1 text-xs text-body dark:text-bodydark">
                <Clock size={12} /> {dur}
              </span>
            )}
            {g.mvp && (
              <span className="inline-flex items-center gap-1.5 text-xs text-body dark:text-bodydark">
                <MvpAvatar user={g.mvp} t={t} />
                <span className="hidden sm:inline">{userLabel(g.mvp)}</span>
              </span>
            )}
            {g.screenshot && (
              <button
                type="button"
                onClick={() => onOpenScreenshot?.(g.screenshot!)}
                title={t('matches.screenshots.open')}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-2 text-body transition-colors hover:text-primary dark:bg-meta-4 dark:text-bodydark"
              >
                <Camera size={14} />
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
