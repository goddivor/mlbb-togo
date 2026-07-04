'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Trophy, Gamepad2, RefreshCw, ArrowUpRight, MapPin,
} from 'lucide-react';
import {
  Card, SectionCard, Badge, Button, ProgressBar,
  PageHeader, EmptyState, LoadingSpinner,
} from '@/components/ui';
import { useAuthStore } from '@/store/useStore';
import { api, avatarSrc, mlbbImg } from '@/lib/api';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import RoleIcon from '@/components/game/RoleIcon';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

const ROLE_KEYS: Record<string, string> = {
  tank: 'role.tank',
  fighter: 'role.fighter',
  assassin: 'role.assassin',
  mage: 'role.mage',
  marksman: 'role.marksman',
  support: 'role.support',
};

export default function Dashboard() {
  const userProfile = useAuthStore((s: any) => s.userProfile);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);
  const setUser = useAuthStore((s: any) => s.setUser);
  const [syncing, setSyncing] = useState(false);
  const [season, setSeason] = useState<number | null>(null);
  const [heroes, setHeroes] = useState<any[]>([]);
  const [heroesLoading, setHeroesLoading] = useState(false);
  const t = useT();

  useEffect(() => {
    if (!userProfile) return;
    setSeason(userProfile.gameSeasons?.[0] ?? null);
    setHeroes(userProfile.gameFrequentHeroes || []);
  }, [userProfile?.id]);

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!userProfile.hasGame) {
    return (
      <div className="space-y-6">
        <Card hover={false}>
          <EmptyState
            icon={<Gamepad2 size={30} className="text-primary" />}
            title={t('dashboard.noGame.title')}
            description={t('dashboard.noGame.desc')}
            action={
              <Link href="/profile">
                <Button variant="primary" size="lg">
                  <Gamepad2 size={18} /> {t('dashboard.noGame.link')}
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const stats = userProfile.gameStats || {};
  const seasons: number[] = userProfile.gameSeasons || [];
  const winRate = stats.winRate ?? 0;

  const sync = async () => {
    setSyncing(true);
    try {
      const updated: any = await api.auth.syncGame();
      setUser(updated);
      setUserProfile(updated);
      setSeason(updated.gameSeasons?.[0] ?? null);
      setHeroes(updated.gameFrequentHeroes || []);
      toast.success(t('dashboard.syncSuccess'));
    } catch (e: any) {
      toast.error(e?.message || t('dashboard.syncError'));
    } finally {
      setSyncing(false);
    }
  };

  const changeSeason = async (sid: number) => {
    setSeason(sid);
    setHeroesLoading(true);
    try {
      const list: any = await api.auth.gameHeroes(sid);
      setHeroes(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast.error(e?.message || t('dashboard.seasonError'));
    } finally {
      setHeroesLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile banner */}
      <PageHeader
        variant="default"
        title={
          <span className="flex items-center gap-3">
            {userProfile.avatar ? (
              <img
                src={avatarSrc(userProfile.avatar, 160)}
                alt={userProfile.displayName}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <span className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                {userProfile.displayName?.[0]?.toUpperCase() || 'J'}
              </span>
            )}
            {userProfile.gameNickname || userProfile.displayName}
          </span>
        }
        subtitle={`${t('dashboard.gameId')} ${userProfile.mlbbRoleId} · ${t('dashboard.gameServer')} ${userProfile.mlbbZoneId}`}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={sync}
            disabled={syncing}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? t('dashboard.syncing') : t('dashboard.sync')}
          </Button>
        }
      />

      {/* Game identity: rank, level, roles */}
      <SectionCard className="flex flex-wrap items-center gap-3 !p-4">
        {userProfile.gameRank && (
          <div className="flex items-center gap-2">
            {hasRankBadge(userProfile.gameRank) ? (
              <RankBadge rank={userProfile.gameRank} size={40} />
            ) : (
              <Trophy size={18} className="text-yellow-400" />
            )}
            <div className="leading-tight">
              <p className="text-sm font-bold text-black dark:text-white">{userProfile.gameRank}</p>
              {userProfile.gameRankLevel != null && (
                <p className="text-[11px] text-body dark:text-bodydark">{userProfile.gameRankLevel} pts</p>
              )}
            </div>
          </div>
        )}
        {userProfile.gameLevel != null && (
          <Badge variant="neon" size="sm">{t('dashboard.level')} {userProfile.gameLevel}</Badge>
        )}
        {userProfile.gameCountry && (
          <span className="inline-flex items-center gap-1 text-xs text-body dark:text-bodydark">
            <MapPin size={12} /> {userProfile.gameCountry}
          </span>
        )}
        {userProfile.gameRoles?.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-bodydark2">{t('dashboard.rolesLabel')}</span>
            {userProfile.gameRoles.map((r: any) => (
              <Badge key={r.role} variant="purple" size="sm" className="gap-1">
                <RoleIcon role={r.role} size={14} />
                {t(ROLE_KEYS[r.role] || r.role)}
              </Badge>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats detail */}
        <Card hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-black dark:text-white">{t('dashboard.detail.title')}</h3>
            <Badge variant="neon" size="sm">{t('dashboard.stats.allModes')}</Badge>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-body dark:text-bodydark">{t('dashboard.detail.wins')}</span>
                <span className="text-success font-medium">{stats.wins ?? 0}</span>
              </div>
              <ProgressBar value={winRate} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-body dark:text-bodydark">{t('dashboard.detail.losses')}</span>
                <span className="text-danger font-medium">{stats.losses ?? 0}</span>
              </div>
              <ProgressBar value={100 - winRate} />
            </div>
          </div>
        </Card>

        {/* Favorite heroes */}
        <Card hover={false} className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="font-bold text-black dark:text-white">{t('dashboard.favorites.title')}</h3>
            <div className="flex items-center gap-2">
              {seasons.length > 0 && (
                <select
                  value={season ?? ''}
                  onChange={(e) => changeSeason(Number(e.target.value))}
                  disabled={heroesLoading}
                  className="text-xs bg-gray-2 border border-stroke rounded-sm px-2.5 py-1.5 text-body focus:outline-none focus:border-primary disabled:opacity-60 dark:bg-meta-4 dark:border-strokedark dark:text-bodydark"
                >
                  {seasons.map((s) => (
                    <option key={s} value={s}>{t('dashboard.favorites.seasonLabel')} {s}</option>
                  ))}
                </select>
              )}
              <Badge variant="neon" size="sm">{heroes.length} {t('dashboard.favorites.heroesCount')}</Badge>
            </div>
          </div>

          {heroesLoading ? (
            <div className="flex items-center justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : heroes.length === 0 ? (
            <div className="text-center py-10 text-bodydark2 text-sm">
              {t('dashboard.favorites.none')}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {heroes.map((h, i) => (
                <motion.div
                  key={h.heroId ?? i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-sm border border-stroke bg-gray-2 p-2.5 dark:border-strokedark dark:bg-meta-4"
                >
                  {h.image ? (
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
                    <p
                      className={`text-xs font-medium ${
                        h.winRate >= 50 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {h.winRate}{t('dashboard.favorites.winRate')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="flex justify-center">
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            {t('dashboard.manageProfile')} <ArrowUpRight size={14} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
