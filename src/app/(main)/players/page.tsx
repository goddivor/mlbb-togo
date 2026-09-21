'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Search, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader, SectionCard, Badge, EmptyState, Skeleton, StatTile } from '@/components/ui';
import { PlayerCard } from '@/components/game';
import LevelBadge from '@/components/gamification/LevelBadge';
import { useT } from '@/lib/i18n';
import { fadeUp, stagger, still } from '@/lib/motion';

export default function PlayersPage() {
  const t = useT();
  const reduce = useReducedMotion();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.users
      .list()
      .then((u: any) => setUsers(Array.isArray(u) ? u : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q),
    );
  }, [users, query]);

  const linked = users.filter((u) => u.hasGame).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.section.community')}
        icon={<Users size={20} />}
        title={t('users.title')}
        subtitle={loading ? '…' : `${users.length} ${t('users.count')}`}
      />

      {/* Search + counters */}
      <SectionCard className="!p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('users.search')}
              className="w-full rounded border border-line-strong bg-surface-1 py-2.5 pl-9 pr-3 text-sm text-ink-1 placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] duration-base focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
            />
          </div>
          <div className="flex items-center gap-6">
            <StatTile label={t('users.title')} value={loading ? '—' : users.length} />
            <StatTile label={t('nav.section.esport')} value={loading ? '—' : linked} accent="cyan" />
            {query.trim() && <StatTile label={t('users.search').replace(/…$/, '')} value={filtered.length} accent="violet" />}
          </div>
        </div>
      </SectionCard>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-line-subtle bg-surface-1 p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-[72px] w-[72px] rounded-md" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="mt-4 h-8 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={26} />} title={t('users.none')} />
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          variants={reduce ? still : stagger(0.03)}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((u) => (
            <motion.div key={u.id} variants={reduce ? still : fadeUp}>
              <PlayerCard
                player={u}
                stats={u.hasGame ? { winRate: u.winRate ?? 0 } : null}
                showStats={false}
                action={
                  <span className="flex w-full items-center justify-between gap-2">
                    {u.country ? (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-3">
                        <MapPin size={11} /> {u.country}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="flex items-center gap-2">
                      {!u.hasGame && <span className="text-xs text-ink-3">{t('users.noGame')}</span>}
                      {u.roleUser && u.roleUser !== 'user' && (
                        <Badge variant="purple" size="sm" className="uppercase">{u.roleUser}</Badge>
                      )}
                      <LevelBadge level={u.level} size="xs" />
                    </span>
                  </span>
                }
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
