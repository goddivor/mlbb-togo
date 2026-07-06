'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Trophy, Gamepad2, RefreshCw, ArrowUpRight, MapPin,
} from 'lucide-react';
import {
  Card, SectionCard, Badge, Button,
  PageHeader, EmptyState, LoadingSpinner,
} from '@/components/ui';
import { useAuthStore } from '@/store/useStore';
import { api, avatarSrc } from '@/lib/api';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

export default function Dashboard() {
  const userProfile = useAuthStore((s: any) => s.userProfile);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);
  const setUser = useAuthStore((s: any) => s.setUser);
  const [syncing, setSyncing] = useState(false);
  const t = useT();

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

  const sync = async () => {
    setSyncing(true);
    try {
      const updated: any = await api.auth.syncGame();
      setUser(updated);
      setUserProfile(updated);
      toast.success(t('dashboard.syncSuccess'));
    } catch (e: any) {
      toast.error(e?.message || t('dashboard.syncError'));
    } finally {
      setSyncing(false);
    }
  };

  const nick = userProfile.gameNickname || userProfile.displayName;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('header.dashboard')}
        breadcrumb={nick}
        action={
          <Button variant="outline" size="sm" onClick={sync} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? t('dashboard.syncing') : t('dashboard.sync')}
          </Button>
        }
      />

      {/* Game identity card: identity on the left, rank/level/country on the right */}
      <SectionCard className="!p-5 sm:!p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Identity */}
          <div className="flex items-center gap-4">
            {userProfile.avatar ? (
              <img
                src={avatarSrc(userProfile.avatar, 160)}
                alt={nick}
                referrerPolicy="no-referrer"
                className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/30"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                {nick?.[0]?.toUpperCase() || 'J'}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-xl font-bold text-black dark:text-white">{nick}</p>
              <p className="mt-0.5 text-sm text-body dark:text-bodydark">
                {t('dashboard.gameId')} {userProfile.mlbbRoleId} · {t('dashboard.gameServer')} {userProfile.mlbbZoneId}
              </p>
            </div>
          </div>

          {/* Rank / peak / level / country */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:justify-end">
            {userProfile.gameRank && (
              <div className="flex items-center gap-2">
                {hasRankBadge(userProfile.gameRank) ? (
                  <RankBadge rank={userProfile.gameRank} size={40} />
                ) : (
                  <Trophy size={18} className="text-yellow-400" />
                )}
                <div className="leading-tight">
                  <p className="text-[10px] uppercase tracking-wide text-bodydark2">{t('dashboard.currentRank')}</p>
                  <p className="text-sm font-bold text-black dark:text-white">{userProfile.gameRank}</p>
                  {userProfile.gameRankLevel != null && (
                    <p className="text-[11px] text-body dark:text-bodydark">{userProfile.gameRankLevel} pts</p>
                  )}
                </div>
              </div>
            )}

            {userProfile.gamePeakRank && (
              <div className="flex items-center gap-2">
                {hasRankBadge(userProfile.gamePeakRank) ? (
                  <RankBadge rank={userProfile.gamePeakRank} size={40} />
                ) : (
                  <Trophy size={18} className="text-yellow-400" />
                )}
                <div className="leading-tight">
                  <p className="text-[10px] uppercase tracking-wide text-bodydark2">{t('dashboard.peakRank')}</p>
                  <p className="text-sm font-bold text-black dark:text-white">{userProfile.gamePeakRank}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              {userProfile.gameLevel != null && (
                <Badge variant="neon" size="sm">{t('dashboard.level')} {userProfile.gameLevel}</Badge>
              )}
              {userProfile.gameCountry && (
                <span className="inline-flex items-center gap-1 text-xs text-body dark:text-bodydark">
                  <MapPin size={12} /> {userProfile.gameCountry}
                </span>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

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
