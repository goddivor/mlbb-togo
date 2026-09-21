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
    <ol className="divide-y divide-line-subtle overflow-hidden rounded-lg border border-line-subtle bg-surface-1 shadow-elev-1">
      {games.map((g) => {
        const winner = teamOf(g.winnerTeamId);
        if (g.winnerTeamId === match.teamA?.id) a++;
        else if (g.winnerTeamId === match.teamB?.id) b++;
        const dur = formatDuration(g.duration);
        return (
          <li key={g.number} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded cut-corners-sm bg-surface-3 font-display text-xs font-bold text-ink-2">
              G{g.number}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {winner ? (
                <>
                  <TeamLogo team={winner} size="sm" />
                  <span className="min-w-0 flex-1 overflow-hidden">
                    <span className="block truncate text-sm font-semibold text-ink-1">{winner.name}</span>
                    <span className="flex items-center gap-1 whitespace-nowrap text-[11px] text-accent-green">
                      <Trophy size={11} className="shrink-0" /> <span className="truncate">{t('matches.games.won')}</span>
                    </span>
                  </span>
                </>
              ) : (
                <span className="text-sm text-ink-2">{t('matches.games.pending')}</span>
              )}
            </div>
            <span className="font-display text-sm font-bold num text-ink-1" title={t('matches.games.running')}>
              {a} - {b}
            </span>
            {dur && (
              <span className="inline-flex items-center gap-1 text-xs num text-ink-2">
                <Clock size={12} /> {dur}
              </span>
            )}
            {g.mvp && (
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
                <MvpAvatar user={g.mvp} t={t} />
                <span className="hidden max-w-24 truncate 2xl:inline">{userLabel(g.mvp)}</span>
              </span>
            )}
            {g.screenshot && (
              <button
                type="button"
                onClick={() => onOpenScreenshot?.(g.screenshot!)}
                title={t('matches.screenshots.open')}
                className="inline-flex h-7 w-7 items-center justify-center rounded cut-corners-sm bg-surface-3 text-ink-2 transition-colors hover:text-primary"
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
