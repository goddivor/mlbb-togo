'use client';

import Link from 'next/link';
import { Camera, Clock, Radio, Trophy, Video } from 'lucide-react';
import {
  EsportMatch,
  FormatBadge,
  MatchStatusBadge,
  MvpAvatar,
  StageBadge,
  TFn,
  TeamLogo,
  displayStatus,
  fmtDay,
  fmtTime,
} from './shared';

/**
 * Compact match card used by the calendar and results lists. The whole card
 * links to the match sheet; the VOD / stream icons open the links directly.
 */
export default function MatchCard({
  match,
  t,
  lang,
  compact = false,
  showStage = true,
}: {
  match: EsportMatch;
  t: TFn;
  lang: string;
  compact?: boolean;
  showStage?: boolean;
}) {
  const status = displayStatus(match);
  const done = status === 'completed';
  const aWon = done && match.winnerTeamId === match.teamA?.id;
  const bWon = done && match.winnerTeamId === match.teamB?.id;
  const live = status === 'live';

  const teamCls = (won: boolean) =>
    `line-clamp-2 break-words font-display text-sm font-bold leading-tight ${
      done && !won ? 'text-ink-2' : 'text-ink-1'
    }`;
  const scoreCls = (won: boolean) =>
    `font-display text-3xl font-bold num leading-none ${
      won ? 'text-ink-1' : done ? 'text-ink-3' : 'text-ink-1'
    }`;

  const pad = compact ? 'px-3' : 'px-4';

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border bg-surface-1 shadow-elev-1 transition-[transform,box-shadow,border-color] duration-base ease-out hover:-translate-y-0.5 hover:shadow-elev-2 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1 ${
        live ? 'border-accent-red/50' : 'border-line-subtle hover:border-primary/40'
      }`}
    >
      {live && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-accent-red" />}
      <Link href={`/matches/${match.id}`} className={`block ${pad} ${compact ? 'pt-3 pb-3' : 'pt-4 pb-4'}`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <MatchStatusBadge match={match} t={t} />
          {showStage && <StageBadge stage={match.stage} t={t} />}
          <FormatBadge format={match.format} />
          <span className="ml-auto inline-flex items-center gap-1 text-xs num text-ink-3">
            <Clock size={12} />
            {match.scheduledAt ? (
              <>
                {fmtDay(match.scheduledAt, lang)} · {fmtTime(match.scheduledAt, lang)}
              </>
            ) : (
              t('matches.tbd')
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <TeamLogo team={match.teamA} size={compact ? 'sm' : 'md'} />
            <div className="min-w-0">
              <p className={teamCls(aWon)}>{match.teamA?.name || '?'}</p>
              {aWon && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-eyebrow text-accent-green">
                  <Trophy size={11} /> {t('matches.winner')}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center px-1">
            {done || live ? (
              <div className="flex items-center gap-2">
                <span className={scoreCls(aWon)}>{match.scoreA ?? 0}</span>
                <span className="text-xs font-semibold text-ink-3">VS</span>
                <span className={scoreCls(bWon)}>{match.scoreB ?? 0}</span>
              </div>
            ) : (
              <span className="rounded cut-corners-sm bg-surface-3 px-3 py-1 font-display text-xs font-bold text-ink-2">
                VS
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 text-right">
            <div className="min-w-0">
              <p className={teamCls(bWon)}>{match.teamB?.name || '?'}</p>
              {bWon && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-eyebrow text-accent-green">
                  <Trophy size={11} /> {t('matches.winner')}
                </span>
              )}
            </div>
            <TeamLogo team={match.teamB} size={compact ? 'sm' : 'md'} />
          </div>
        </div>
      </Link>

      {(match.mvp || match.vodUrl || match.streamUrl || match.screenshotsCount > 0) && (
        <div
          className={`flex items-center gap-2 border-t border-line-subtle ${pad} py-2.5`}
        >
          {match.mvp && (
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
              <MvpAvatar user={match.mvp} t={t} />
              <span className="hidden sm:inline">
                {t('matches.mvp')} ·{' '}
                <b className="text-ink-1">{match.mvp.displayName || match.mvp.username}</b>
              </span>
            </span>
          )}
          <span className="ml-auto flex items-center gap-1.5">
            {match.streamUrl && (
              <a
                href={match.streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={t('matches.links.stream')}
                className={`inline-flex h-7 w-7 items-center justify-center rounded cut-corners-sm transition-colors ${
                  live
                    ? 'bg-accent-red/10 text-accent-red'
                    : 'bg-surface-3 text-ink-2 hover:text-primary'
                }`}
              >
                <Radio size={14} />
              </a>
            )}
            {match.vodUrl && (
              <a
                href={match.vodUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={t('matches.links.vod')}
                className="inline-flex h-7 w-7 items-center justify-center rounded cut-corners-sm bg-surface-3 text-ink-2 transition-colors hover:text-primary"
              >
                <Video size={14} />
              </a>
            )}
            {match.screenshotsCount > 0 && (
              <span
                title={t('matches.screenshots.count', {
                  n: match.screenshotsCount,
                })}
                className="inline-flex h-7 items-center gap-1 rounded cut-corners-sm bg-surface-3 px-2 text-xs num text-ink-2"
              >
                <Camera size={13} /> {match.screenshotsCount}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
