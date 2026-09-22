'use client';

import { Heart } from 'lucide-react';
import type { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import { Badge } from '@/components/ui';
import type { CommunityBuild } from '@/lib/api';

type TFn = ReturnType<typeof useT>;

export const BUILD_LANES = ['gold', 'exp', 'jungle', 'mid', 'roam'] as const;
export const REPORT_REASONS = ['spam', 'offensive', 'misleading', 'other'] as const;
export const BUILD_TITLE_MAX = 60;
export const BUILD_NOTES_MAX = 1500;

/** Translated message for an API error (known `code`), else the raw message. */
export function buildErrorMessage(t: TFn, err: any, fallbackKey = 'communityBuilds.error.generic'): string {
  const code = err?.code as string | undefined;
  if (code) {
    const key = `communityBuilds.error.${code}`;
    const text = t(key);
    if (text && text !== key) return text;
  }
  return err?.message || t(fallbackKey);
}

export function StatusBadge({ status, t }: { status: CommunityBuild['status']; t: TFn }) {
  const variant = status === 'published' ? 'green' : status === 'hidden' ? 'red' : 'default';
  return (
    <Badge size="sm" variant={variant} dot>
      {t(`communityBuilds.status.${status}`)}
    </Badge>
  );
}

/** Like toggle with the count; `disabled` for own builds or signed-out viewers. */
export function LikeButton({
  liked,
  count,
  onToggle,
  disabled,
  busy,
  label,
}: {
  liked: boolean;
  count: number;
  onToggle?: () => void;
  disabled?: boolean;
  busy?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled || busy}
      aria-pressed={liked}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold transition-colors duration-fast disabled:cursor-default',
        liked
          ? 'border-accent-red/40 bg-accent-red/10 text-accent-red'
          : 'border-line-strong text-ink-2 enabled:hover:border-accent-red/50 enabled:hover:text-accent-red',
      )}
    >
      <Heart size={14} className={liked ? 'fill-current' : ''} />
      <span className="num">{count}</span>
    </button>
  );
}
