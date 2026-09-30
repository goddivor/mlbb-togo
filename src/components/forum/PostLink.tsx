'use client';

import { ExternalLink, MessageCircle, Play, Youtube } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import type { FeedPost } from './PostCard';

type LinkKind = 'discord' | 'whatsapp' | 'tiktok' | 'youtube' | 'video' | 'other';

/** Which kind of destination a post link points to (drives label and icon). */
export function linkKind(url: string): LinkKind {
  let host = '';
  let path = '';
  try {
    const u = new URL(url);
    host = u.hostname.replace(/^www\./, '').toLowerCase();
    path = u.pathname;
  } catch {
    return 'other';
  }
  const isHost = (h: string) => host === h || host.endsWith(`.${h}`);
  if (host === 'discord.gg' || isHost('discord.com')) return 'discord';
  if (isHost('whatsapp.com') || host === 'wa.me') return 'whatsapp';
  if (isHost('tiktok.com')) return 'tiktok';
  if (host === 'youtu.be' || (isHost('youtube.com') && (path.startsWith('/watch') || path.startsWith('/live') || path.startsWith('/embed')))) {
    return 'video';
  }
  if (isHost('youtube.com')) return 'youtube';
  return 'other';
}

/** The call-to-action of a post: its own link, else its embed (video). */
export function postLinkOf(post: Pick<FeedPost, 'linkUrl' | 'embedUrl'>): string | null {
  const url = post.linkUrl || post.embedUrl || '';
  return /^https?:\/\//i.test(url) ? url : null;
}

/** Real link button of a post (Discord / WhatsApp invite, video...). */
export default function PostLink({
  post,
  compact = false,
  className,
}: {
  post: Pick<FeedPost, 'linkUrl' | 'embedUrl'>;
  compact?: boolean;
  className?: string;
}) {
  const t = useT();
  const url = postLinkOf(post);
  if (!url) return null;
  const kind = linkKind(url);
  const Icon = kind === 'youtube' ? Youtube : kind === 'video' ? Play : kind === 'other' ? ExternalLink : MessageCircle;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center gap-2 rounded border border-primary/40 bg-primary/10 font-semibold text-primary transition-colors duration-fast hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        compact ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm',
        className,
      )}
    >
      <Icon size={compact ? 13 : 16} />
      {t(`comm.link.${kind}`)}
    </a>
  );
}
