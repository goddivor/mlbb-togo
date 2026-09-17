'use client';

import { avatarSrc } from '@/lib/api';

export const TOURNAMENT_STATUS_VARIANT: Record<string, string> = {
  upcoming: 'neon',
  ongoing: 'green',
  completed: 'default',
};

export const MATCH_STATUS_VARIANT: Record<string, string> = {
  pending: 'default',
  scheduled: 'blue',
  live: 'red',
  finished: 'green',
  bye: 'default',
};

/** Round label i18n key from the backend round key. */
export function roundLabelKey(key: string): string {
  return `tournament.round.${key}`;
}

/**
 * Convert a public stream URL (YouTube / Twitch) into an embeddable URL.
 * Returns null when the URL cannot be embedded (caller shows a link instead).
 */
export function streamEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') {
        const id = u.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const m = u.pathname.match(/^\/(live|embed|shorts)\/([^/?]+)/);
      if (m) return `https://www.youtube.com/embed/${m[2]}`;
      return null;
    }
    if (host === 'twitch.tv' || host === 'm.twitch.tv') {
      const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const video = u.pathname.match(/^\/videos\/(\d+)/);
      if (video) return `https://player.twitch.tv/?video=${video[1]}&parent=${parent}`;
      const channel = u.pathname.split('/').filter(Boolean)[0];
      return channel ? `https://player.twitch.tv/?channel=${channel}&parent=${parent}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Square team logo with initial fallback. */
export function TeamLogo({
  name,
  logo,
  size = 'md',
  className = '',
}: {
  name?: string | null;
  logo?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const cls = { sm: 'h-6 w-6 text-[10px]', md: 'h-9 w-9 text-sm', lg: 'h-14 w-14 text-lg' }[size];
  return (
    <div className={`shrink-0 overflow-hidden rounded-lg bg-primary ${cls} ${className}`}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarSrc(logo, 96)} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-bold text-white">
          {name?.[0]?.toUpperCase() || 'T'}
        </span>
      )}
    </div>
  );
}
