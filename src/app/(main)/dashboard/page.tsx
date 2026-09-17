'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy, Gamepad2, RefreshCw, ArrowUpRight, MapPin,
} from 'lucide-react';
import {
  SectionCard, Badge, Button, PageHeader, LoadingSpinner,
} from '@/components/ui';
import { useAuthStore } from '@/store/useStore';
import { api, avatarSrc, clearApiCache } from '@/lib/api';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';
import { getSocket, usePresence } from '@/lib/realtime';
import {
  ActivityWidget,
  LastMatchesWidget,
  NotificationsWidget,
  QuickStatsWidget,
  RankWidget,
  ShortcutsWidget,
  UpcomingWidget,
  WidgetSkeleton,
} from '@/components/dashboard/widgets';

/** Game identity card (kept as the first widget of the grid). */
function GameIdentityCard({ userProfile }: { userProfile: any }) {
  const t = useT();
  const nick = userProfile.gameNickname || userProfile.displayName;

  if (!userProfile.hasGame) {
    return (
      <SectionCard className="!p-5 sm:!p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Gamepad2 size={26} />
            </span>
            <div>
              <p className="text-lg font-bold text-black dark:text-white">{t('dashboard.noGame.title')}</p>
              <p className="text-sm text-body dark:text-bodydark">{t('dashboard.noGame.desc')}</p>
            </div>
          </div>
          <Link href="/profile">
            <Button variant="primary" size="md">
              <Gamepad2 size={16} /> {t('dashboard.noGame.link')}
            </Button>
          </Link>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard className="!p-5 sm:!p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Identity */}
        <div className="flex items-center gap-4">
          {userProfile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
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
            <Link href="/profile" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              {t('dashboard.manageProfile')} <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export default function Dashboard() {
  const userProfile = useAuthStore((s: any) => s.userProfile);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);
  const setUser = useAuthStore((s: any) => s.setUser);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const connected = usePresence((s) => s.connected);
  const router = useRouter();
  const t = useT();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const d: any = await api.dashboard.get();
      setData(d);
      setError(!d?.quickStats);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the notifications widget live without polling.
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onNotif = (n: any) => {
      setData((prev: any) =>
        prev
          ? {
              ...prev,
              notifications: {
                unread: (prev.notifications?.unread ?? 0) + 1,
                latest: [n, ...(prev.notifications?.latest ?? [])].slice(0, 5),
              },
            }
          : prev,
      );
    };
    s.on('notification:new', onNotif);
    return () => {
      s.off('notification:new', onNotif);
    };
  }, [connected]);

  const refresh = () => {
    clearApiCache();
    load(true);
  };

  const openNotification = async (n: any) => {
    if (!n.read) {
      try {
        await api.notifications.markRead(n.id);
      } catch {
        // Best effort: the widget still navigates.
      }
      setData((prev: any) =>
        prev
          ? {
              ...prev,
              notifications: {
                unread: Math.max(0, (prev.notifications?.unread ?? 1) - 1),
                latest: (prev.notifications?.latest ?? []).map((x: any) =>
                  x.id === n.id ? { ...x, read: true } : x,
                ),
              },
            }
          : prev,
      );
    }
    router.push(n.link || '/notifications');
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
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
      refresh();
    } catch (e: any) {
      toast.error(e?.message || t('dashboard.syncError'));
    } finally {
      setSyncing(false);
    }
  };

  const nick = userProfile.gameNickname || userProfile.displayName;
  const grid = 'grid grid-cols-1 gap-6 md:grid-cols-2 md:grid-flow-dense xl:grid-cols-3';

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('header.dashboard')}
        breadcrumb={nick}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {t('dashboard.refresh')}
            </Button>
            {userProfile.hasGame && (
              <Button variant="outline" size="sm" onClick={sync} disabled={syncing}>
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {syncing ? t('dashboard.syncing') : t('dashboard.sync')}
              </Button>
            )}
          </div>
        }
      />

      <GameIdentityCard userProfile={userProfile} />

      {error && !loading && (
        <div className="flex items-center justify-between gap-3 rounded-sm border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
          <span>{t('dashboard.loadError')}</span>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw size={14} /> {t('dashboard.refresh')}
          </Button>
        </div>
      )}

      {loading || !data ? (
        <div className={grid} aria-busy="true">
          <WidgetSkeleton rows={2} className="md:col-span-2" />
          <WidgetSkeleton rows={2} />
          <WidgetSkeleton rows={5} className="md:col-span-2" />
          <WidgetSkeleton rows={5} />
          <WidgetSkeleton rows={4} className="md:col-span-2" />
          <WidgetSkeleton rows={4} />
          <WidgetSkeleton rows={1} className="md:col-span-2 xl:col-span-3" />
        </div>
      ) : (
        <div className={grid}>
          <QuickStatsWidget stats={data.quickStats} className="md:col-span-2" />
          <RankWidget rank={data.rank} />
          <ActivityWidget events={data.activity} className="md:col-span-2" />
          <LastMatchesWidget matches={data.lastMatches} userId={userProfile.id} />
          <UpcomingWidget items={data.upcoming} className="md:col-span-2" />
          <NotificationsWidget
            unread={data.notifications?.unread ?? 0}
            latest={data.notifications?.latest ?? []}
            onOpen={openNotification}
          />
          <ShortcutsWidget className="md:col-span-2 xl:col-span-3" />
        </div>
      )}
    </div>
  );
}
