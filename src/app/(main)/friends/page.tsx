'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users2, Check, X, UserMinus } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button, PageHeader, EmptyState, LoadingSpinner, Tabs, Avatar } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import { getSocket, usePresence } from '@/lib/realtime';
import toast from 'react-hot-toast';

export default function FriendsPage() {
  const t = useT();
  const [tab, setTab] = useState<'friends' | 'requests'>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'remove' | 'refuse'; user: any } | null>(null);
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

  // Refresh on live friend notification.
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

  // Removal / refusal confirmation.
  const runConfirm = async () => {
    if (!confirm) return;
    const u = confirm.user;
    if (confirm.kind === 'remove') {
      await act(u.id, () => api.friends.remove(u.id), t('friends.removed'));
    } else {
      await act(u.id + 'r', () => api.friends.remove(u.id));
    }
    setConfirm(null);
  };

  const TABS = [
    { id: 'friends', label: `${t('friends.tab.friends')}${friends.length ? ` (${friends.length})` : ''}`, icon: Users2 },
    { id: 'requests', label: `${t('friends.tab.requests')}${requests.length ? ` (${requests.length})` : ''}`, icon: Check },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader icon={<Users2 size={28} />} title={t('friends.title')} variant="blue" />

      <Tabs tabs={TABS} active={tab} onChange={(id: any) => setTab(id)} />

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : tab === 'friends' ? (
        friends.length === 0 ? (
          <EmptyState icon={<Users2 size={28} />} title={t('friends.none')} />
        ) : (
          <div className="space-y-2">
            {friends.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="flex items-center gap-3 rounded-sm border border-stroke bg-white p-3 shadow-default dark:border-strokedark dark:bg-boxdark"
              >
                <Avatar
                  name={u.displayName || u.username}
                  src={u.avatar ? avatarSrc(u.avatar, 88) : undefined}
                  size="md"
                  online={online.has(u.id)}
                />
                <Link href={`/players/${u.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black transition-colors hover:text-primary dark:text-white">
                    {u.displayName || u.username}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-body dark:text-bodydark">
                    {hasRankBadge(u.gameRank) && <RankBadge rank={u.gameRank} size={14} />}
                    {u.gameRank || u.country}
                  </div>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy === u.id}
                  onClick={() => setConfirm({ kind: 'remove', user: u })}
                >
                  <UserMinus size={14} /> {t('friends.remove')}
                </Button>
              </motion.div>
            ))}
          </div>
        )
      ) : requests.length === 0 ? (
        <EmptyState icon={<Check size={28} />} title={t('friends.noRequests')} />
      ) : (
        <div className="space-y-2">
          {requests.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="flex items-center gap-3 rounded-sm border border-stroke bg-white p-3 shadow-default dark:border-strokedark dark:bg-boxdark"
            >
              <Avatar
                name={u.displayName || u.username}
                src={u.avatar ? avatarSrc(u.avatar, 88) : undefined}
                size="md"
              />
              <Link href={`/players/${u.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-black transition-colors hover:text-primary dark:text-white">
                  {u.displayName || u.username}
                </p>
                {u.country && <p className="text-xs text-body dark:text-bodydark">{u.country}</p>}
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
                  onClick={() => setConfirm({ kind: 'refuse', user: u })}
                >
                  <X size={14} /> {t('friends.refuse')}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Removal / refusal confirmation */}
      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        variant={confirm?.kind === 'refuse' ? 'warning' : 'danger'}
        title={confirm?.kind === 'refuse' ? t('friends.refuse') : t('friends.remove')}
        message={confirm?.user?.displayName || confirm?.user?.username || ''}
        confirmLabel={confirm?.kind === 'refuse' ? t('friends.refuse') : t('friends.remove')}
        cancelLabel={t('admin.esport.cancel')}
        loading={!!busy}
      />
    </div>
  );
}
