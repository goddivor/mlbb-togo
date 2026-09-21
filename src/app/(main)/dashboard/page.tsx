'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy, Gamepad2, RefreshCw, ArrowUpRight, MapPin,
} from 'lucide-react';
import {
  Card, Badge, Button, PageHeader, LoadingSpinner, StatTile,
} from '@/components/ui';
import { useAuthStore } from '@/store/useStore';
import { api, avatarSrc, clearApiCache } from '@/lib/api';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import RankFrame from '@/components/game/RankFrame';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';
import { notifyGameSync } from '@/components/profile/gameSyncToast';
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

/** Game identity card: the player's in-game identity, framed by rank tier. */
function GameIdentityCard({ userProfile }: { userProfile: any }) {
  const t = useT();
  const nick = userProfile.gameNickname || userProfile.displayName;

  if (!userProfile.hasGame) {
    return (
      <Card className="!p-5 sm:!p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded cut-corners bg-accent-cyan/10 text-accent-cyan">
              <Gamepad2 size={26} />
            </span>
            <div>
              <p className="font-display text-lg font-bold tracking-tight2 text-ink-1">{t('dashboard.noGame.title')}</p>
              <p className="text-sm text-ink-2">{t('gameAccount.link.noGameDesc')}</p>
            </div>
          </div>
          <Link href="/profile">
            <Button variant="primary" size="md">
              <Gamepad2 size={16} /> {t('dashboard.noGame.link')}
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card glow className="relative overflow-hidden !p-5 sm:!p-6">
      {/* Corner accent: the only glow element of the page. */}
      <span aria-hidden="true" className="absolute -right-8 -top-8 h-16 w-16 rotate-45 bg-primary/10" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Identity */}
        <div className="flex items-center gap-4">
          <RankFrame
            name={nick}
            src={userProfile.avatar ? avatarSrc(userProfile.avatar, 160) : null}
            rank={userProfile.gameRank}
            size={72}
          />
          <div className="min-w-0">
            <p className="eyebrow mb-1">{t('dashboard.gameId')} {userProfile.mlbbRoleId}</p>
            <p className="truncate font-display text-2xl font-bold leading-tight tracking-tight2 text-ink-1">{nick}</p>
            <p className="mt-0.5 text-sm num text-ink-2">
              {t('dashboard.gameServer')} {userProfile.mlbbZoneId}
              {userProfile.gameCountry && (
                <span className="ml-2 inline-flex items-center gap-1 text-ink-3">
                  <MapPin size={12} /> {userProfile.gameCountry}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Rank / peak / level */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:justify-end">
          {userProfile.gameRank && (
            <div className="flex items-center gap-2.5">
              {hasRankBadge(userProfile.gameRank) ? (
                <RankBadge rank={userProfile.gameRank} size={40} />
              ) : (
                <Trophy size={18} className="text-accent-gold" />
              )}
              <StatTile
                label={t('dashboard.currentRank')}
                value={
                  <span className="text-base">
                    {userProfile.gameRank}
                    {userProfile.gameRankLevel != null && (
                      <span className="ml-1.5 text-xs font-semibold text-ink-3">{userProfile.gameRankLevel} pts</span>
                    )}
                  </span>
                }
              />
            </div>
          )}

          {userProfile.gamePeakRank && (
            <div className="flex items-center gap-2.5">
              {hasRankBadge(userProfile.gamePeakRank) ? (
                <RankBadge rank={userProfile.gamePeakRank} size={40} />
              ) : (
                <Trophy size={18} className="text-accent-gold" />
              )}
              <StatTile label={t('dashboard.peakRank')} value={<span className="text-base">{userProfile.gamePeakRank}</span>} accent="gold" />
            </div>
          )}

          <div className="flex items-center gap-3">
            {userProfile.gameLevel != null && (
              <Badge variant="neon" size="sm">{t('dashboard.level')} {userProfile.gameLevel}</Badge>
            )}
            <Link href="/profile" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              {t('dashboard.manageProfile')} <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </Card>
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
      notifyGameSync(t, updated?.gameSyncStatus);
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
        eyebrow={nick}
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
        <div className="flex items-center justify-between gap-3 rounded-lg border border-accent-red/40 bg-accent-red/5 px-4 py-3 text-sm text-accent-red">
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
          <QuickStatsWidget stats={data.quickStats} game={data.game} className="md:col-span-2" />
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
