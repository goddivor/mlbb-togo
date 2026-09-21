'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Trophy, UserPlus, UserCheck, UserMinus, Check, X, MessageSquare } from 'lucide-react';
import { Card, Badge, Button, EmptyState, Skeleton, StatTile } from '@/components/ui';
import { api, avatarSrc } from '@/lib/api';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import RankFrame from '@/components/game/RankFrame';
import RoleIcon, { roleLabel } from '@/components/game/RoleIcon';
import PlayerStatsSection from '@/components/profile/PlayerStatsSection';
import MatchHistory from '@/components/profile/MatchHistory';
import GameAccountSection from '@/components/profile/GameAccountSection';
import LevelBadge from '@/components/gamification/LevelBadge';
import { useAuthStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

export default function PublicProfilePage() {
  const t = useT();
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || '');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const myId = useAuthStore((s: any) => s.user?.id);
  const [fstatus, setFstatus] = useState<string>('none');
  const [fbusy, setFbusy] = useState(false);
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.users
      .get(id)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    api.gamification
      .user(id)
      .then((g: any) => setLevel(g?.level ?? null))
      .catch(() => setLevel(null));
  }, [id]);

  useEffect(() => {
    if (!id || !myId || id === myId) return;
    api.friends.status(id).then((r: any) => setFstatus(r?.status || 'none')).catch(() => {});
  }, [id, myId]);

  const friendAct = async (fn: () => Promise<any>, next: string, done?: string) => {
    setFbusy(true);
    try {
      await fn();
      setFstatus(next);
      if (done) toast.success(done);
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setFbusy(false);
    }
  };

  const backLink = (
    <Link href="/players" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink-1">
      <ArrowLeft size={16} /> {t('users.back')}
    </Link>
  );

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        {backLink}
        <Card>
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <Skeleton className="h-24 w-24 rounded-md" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        {backLink}
        <EmptyState icon={<UserPlus size={26} />} title={t('users.notFound')} />
      </div>
    );
  }

  const roles: any[] = user.gameRoles || [];
  const name = user.displayName || user.username;

  return (
    <div className="space-y-6">
      {backLink}

      {/* Profile header */}
      <Card className="relative overflow-hidden">
        <span aria-hidden="true" className="absolute -right-8 -top-8 h-16 w-16 rotate-45 bg-primary/10" />
        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <RankFrame name={name} src={user.avatar ? avatarSrc(user.avatar, 200) : null} rank={user.gameRank} size={96} />

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="eyebrow mb-1.5">
              {t('nav.section.community')}
              {user.username && <span className="ml-2 normal-case tracking-normal text-ink-3">@{user.username}</span>}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-display text-2xl font-bold tracking-tight2 text-ink-1 md:text-3xl">{name}</h1>
              <LevelBadge level={level} />
              {user.roleUser && user.roleUser !== 'user' && (
                <Badge variant="purple" size="sm" className="uppercase">{user.roleUser}</Badge>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:justify-start">
              {user.gameRank && (
                <div className="flex items-center gap-2">
                  {hasRankBadge(user.gameRank) ? (
                    <RankBadge rank={user.gameRank} size={36} />
                  ) : (
                    <Trophy size={18} className="text-accent-gold" />
                  )}
                  <StatTile
                    label={t('dashboard.currentRank')}
                    value={
                      <span className="text-base">
                        {user.gameRank}
                        {user.gameRankLevel != null && <span className="ml-1.5 text-xs font-semibold text-ink-3">{user.gameRankLevel} pts</span>}
                      </span>
                    }
                  />
                </div>
              )}
              {user.gamePeakRank && (
                <div className="flex items-center gap-2">
                  {hasRankBadge(user.gamePeakRank) ? (
                    <RankBadge rank={user.gamePeakRank} size={30} />
                  ) : (
                    <Trophy size={16} className="text-accent-gold" />
                  )}
                  <StatTile label={t('dashboard.peakRank')} value={<span className="text-base">{user.gamePeakRank}</span>} accent="gold" />
                </div>
              )}
              {user.gameLevel != null && <Badge variant="neon" size="sm">{t('dashboard.level')} {user.gameLevel}</Badge>}
              {user.country && (
                <span className="inline-flex items-center gap-1 text-xs text-ink-2">
                  <MapPin size={12} /> {user.country}
                </span>
              )}
            </div>

            {roles.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('users.roles')}</span>
                {roles.map((r: any) => (
                  <span key={r.role} className="inline-flex items-center gap-1 rounded bg-surface-3 px-1.5 py-1 text-[11px] font-semibold text-ink-2">
                    <RoleIcon role={r.role} size={13} />
                    {roleLabel(t, r.role)}
                  </span>
                ))}
              </div>
            )}

            {myId && id !== myId && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {fstatus === 'none' && (
                  <Button size="sm" disabled={fbusy} onClick={() => friendAct(() => api.friends.request(id), 'pending_out', t('friends.sent'))}>
                    <UserPlus size={15} /> {t('friends.add')}
                  </Button>
                )}
                {fstatus === 'pending_out' && (
                  <Button size="sm" variant="secondary" disabled={fbusy} onClick={() => friendAct(() => api.friends.remove(id), 'none')}>
                    {t('friends.cancel')}
                  </Button>
                )}
                {fstatus === 'pending_in' && (
                  <>
                    <Button size="sm" disabled={fbusy} onClick={() => friendAct(() => api.friends.accept(id), 'friends', t('friends.added'))}>
                      <Check size={15} /> {t('friends.accept')}
                    </Button>
                    <Button size="sm" variant="danger" disabled={fbusy} onClick={() => friendAct(() => api.friends.remove(id), 'none')}>
                      <X size={15} /> {t('friends.refuse')}
                    </Button>
                  </>
                )}
                {fstatus === 'friends' && (
                  <>
                    <Badge variant="green" size="md" className="gap-1">
                      <UserCheck size={14} /> {t('friends.friends')}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        router.push(
                          `/messages?to=${id}&name=${encodeURIComponent(user.displayName || user.username)}`,
                        )
                      }
                    >
                      <MessageSquare size={14} /> {t('friends.chat')}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={fbusy} onClick={() => friendAct(() => api.friends.remove(id), 'none', t('friends.removed'))}>
                      <UserMinus size={14} /> {t('friends.remove')}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {!user.hasGame ? (
        <Card className="py-10 text-center text-sm text-ink-3">
          {t('users.noGame')}
        </Card>
      ) : (
        <GameAccountSection userId={id} />
      )}

      {/* Esport stats computed from the platform's matches */}
      <PlayerStatsSection userId={id} />
      <MatchHistory userId={id} />
    </div>
  );
}
