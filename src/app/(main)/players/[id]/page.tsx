'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Trophy, UserPlus, UserCheck, UserMinus, Check, X } from 'lucide-react';
import { Card, Badge, Button, Avatar, EmptyState, LoadingSpinner } from '@/components/ui';
import { api, avatarSrc, mlbbImg } from '@/lib/api';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import RoleIcon from '@/components/game/RoleIcon';
import { useAuthStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

export default function PublicProfilePage() {
  const t = useT();
  const params = useParams();
  const id = String(params?.id || '');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const myId = useAuthStore((s: any) => s.user?.id);
  const [fstatus, setFstatus] = useState<string>('none');
  const [fbusy, setFbusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.users
      .get(id)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Link href="/players" className="inline-flex items-center gap-1.5 text-sm text-body hover:text-black dark:text-bodydark dark:hover:text-white">
          <ArrowLeft size={16} /> {t('users.back')}
        </Link>
        <EmptyState icon={<UserPlus size={26} />} title={t('users.notFound')} />
      </div>
    );
  }

  const heroes: any[] = user.gameFrequentHeroes || [];
  const roles: any[] = user.gameRoles || [];
  const name = user.displayName || user.username;

  return (
    <div className="space-y-6">
      <Link href="/players" className="inline-flex items-center gap-1.5 text-sm text-body hover:text-black dark:text-bodydark dark:hover:text-white">
        <ArrowLeft size={16} /> {t('users.back')}
      </Link>

      {/* Profile header */}
      <Card hover={false}>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <Avatar name={name} src={user.avatar ? avatarSrc(user.avatar, 160) : undefined} size="xl" />

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-black dark:text-white">{name}</h1>
              {user.roleUser && user.roleUser !== 'user' && (
                <Badge variant="purple" size="sm">{user.roleUser}</Badge>
              )}
            </div>

            {myId && id !== myId && (
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
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
                    <Button size="sm" variant="ghost" disabled={fbusy} onClick={() => friendAct(() => api.friends.remove(id), 'none', t('friends.removed'))}>
                      <UserMinus size={14} /> {t('friends.remove')}
                    </Button>
                  </>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
              {user.gameRank && (
                <div className="flex items-center gap-2">
                  {hasRankBadge(user.gameRank) ? (
                    <RankBadge rank={user.gameRank} size={34} />
                  ) : (
                    <Trophy size={18} className="text-yellow-400" />
                  )}
                  <div className="leading-tight text-left">
                    <p className="text-sm font-bold text-black dark:text-white">{user.gameRank}</p>
                    {user.gameRankLevel != null && (
                      <p className="text-[11px] text-body dark:text-bodydark">{user.gameRankLevel} pts</p>
                    )}
                  </div>
                </div>
              )}
              {user.gameLevel != null && <Badge variant="neon" size="sm">{t('dashboard.level')} {user.gameLevel}</Badge>}
              {user.country && (
                <span className="inline-flex items-center gap-1 text-xs text-body dark:text-bodydark">
                  <MapPin size={12} /> {user.country}
                </span>
              )}
            </div>

            {roles.length > 0 && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2">
                <span className="text-xs text-bodydark2">{t('users.roles')} :</span>
                {roles.map((r: any) => (
                  <Badge key={r.role} variant="purple" size="sm" className="gap-1">
                    <RoleIcon role={r.role} size={14} />
                    {t(`role.${r.role}`)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {!user.hasGame ? (
        <Card className="text-center py-10 text-bodydark2" hover={false}>
          {t('users.noGame')}
        </Card>
      ) : (
        heroes.length > 0 && (
          <Card hover={false}>
            <h3 className="font-bold text-black dark:text-white mb-4">{t('users.favoriteHeroes')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {heroes.map((h, i) => (
                <div
                  key={h.heroId ?? i}
                  className="flex items-center gap-3 rounded-sm border border-stroke bg-gray-2 p-2.5 dark:border-strokedark dark:bg-meta-4"
                >
                  {h.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mlbbImg(h.image, 80)}
                      alt={h.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-sm object-cover bg-gray dark:bg-boxdark"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-sm bg-gray dark:bg-boxdark" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-black dark:text-white truncate">{h.name}</p>
                    <p className="text-xs text-body dark:text-bodydark">{h.matches} {t('dashboard.favorites.matches')}</p>
                    <p className={`text-xs font-medium ${h.winRate >= 50 ? 'text-success' : 'text-danger'}`}>
                      {h.winRate}{t('dashboard.favorites.winRate')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      )}
    </div>
  );
}
