'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('users.title')}</h1>
          <p className="text-sm text-gray-400">
            {loading ? '…' : `${users.length} ${t('users.count')}`}
          </p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('users.search')}
            className="pl-9 pr-3 py-2 w-full sm:w-64 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 placeholder-gray-500 focus:outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">{t('users.none')}</div>
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
                className="flex items-center gap-3 rounded-xl border border-gaming-border bg-gaming-surface/40 hover:border-neon-blue transition-colors p-3"
              >
                {u.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc(u.avatar, 96)}
                    alt={u.displayName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover border border-gaming-border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-lg font-bold text-white">
                    {(u.displayName || u.username)?.[0]?.toUpperCase() || 'J'}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{u.displayName || u.username}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {u.hasGame ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-300">
                        {hasRankBadge(u.gameRank) && <RankBadge rank={u.gameRank} size={16} />}
                        {u.gameRank || `${t('dashboard.level')} ${u.gameLevel ?? '?'}`}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">{t('users.noGame')}</span>
                    )}
                    {u.country && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-gray-500">
                        <MapPin size={11} /> {u.country}
                      </span>
                    )}
                  </div>
                </div>

                {u.roleUser && u.roleUser !== 'user' && (
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-neon-purple/15 text-neon-purple border border-neon-purple/30">
                    {u.roleUser}
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
