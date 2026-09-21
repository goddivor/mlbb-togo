'use client';

import Link from 'next/link';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { avatarSrc } from '@/lib/api';
import { Badge, StatRing, StatTile } from '@/components/ui';
import AvatarFrame from './AvatarFrame';
import PlayerTitle from '@/components/gamification/PlayerTitle';
import RoleIcon, { roleLabel } from './RoleIcon';

/** Subset of the `/users/:id` payload the card reads. */
export type PlayerCardUser = {
  id: string;
  username?: string;
  displayName?: string | null;
  avatar?: string | null;
  gameRank?: string | null;
  gameRankLevel?: number | null;
  gameRoles?: Array<{ role: string } | string> | null;
  country?: string | null;
  team?: { id?: string; name: string; image?: string | null } | null;
  /** Equipped reward frame (`id` or `id:variant`) and level title. */
  equippedFrame?: string | null;
  equippedTitle?: string | null;
};

/** Subset of `/users/:id/stats`. */
export type PlayerCardStats = {
  games?: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  kda?: number | string;
  mvpCount?: number;
};

export default function PlayerCard({
  player,
  stats,
  href,
  compact = false,
  showStats = true,
  className,
  action,
}: {
  player: PlayerCardUser;
  stats?: PlayerCardStats | null;
  /** Link target (defaults to the public profile). */
  href?: string | null;
  compact?: boolean;
  /** Hide the games / KDA / MVP row (e.g. directory lists without per-player stats). */
  showStats?: boolean;
  className?: string;
  /** Optional slot at the bottom-right (buttons). */
  action?: React.ReactNode;
}) {
  const t = useT();
  const name = player.displayName || player.username || '?';
  const roles = (player.gameRoles || []).map((r) => (typeof r === 'string' ? r : r.role)).slice(0, 3);
  const winRate = Number(stats?.winRate ?? 0);
  const link = href === undefined ? `/players/${player.id}` : href;

  const body = (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-lg border border-line-subtle bg-surface-1 shadow-elev-1 transition-[transform,box-shadow,border-color] duration-base ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elev-2 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1',
        compact ? 'p-4' : 'p-5',
        className
      )}
    >
      {/* Corner accent */}
      <span aria-hidden="true" className="absolute -right-8 -top-8 h-16 w-16 rotate-45 bg-primary/10 transition-colors group-hover:bg-primary/20" />

      <div className="flex items-start gap-4">
        <AvatarFrame
          frame={player.equippedFrame}
          name={name}
          src={player.avatar ? avatarSrc(player.avatar, 160) : null}
          rank={player.gameRank}
          avatarSize={compact ? 56 : 72}
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="truncate font-display text-lg font-bold leading-tight tracking-tight2 text-ink-1">{name}</h3>
          <PlayerTitle id={player.equippedTitle} size="xs" className="block max-w-full" />
          <p className="mt-0.5 truncate text-xs text-ink-2">
            {player.team?.name ? (
              <span className="inline-flex items-center gap-1.5">
                {player.team.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={player.team.image} alt="" className="h-3.5 w-3.5 rounded-sm object-cover" referrerPolicy="no-referrer" />
                )}
                {player.team.name}
              </span>
            ) : (
              <span className="text-ink-3">@{player.username}</span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {player.gameRank && (
              <Badge variant="tier-gold" size="sm" className="num">
                {player.gameRank}
                {player.gameRankLevel != null && <span className="opacity-80">· {player.gameRankLevel}</span>}
              </Badge>
            )}
            {roles.map((r) => (
              <span key={r} className="inline-flex items-center gap-1 rounded bg-surface-3 px-1.5 py-1 text-[10px] font-semibold text-ink-2">
                <RoleIcon role={r} size={12} />
                {roleLabel(t, r)}
              </span>
            ))}
          </div>
        </div>
        {!compact && (
          <StatRing value={winRate} size={60} stroke={5} accent={winRate >= 50 ? 'cyan' : 'red'} label={`${t('stats.winRate')} ${winRate}%`} />
        )}
      </div>

      {/* Keeps the footer aligned when a reward frame makes a card taller. */}
      <div className="flex-1" aria-hidden="true" />
      {showStats && (
        <div className={cn('mt-4 grid grid-cols-3 gap-2 border-t border-line-subtle pt-3', compact && 'mt-3 pt-2.5')}>
          <StatTile label={t('stats.games')} value={stats?.games ?? '—'} />
          <StatTile label={t('stats.kda')} value={stats?.kda ?? '—'} accent="cyan" align="center" />
          <StatTile label={t('stats.mvp')} value={stats?.mvpCount ?? '—'} accent="gold" align="right" />
        </div>
      )}
      {action && <div className={cn('flex justify-end', showStats ? 'mt-3' : 'mt-4 border-t border-line-subtle pt-3')}>{action}</div>}
    </div>
  );

  return link ? (
    <Link href={link} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg">
      {body}
    </Link>
  ) : (
    body
  );
}
