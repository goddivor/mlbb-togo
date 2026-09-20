'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui';
import { avatarSrc } from '@/lib/api';

export type TFn = (key: string, params?: Record<string, string | number>) => string;

export type MatchStage = 'scrim' | 'league' | 'playoff';
export type MatchFormat = 'bo1' | 'bo3' | 'bo5' | 'bo7';
export type MatchStatus = 'scheduled' | 'completed' | 'cancelled';

export const MATCH_STAGES: MatchStage[] = ['scrim', 'league', 'playoff'];
export const MATCH_FORMATS: MatchFormat[] = ['bo1', 'bo3', 'bo5', 'bo7'];

export type MatchTeam = { id: string; name: string; image?: string | null };

export type UserCard = {
  id: string;
  username?: string;
  displayName?: string | null;
  avatar?: string | null;
};

export type MatchGame = {
  number: number;
  winnerTeamId: string | null;
  duration: number | null;
  mvpUserId: string | null;
  screenshot: string | null;
  mvp?: UserCard | null;
};

export type MatchPlayer = {
  id: string;
  userId: string;
  teamId: string;
  hero: string | null;
  heroImage: string | null;
  role: string | null;
  kills: number;
  deaths: number;
  assists: number;
  kda: number | null;
  isMvp: boolean;
  user: UserCard | null;
};

export type EsportMatch = {
  id: string;
  seasonId: string | null;
  type: string;
  stage: MatchStage;
  format: MatchFormat | null;
  status: MatchStatus;
  scheduledAt: string | null;
  scoreA: number;
  scoreB: number;
  winnerTeamId: string | null;
  notes: string | null;
  teamA: MatchTeam;
  teamB: MatchTeam;
  winner: MatchTeam | null;
  games: MatchGame[];
  gamesCount: number;
  screenshots: string[];
  screenshotsCount: number;
  vodUrl: string | null;
  streamUrl: string | null;
  mvpUserId: string | null;
  mvp: UserCard | null;
};

export type MatchDetail = EsportMatch & {
  mvpStats: MatchPlayer | null;
  players: { teamA: MatchPlayer[]; teamB: MatchPlayer[] };
};

/** A scheduled match whose start time has passed (up to 3 h ago) is "live". */
export const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

export type DisplayStatus = 'live' | 'scheduled' | 'completed' | 'cancelled';

export function displayStatus(m: Pick<EsportMatch, 'status' | 'scheduledAt'>, now = Date.now()): DisplayStatus {
  if (m.status === 'completed' || m.status === 'cancelled') return m.status;
  if (m.scheduledAt) {
    const t = new Date(m.scheduledAt).getTime();
    if (!isNaN(t) && t <= now && now - t < LIVE_WINDOW_MS) return 'live';
  }
  return 'scheduled';
}

export const STATUS_VARIANT: Record<DisplayStatus, string> = {
  live: 'live',
  scheduled: 'blue',
  completed: 'green',
  cancelled: 'default',
};

export const STAGE_VARIANT: Record<MatchStage, string> = {
  scrim: 'default',
  league: 'purple',
  playoff: 'gold',
};

export function MatchStatusBadge({
  match,
  t,
  size = 'sm',
}: {
  match: Pick<EsportMatch, 'status' | 'scheduledAt'>;
  t: TFn;
  size?: 'sm' | 'md';
}) {
  const s = displayStatus(match);
  return (
    <Badge variant={STATUS_VARIANT[s]} size={size}>
      {t('matches.status.' + s)}
    </Badge>
  );
}

export function StageBadge({ stage, t, size = 'sm' }: { stage: MatchStage; t: TFn; size?: 'sm' | 'md' }) {
  return (
    <Badge variant={STAGE_VARIANT[stage] || 'default'} size={size}>
      {t('matches.stage.' + stage)}
    </Badge>
  );
}

export function FormatBadge({ format, size = 'sm' }: { format: MatchFormat | null; size?: 'sm' | 'md' }) {
  if (!format) return null;
  return (
    <Badge variant="outline" size={size} className="font-bold uppercase tracking-wide">
      {format.toUpperCase()}
    </Badge>
  );
}

