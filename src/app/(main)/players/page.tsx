'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, MapPin, Users } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { PageHeader, SectionCard, Badge, EmptyState, LoadingSpinner } from '@/components/ui';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import { useT } from '@/lib/i18n';

export default function PlayersPage() {
  const t = useT();
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

  return (
    <div className="space-y-6">
      <PageHeader
        variant="default"
        icon={<Users size={28} className="text-white" />}
        title={t('users.title')}
        subtitle={loading ? '…' : `${users.length} ${t('users.count')}`}
      />

      {/* Recherche */}
      <SectionCard className="!p-4">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bodydark2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('users.search')}
            className="pl-9 pr-3 py-2 w-full text-sm rounded-sm bg-gray-2 border border-stroke text-black placeholder-bodydark2 focus:outline-none focus:border-primary dark:bg-meta-4 dark:border-strokedark dark:text-white"
          />
        </div>
      </SectionCard>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={26} />} title={t('users.none')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.4) }}
            >
              <Link
                href={`/players/${u.id}`}
                className="flex items-center gap-3 rounded-sm border border-stroke bg-white shadow-default hover:border-primary transition-colors p-3 dark:border-strokedark dark:bg-boxdark"
              >
                {u.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc(u.avatar, 96)}
                    alt={u.displayName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border border-stroke dark:border-strokedark"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-white">
                    {(u.displayName || u.username)?.[0]?.toUpperCase() || 'J'}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-black dark:text-white truncate">{u.displayName || u.username}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {u.hasGame ? (
                      <span className="inline-flex items-center gap-1 text-xs text-body dark:text-bodydark">
                        {hasRankBadge(u.gameRank) && <RankBadge rank={u.gameRank} size={16} />}
                        {u.gameRank || `${t('dashboard.level')} ${u.gameLevel ?? '?'}`}
                      </span>
                    ) : (
                      <span className="text-xs text-bodydark2">{t('users.noGame')}</span>
                    )}
                    {u.country && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-bodydark2">
                        <MapPin size={11} /> {u.country}
                      </span>
                    )}
                  </div>
                </div>

                {u.roleUser && u.roleUser !== 'user' && (
                  <Badge variant="purple" size="sm" className="uppercase">{u.roleUser}</Badge>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
