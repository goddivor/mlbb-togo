'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users2, Check, X, UserMinus } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import { getSocket, usePresence } from '@/lib/realtime';
import toast from 'react-hot-toast';

function Avatar({ u, size = 44 }: any) {
  const name = u?.displayName || u?.username || '?';
  return u?.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarSrc(u.avatar, size * 2)}
      alt={name}
      referrerPolicy="no-referrer"
      style={{ width: size, height: size }}
      className="rounded-full object-cover shrink-0 bg-gaming-dark"
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="rounded-full shrink-0 bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-sm font-bold text-white"
    >
      {name[0]?.toUpperCase() || 'J'}
    </div>
  );
}

export default function FriendsPage() {
  const t = useT();
  const [tab, setTab] = useState<'friends' | 'requests'>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const online = usePresence((s) => s.online);
  const connected = usePresence((s) => s.connected);

  const load = async () => {
    try {
      const [f, r] = await Promise.all([api.friends.list(), api.friends.requests()]);
      setFriends(Array.isArray(f) ? f : []);
      setRequests(Array.isArray(r) ? r : []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, []);

  // Rafraîchit sur notification d'ami en direct.
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onNotif = (n: any) => {
      if (n?.type === 'friend_request' || n?.type === 'friend_accept') load();
    };
    s.on('notification:new', onNotif);
    return () => {
      s.off('notification:new', onNotif);
    };
  }, [connected]);

  const act = async (key: string, fn: () => Promise<any>, done?: string) => {
    setBusy(key);
    try {
      await fn();
      if (done) toast.success(done);
      await load();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setBusy(null);
    }
  };

  const TABS = [
    { key: 'friends' as const, label: t('friends.tab.friends'), count: friends.length },
    { key: 'requests' as const, label: t('friends.tab.requests'), count: requests.length },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Users2 size={22} className="text-neon-blue" />
        <h1 className="text-2xl font-bold text-white">{t('friends.title')}</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
              tab === tb.key
                ? 'bg-neon-blue/15 border-neon-blue text-neon-blue'
                : 'bg-gaming-surface/40 border-gaming-border text-gray-400 hover:text-gray-200'
            }`}
          >
            {tb.label}
            {tb.count > 0 && <span className="ml-1.5 text-xs opacity-70">({tb.count})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
        </div>
      ) : tab === 'friends' ? (
        friends.length === 0 ? (
          <div className="text-center py-16 text-gray-500">{t('friends.none')}</div>
        ) : (
          <div className="space-y-2">
            {friends.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="flex items-center gap-3 rounded-xl border border-gaming-border bg-gaming-surface/40 p-3"
              >
                <div className="relative shrink-0">
                  <Avatar u={u} />
                  {online.has(u.id) && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-gaming-surface" />
                  )}
                </div>
                <Link href={`/players/${u.id}`} className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate hover:text-neon-blue transition-colors">
                    {u.displayName || u.username}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                    {hasRankBadge(u.gameRank) && <RankBadge rank={u.gameRank} size={14} />}
                    {u.gameRank || u.country}
                  </div>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy === u.id}
                  onClick={() => act(u.id, () => api.friends.remove(u.id), t('friends.removed'))}
                >
                  <UserMinus size={14} /> {t('friends.remove')}
                </Button>
              </motion.div>
            ))}
          </div>
        )
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-500">{t('friends.noRequests')}</div>
      ) : (
        <div className="space-y-2">
          {requests.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="flex items-center gap-3 rounded-xl border border-gaming-border bg-gaming-surface/40 p-3"
            >
              <Avatar u={u} />
              <Link href={`/players/${u.id}`} className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate hover:text-neon-blue transition-colors">
                  {u.displayName || u.username}
                </p>
                {u.country && <p className="text-xs text-gray-400">{u.country}</p>}
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  disabled={busy === u.id + 'a'}
                  onClick={() => act(u.id + 'a', () => api.friends.accept(u.id), t('friends.added'))}
                >
                  <Check size={14} /> {t('friends.accept')}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={busy === u.id + 'r'}
                  onClick={() => act(u.id + 'r', () => api.friends.remove(u.id))}
                >
                  <X size={14} /> {t('friends.refuse')}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
