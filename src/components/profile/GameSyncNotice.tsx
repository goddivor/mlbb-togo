'use client';

import Link from 'next/link';
import { AlertTriangle, History, Link2 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import { useLangStore } from '@/store/useStore';

export type GameSync = {
  status?: string | null;
  lastSyncAt?: string | null;
  tokenStatus?: string | null;
  statsAvailable?: boolean;
};

/** "Last synced on …" with the viewer's locale. */
export function useLastSyncLabel() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  return (date?: string | null) =>
    date
      ? t('gameAccount.lastSync', {
          date: new Date(date).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        })
      : t('gameAccount.neverSynced');
}

/**
 * Discreet state line of the cached game data: when it was last refreshed,
 * whether the last refresh failed (owner only) and, for the owner, a way to
 * reconnect an expired game session. A legacy `moonton_offline` status is
 * treated as a normal sync: detailed stats are gone for good (MLBB Academy
 * closed), there is nothing to wait for.
 */
export default function GameSyncNotice({
  sync,
  isOwner,
  onReconnect,
  className,
}: {
  sync?: GameSync | null;
  isOwner?: boolean;
  /** Opens the link modal in place (profile page) instead of navigating. */
  onReconnect?: () => void;
  className?: string;
}) {
  const t = useT();
  const lastSync = useLastSyncLabel();
  if (!sync) return null;

  const expired = sync.tokenStatus === 'expired' || sync.status === 'token_expired';
  const status = expired ? 'token_expired' : sync.status;
  // Sync failures only concern the owner: visitors just see the last sync date.
  const warn = !!isOwner && (status === 'token_expired' || status === 'unavailable');
  const Icon = warn ? AlertTriangle : History;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded border px-3 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between',
        warn
          ? 'border-accent-gold/30 bg-accent-gold/5 text-ink-2'
          : 'border-line-subtle bg-surface-2/40 text-ink-2',
        className,
      )}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-2">
        <Icon size={14} className={cn('mt-0.5 shrink-0', warn ? 'text-accent-gold' : 'text-ink-3')} />
        <p className="min-w-0">
          {warn && (
            <span className="text-ink-1">{t(`gameAccount.status.${status}`)} </span>
          )}
          <span className="num text-ink-3">{lastSync(sync.lastSyncAt)}</span>
        </p>
      </div>
      {isOwner && expired && (onReconnect ? (
        <button
          type="button"
          onClick={onReconnect}
          className="inline-flex shrink-0 items-center gap-1 self-start whitespace-nowrap font-semibold text-primary hover:underline sm:self-auto"
        >
          <Link2 size={12} /> {t('gameAccount.reconnect')}
        </button>
      ) : (
        <Link
          href="/dashboard/profile?relink=1"
          className="inline-flex shrink-0 items-center gap-1 self-start whitespace-nowrap font-semibold text-primary hover:underline sm:self-auto"
        >
          <Link2 size={12} /> {t('gameAccount.reconnect')}
        </Link>
      ))}
    </div>
  );
}
