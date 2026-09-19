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
    `line-clamp-2 break-words text-sm font-semibold leading-tight ${
      done && !won ? 'text-body dark:text-bodydark' : 'text-black dark:text-white'
    }`;
  const scoreCls = (won: boolean) =>
    `text-2xl font-black tabular-nums leading-none ${
      won ? 'text-success' : done ? 'text-bodydark2' : 'text-black dark:text-white'
    }`;

  const pad = compact ? 'px-3' : 'px-4';

  return (
    <div
      className={`group rounded-sm border bg-white shadow-default transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-boxdark ${
        live ? 'border-danger/60' : 'border-stroke hover:border-primary/60 dark:border-strokedark'
      }`}
    >
      <Link href={`/matches/${match.id}`} className={`block ${pad} ${compact ? 'pt-3 pb-3' : 'pt-4 pb-4'}`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <MatchStatusBadge match={match} t={t} />
          {showStage && <StageBadge stage={match.stage} t={t} />}
          <FormatBadge format={match.format} />
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-body dark:text-bodydark">
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
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
                  <Trophy size={11} /> {t('matches.winner')}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center px-1">
            {done || live ? (
              <div className="flex items-center gap-2">
                <span className={scoreCls(aWon)}>{match.scoreA ?? 0}</span>
                <span className="text-sm font-bold text-bodydark2">:</span>
                <span className={scoreCls(bWon)}>{match.scoreB ?? 0}</span>
              </div>
            ) : (
              <span className="rounded-sm bg-gray-2 px-3 py-1 text-xs font-black text-body dark:bg-meta-4 dark:text-bodydark">
                VS
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 text-right">
            <div className="min-w-0">
              <p className={teamCls(bWon)}>{match.teamB?.name || '?'}</p>
              {bWon && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
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
          className={`flex items-center gap-2 border-t border-stroke ${pad} py-2.5 dark:border-strokedark`}
        >
          {match.mvp && (
            <span className="inline-flex items-center gap-1.5 text-xs text-body dark:text-bodydark">
              <MvpAvatar user={match.mvp} t={t} />
              <span className="hidden sm:inline">
                {t('matches.mvp')} ·{' '}
                <b className="text-black dark:text-white">{match.mvp.displayName || match.mvp.username}</b>
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
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  live
                    ? 'bg-danger/10 text-danger'
                    : 'bg-gray-2 text-body hover:text-primary dark:bg-meta-4 dark:text-bodydark'
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
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-2 text-body transition-colors hover:text-primary dark:bg-meta-4 dark:text-bodydark"
              >
                <Video size={14} />
              </a>
            )}
            {match.screenshotsCount > 0 && (
              <span
                title={t('matches.screenshots.count', {
                  n: match.screenshotsCount,
                })}
                className="inline-flex h-7 items-center gap-1 rounded-full bg-gray-2 px-2 text-xs text-body dark:bg-meta-4 dark:text-bodydark"
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
