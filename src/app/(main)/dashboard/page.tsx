'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp, Target, Star, Flame, Swords, Clock, Trophy,
  Gamepad2, RefreshCw, ArrowUpRight, MapPin,
} from 'lucide-react';
import { Card, Badge, StatCard, Button, ProgressBar } from '@/components/ui';
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
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
      </div>
    );
  }

  if (!userProfile.hasGame) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="text-center py-14">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-neon-blue/10 flex items-center justify-center mb-5">
            <Gamepad2 size={30} className="text-neon-blue" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('dashboard.noGame.title')}</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            {t('dashboard.noGame.desc')}
          </p>
          <Link href="/profile">
            <Button variant="primary" size="lg">
              <Gamepad2 size={18} /> {t('dashboard.noGame.link')}
            </Button>
          </Link>
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <Card className="mb-6 overflow-hidden" hover={false}>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {userProfile.avatar ? (
            <img
              src={avatarSrc(userProfile.avatar, 160)}
              alt={userProfile.displayName}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-2xl object-cover border-2 border-neon-blue/40"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-3xl font-bold text-white">
              {userProfile.displayName?.[0]?.toUpperCase() || 'J'}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {userProfile.gameNickname || userProfile.displayName}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
              {userProfile.gameRank && (
                <div className="flex items-center gap-2">
                  {hasRankBadge(userProfile.gameRank) ? (
                    <RankBadge rank={userProfile.gameRank} size={40} />
                  ) : (
                    <Trophy size={18} className="text-yellow-400" />
                  )}
                  <div className="leading-tight text-left">
                    <p className="text-sm font-bold text-white">{userProfile.gameRank}</p>
                    {userProfile.gameRankLevel != null && (
                      <p className="text-[11px] text-gray-400">{userProfile.gameRankLevel} pts</p>
                    )}
                  </div>
                </div>
              )}
              {userProfile.gameLevel != null && (
                <Badge variant="neon" size="sm">{t('dashboard.level')} {userProfile.gameLevel}</Badge>
              )}
              {userProfile.gameCountry && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={12} /> {userProfile.gameCountry}
                </span>
              )}
            </div>

            {userProfile.gameRoles?.length > 0 && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2">
                <span className="text-xs text-gray-500">{t('dashboard.rolesLabel')}</span>
                {userProfile.gameRoles.map((r: any) => (
                  <Badge key={r.role} variant="purple" size="sm" className="gap-1">
                    <RoleIcon role={r.role} size={14} />
                    {t(ROLE_KEYS[r.role] || r.role)}
                  </Badge>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              {t('dashboard.gameId')} {userProfile.mlbbRoleId} · {t('dashboard.gameServer')} {userProfile.mlbbZoneId}
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={sync} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? t('dashboard.syncing') : t('dashboard.sync')}
          </Button>
        </div>
      </Card>

      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-bold text-white">{t('dashboard.stats.title')}</h2>
        <Badge variant="neon" size="sm">{t('dashboard.stats.allModes')}</Badge>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('dashboard.stats.wins')} value={stats.wins ?? 0} icon={<TrendingUp size={16} />} />
        <StatCard label={t('dashboard.stats.winRate')} value={`${winRate}%`} icon={<Target size={16} />} />
        <StatCard label={t('dashboard.stats.mvp')} value={stats.mvpCount ?? 0} icon={<Star size={16} />} />
        <StatCard label={t('dashboard.stats.bestStreak')} value={`${stats.winStreak ?? 0} 🔥`} icon={<Flame size={16} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">{t('dashboard.detail.title')}</h3>
            <span className="text-xs text-gray-500">{t('dashboard.stats.allModes')}</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{t('dashboard.detail.wins')}</span>
                <span className="text-green-400 font-medium">{stats.wins ?? 0}</span>
              </div>
              <ProgressBar value={winRate} color="green" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{t('dashboard.detail.losses')}</span>
                <span className="text-red-400 font-medium">{stats.losses ?? 0}</span>
              </div>
              <ProgressBar value={100 - winRate} color="red" />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg border border-gaming-border bg-gaming-surface/30 p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-neon-blue mb-1">
                  <Swords size={14} /> <span className="text-lg font-bold">{stats.total ?? 0}</span>
                </div>
                <p className="text-xs text-gray-400">{t('dashboard.detail.gamesPlayed')}</p>
              </div>
              <div className="rounded-lg border border-gaming-border bg-gaming-surface/30 p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-neon-purple mb-1">
                  <Star size={14} /> <span className="text-lg font-bold">{stats.avgScore ?? 0}</span>
                </div>
                <p className="text-xs text-gray-400">{t('dashboard.detail.avgScore')}</p>
              </div>
              <div className="rounded-lg border border-gaming-border bg-gaming-surface/30 p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                  <Clock size={14} /> <span className="text-lg font-bold">{Math.round(stats.gameTime ?? 0)}h</span>
                </div>
                <p className="text-xs text-gray-400">{t('dashboard.detail.gameTime')}</p>
              </div>
              <div className="rounded-lg border border-gaming-border bg-gaming-surface/30 p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                  <Trophy size={14} /> <span className="text-lg font-bold">{stats.mvpCount ?? 0}</span>
                </div>
                <p className="text-xs text-gray-400">{t('dashboard.detail.mvp')}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="font-bold text-white">{t('dashboard.favorites.title')}</h3>
            <div className="flex items-center gap-2">
              {seasons.length > 0 && (
                <select
                  value={season ?? ''}
                  onChange={(e) => changeSeason(Number(e.target.value))}
                  disabled={heroesLoading}
                  className="text-xs bg-gaming-surface border border-gaming-border rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-neon-blue disabled:opacity-60"
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
              <div className="w-8 h-8 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
            </div>
          ) : heroes.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
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
                  className="flex items-center gap-3 rounded-lg border border-gaming-border bg-gaming-surface/30 p-2.5"
                >
                  {h.image ? (
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
                    <p
                      className={`text-xs font-medium ${
                        h.winRate >= 50 ? 'text-green-400' : 'text-red-400'
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

      <div className="mt-6 flex justify-center">
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            {t('dashboard.manageProfile')} <ArrowUpRight size={14} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