const LOGO_SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-20 w-20 text-2xl',
};

/** Team crest (image or initial). */
export function TeamLogo({
  team,
  size = 'md',
  className = '',
}: {
  team: MatchTeam | null | undefined;
  size?: keyof typeof LOGO_SIZES;
  className?: string;
}) {
  const name = team?.name || '?';
  const dim = LOGO_SIZES[size];
  if (team?.image)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarSrc(team.image, 160)}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${dim} shrink-0 rounded cut-corners-sm bg-surface-2 object-cover ring-1 ring-inset ring-line-subtle ${className}`}
      />
    );
  return (
    <span
      className={`${dim} flex shrink-0 items-center justify-center rounded cut-corners-sm bg-surface-3 font-display font-bold text-ink-2 ring-1 ring-inset ring-line-subtle ${className}`}
    >
      {name[0]?.toUpperCase() || 'T'}
    </span>
  );
}

export function userLabel(u: UserCard | null | undefined) {
  return u?.displayName || u?.username || '?';
}

/** Small avatar of the match MVP with a star. */
export function MvpAvatar({
  user,
  t,
  size = 'sm',
  link = true,
}: {
  user: UserCard | null | undefined;
  t: TFn;
  size?: 'sm' | 'md';
  link?: boolean;
}) {
  if (!user) return null;
  const dim = size === 'md' ? 'h-9 w-9 text-sm' : 'h-7 w-7 text-xs';
  const inner = (
    <span className="relative inline-flex shrink-0" title={`${t('matches.mvp')} : ${userLabel(user)}`}>
      {user.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarSrc(user.avatar, 64)}
          alt={userLabel(user)}
          referrerPolicy="no-referrer"
          className={`${dim} rounded-full border-2 border-accent-gold object-cover`}
        />
      ) : (
        <span className={`${dim} flex items-center justify-center rounded-full border-2 border-accent-gold bg-surface-3 font-bold text-ink-1`}>
          {userLabel(user)[0]?.toUpperCase()}
        </span>
      )}
      <Star
        size={size === 'md' ? 14 : 12}
        className="absolute -bottom-1 -right-1 rounded-full bg-surface-1 p-[1px] text-accent-gold"
        fill="currentColor"
      />
    </span>
  );
  if (!link) return inner;
  return (
    <Link href={`/players/${user.id}`} className="inline-flex" onClick={(e) => e.stopPropagation()}>
      {inner}
    </Link>
  );
}

/** Extract a YouTube video id from the usual URL shapes. */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(embed|live|shorts|v)\/([^/?]+)/);
      if (m) return m[2];
    }
  } catch {
    return null;
  }
  return null;
}

/** Twitch channel or video embed source, when the URL is a twitch link. */
export function twitchEmbed(url: string | null | undefined): string | null {
  if (!url || typeof window === 'undefined') return null;
  try {
    const u = new URL(url);
    if (u.hostname.replace(/^www\./, '') !== 'twitch.tv') return null;
    const parent = window.location.hostname;
    const video = u.pathname.match(/^\/videos\/(\d+)/);
    if (video) return `https://player.twitch.tv/?video=${video[1]}&parent=${parent}&autoplay=false`;
    const channel = u.pathname.split('/')[1];
    if (channel) return `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=false`;
  } catch {
    return null;
  }
  return null;
}

/** "12:34" for seconds. */
export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function localeOf(lang: string) {
  return lang === 'en' ? 'en-GB' : 'fr-FR';
}

export function fmtDay(value: string | Date, lang: string, opts: Intl.DateTimeFormatOptions = {}) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(localeOf(lang), { weekday: 'short', day: '2-digit', month: 'short', ...opts });
}

export function fmtTime(value: string | Date, lang: string) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(localeOf(lang), { hour: '2-digit', minute: '2-digit' });
}

export function fmtDateTime(value: string | Date | null | undefined, lang: string) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(localeOf(lang), {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Local day key (YYYY-MM-DD) used to group matches on the calendar. */
export function localDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
