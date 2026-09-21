'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Users2, Check, X, UserMinus, MessageSquare, UserPlus, Wifi } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button, PageHeader, EmptyState, Tabs, Avatar, Badge, Card, StatCard, Skeleton } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import { getSocket, usePresence } from '@/lib/realtime';
import { fadeUp, stagger, still } from '@/lib/motion';
import toast from 'react-hot-toast';

export default function FriendsPage() {
  const t = useT();
  const router = useRouter();
  const reduce = useReducedMotion();
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

  const onlineCount = friends.filter((u) => online.has(u.id)).length;
  const TABS = [
    { id: 'friends', label: t('friends.tab.friends'), icon: Users2, count: friends.length },
    { id: 'requests', label: t('friends.tab.requests'), icon: UserPlus, count: requests.length },
  ];
  const listVariants = reduce ? still : stagger(0.04);
  const itemVariants = reduce ? still : fadeUp;

  const personRow = (u: any, actions: React.ReactNode, isOnline?: boolean) => (
    <motion.div key={u.id} variants={itemVariants}>
      <Card hover className="!p-4">
        <div className="flex items-center gap-4">
          <Avatar
            name={u.displayName || u.username}
            src={u.avatar ? avatarSrc(u.avatar, 88) : undefined}
            size="lg"
            online={isOnline}
          />
          <Link href={`/dashboard/players/${u.id}`} className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-bold tracking-tight2 text-ink-1 transition-colors hover:text-primary">
              {u.displayName || u.username}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {u.gameRank ? (
                <Badge variant="tier-gold" size="sm" className="gap-1">
                  {hasRankBadge(u.gameRank) && <RankBadge rank={u.gameRank} size={12} />}
                  {u.gameRank}
                </Badge>
              ) : (
                <span className="text-xs text-ink-3">@{u.username}</span>
              )}
              {u.country && <span className="text-xs text-ink-3">{u.country}</span>}
              {isOnline && (
                <Badge variant="green" size="sm" dot>
                  {t('friends.online')}
                </Badge>
              )}
            </div>
          </Link>
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">{actions}</div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow={t('friends.eyebrow')}
        icon={<Users2 size={22} />}
        title={t('friends.title')}
        subtitle={t('friends.subtitle')}
        variant="blue"
      >
        <StatCard label={t('friends.kpi.friends')} value={friends.length} icon={<Users2 size={18} />} accent="cyan" />
        <StatCard label={t('friends.kpi.online')} value={onlineCount} icon={<Wifi size={18} />} accent="green" />
        <StatCard label={t('friends.kpi.pending')} value={requests.length} icon={<UserPlus size={18} />} accent="violet" />
      </PageHeader>

      <div className="overflow-x-auto whitespace-nowrap">
        <Tabs variant="underline" tabs={TABS} active={tab} onChange={(id: any) => setTab(id)} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="!p-4">
              <div className="flex items-center gap-4">
                <Skeleton circle className="h-14 w-14 shrink-0" />
                <Skeleton lines={2} className="flex-1" />
              </div>
            </Card>
          ))}
        </div>
      ) : tab === 'friends' ? (
        friends.length === 0 ? (
          <EmptyState icon={<Users2 size={28} />} title={t('friends.none')} description={t('friends.noneHint')} />
        ) : (
          <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
            {friends.map((u) =>
              personRow(
                u,
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      router.push(
                        `/dashboard/messages?to=${u.id}&name=${encodeURIComponent(u.displayName || u.username)}`,
                      )
                    }
                  >
                    <MessageSquare size={14} /> {t('friends.chat')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy === u.id}
                    onClick={() => setConfirm({ kind: 'remove', user: u })}
                  >
                    <UserMinus size={14} /> {t('friends.remove')}
                  </Button>
                </>,
                online.has(u.id),
              ),
            )}
          </motion.div>
        )
      ) : requests.length === 0 ? (
        <EmptyState icon={<UserPlus size={28} />} title={t('friends.noRequests')} />
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
          {requests.map((u) =>
            personRow(
              u,
              <>
                <Button
                  size="sm"
                  disabled={busy === u.id + 'a'}
                  onClick={() => act(u.id + 'a', () => api.friends.accept(u.id), t('friends.added'))}
                >
                  <Check size={14} /> {t('friends.accept')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === u.id + 'r'}
                  onClick={() => setConfirm({ kind: 'refuse', user: u })}
                >
                  <X size={14} /> {t('friends.refuse')}
                </Button>
              </>,
            ),
          )}
        </motion.div>
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
