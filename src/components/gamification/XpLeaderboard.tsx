'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui';
import { avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import LevelBadge from './LevelBadge';

export interface LeaderboardEntry {
  rank: number;
  xp: number;
  level: number;
  user: { id: string; username: string; displayName?: string; avatar?: string | null };
}

const PODIUM = ['bg-[#FFD700] text-black', 'bg-[#C0C0C0] text-black', 'bg-[#CD7F32] text-white'];

export default function XpLeaderboard({
  entries,
  highlightId,
}: {
  entries: LeaderboardEntry[];
  highlightId?: string | null;
}) {
  const t = useT();
  if (!entries.length) {
    return <p className="text-sm text-body dark:text-bodydark">{t('progress.leaderboard.empty')}</p>;
  }
  return (
    <ul className="space-y-1.5">
      {entries.map((e) => {
        const name = e.user.displayName || e.user.username;
        const me = highlightId && e.user.id === highlightId;
        return (
          <li key={e.user.id}>
            <Link
              href={`/players/${e.user.id}`}
              className={`flex items-center gap-3 rounded-sm px-2 py-1.5 transition-colors hover:bg-gray-2 dark:hover:bg-meta-4 ${
                me ? 'bg-primary/10' : ''
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  PODIUM[e.rank - 1] ?? 'bg-gray text-body dark:bg-meta-4 dark:text-bodydark'
                }`}
              >
                {e.rank}
              </span>
              <Avatar name={name} src={e.user.avatar ? avatarSrc(e.user.avatar, 64) : undefined} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-black dark:text-white">
                {name}
              </span>
              <LevelBadge level={e.level} size="xs" />
              <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">
                {e.xp.toLocaleString()} XP
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
