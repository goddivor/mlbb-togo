'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Avatar, Badge } from '@/components/ui';
import { avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { fadeUp, stagger, still } from '@/lib/motion';
import LevelBadge from './LevelBadge';

export interface LeaderboardEntry {
  rank: number;
  xp: number;
  level: number;
  user: { id: string; username: string; displayName?: string; avatar?: string | null };
}

const TIER = ['tier-gold', 'tier-silver', 'tier-bronze'];

export default function XpLeaderboard({
  entries,
  highlightId,
}: {
  entries: LeaderboardEntry[];
  highlightId?: string | null;
}) {
  const t = useT();
  const reduce = useReducedMotion();
  if (!entries.length) {
    return <p className="text-sm text-ink-2">{t('progress.leaderboard.empty')}</p>;
  }
  const top = Math.max(...entries.map((e) => e.xp), 1);
  return (
    <motion.ul
      variants={reduce ? still : stagger(0.03)}
      initial="hidden"
      animate="visible"
      className="divide-y divide-line-subtle"
    >
      {entries.map((e) => {
        const name = e.user.displayName || e.user.username;
        const me = highlightId && e.user.id === highlightId;
        const tier = TIER[e.rank - 1];
        return (
          <motion.li key={e.user.id} variants={reduce ? still : fadeUp}>
            <Link
              href={`/dashboard/players/${e.user.id}`}
              className={`relative flex items-center gap-3 px-2 py-2.5 transition-colors duration-fast hover:bg-surface-2/60 ${
                me ? 'bg-primary/5' : ''
              }`}
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary/40"
                style={{ opacity: me ? 1 : 0 }}
              />
              {tier ? (
                <Badge variant={tier} size="sm" className="w-8 justify-center">
                  {e.rank}
                </Badge>
              ) : (
                <span className="flex w-8 shrink-0 items-center justify-center num text-xs font-semibold text-ink-3">
                  {e.rank}
                </span>
              )}
              <Avatar name={name} src={e.user.avatar ? avatarSrc(e.user.avatar, 64) : undefined} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink-1">{name}</span>
                <span className="mt-1 block h-1 w-full max-w-[160px] overflow-hidden rounded-full bg-surface-3">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-primary to-accent-violet"
                    style={{ width: `${Math.max(4, Math.round((e.xp / top) * 100))}%` }}
                  />
                </span>
              </span>
              <LevelBadge level={e.level} size="xs" className="hidden sm:inline-flex" />
              <span className="shrink-0 font-display text-sm font-bold num text-primary">
                {e.xp.toLocaleString()} XP
              </span>
            </Link>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
