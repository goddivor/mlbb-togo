'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Trophy, Target, Star, Flame, TrendingUp } from 'lucide-react';
import { Card, Badge, StatCard } from '@/components/ui';
import { api, avatarSrc, mlbbImg } from '@/lib/api';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import { useT } from '@/lib/i18n';

export default function PublicProfilePage() {
  const t = useT();
  const params = useParams();
  const id = String(params?.id || '');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.users
      .get(id)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Link href="/players" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft size={16} /> {t('users.back')}
        </Link>
        <p className="text-center text-gray-500 py-20">{t('users.notFound')}</p>
      </div>
    );
  }

  const stats = user.gameStats || {};
  const heroes: any[] = user.gameFrequentHeroes || [];
  const roles: any[] = user.gameRoles || [];
  const name = user.displayName || user.username;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <Link href="/players" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4">
        <ArrowLeft size={16} /> {t('users.back')}
      </Link>

      <Card className="mb-6" hover={false}>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc(user.avatar, 160)}
              alt={name}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-2xl object-cover border-2 border-neon-blue/40"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-3xl font-bold text-white">
              {name?.[0]?.toUpperCase() || 'J'}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{name}</h1>
              {user.roleUser && user.roleUser !== 'user' && (
                <Badge variant="purple" size="sm">{user.roleUser}</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
              {user.gameRank && (
                <div className="flex items-center gap-2">
                  {hasRankBadge(user.gameRank) ? (
                    <RankBadge rank={user.gameRank} size={34} />
                  ) : (
                    <Trophy size={18} className="text-yellow-400" />
                  )}
                  <div className="leading-tight text-left">
                    <p className="text-sm font-bold text-white">{user.gameRank}</p>
                    {user.gameRankLevel != null && (
                      <p className="text-[11px] text-gray-400">{user.gameRankLevel} pts</p>
                    )}
                  </div>
                </div>
              )}
              {user.gameLevel != null && <Badge variant="neon" size="sm">{t('dashboard.level')} {user.gameLevel}</Badge>}
              {user.country && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={12} /> {user.country}
                </span>
              )}
            </div>

            {roles.length > 0 && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2">
                <span className="text-xs text-gray-500">{t('users.roles')} :</span>
                {roles.map((r: any) => (
                  <Badge key={r.role} variant="purple" size="sm">{t(`role.${r.role}`)}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {!user.hasGame ? (
        <Card className="text-center py-10 text-gray-500" hover={false}>
          {t('users.noGame')}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('dashboard.detail.wins')} value={stats.wins ?? 0} icon={<TrendingUp size={16} />} />
            <StatCard label={t('heroes.winRate')} value={`${stats.winRate ?? 0}%`} icon={<Target size={16} />} />
            <StatCard label="MVP" value={stats.mvpCount ?? 0} icon={<Star size={16} />} />
            <StatCard label="Streak" value={`${stats.winStreak ?? 0} 🔥`} icon={<Flame size={16} />} />
          </div>

          {heroes.length > 0 && (
            <Card hover={false}>
              <h3 className="font-bold text-white mb-4">{t('users.favoriteHeroes')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {heroes.map((h, i) => (
                  <div
                    key={h.heroId ?? i}
                    className="flex items-center gap-3 rounded-lg border border-gaming-border bg-gaming-surface/30 p-2.5"
                  >
                    {h.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mlbbImg(h.image, 80)}
                        alt={h.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover bg-gaming-dark"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gaming-dark" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{h.name}</p>
                      <p className="text-xs text-gray-400">{h.matches} {t('dashboard.favorites.matches')}</p>
                      <p className={`text-xs font-medium ${h.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {h.winRate}{t('dashboard.favorites.winRate')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
