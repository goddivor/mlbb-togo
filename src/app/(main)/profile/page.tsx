'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Gamepad2, Check, Link2, Unlink, RefreshCw, ShieldCheck, User, Trophy, Star, Flame, Swords,
} from 'lucide-react';
import { Card, Badge, Button, PageHeader, StatCard, StatRing, SectionTitle, Skeleton } from '@/components/ui';
import RankFrame from '@/components/game/RankFrame';
import { cn } from '@/lib/helpers';
import { fadeUp, stagger, still } from '@/lib/motion';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useAuthStore } from '@/store/useStore';
import { api, avatarSrc, mlbbImg } from '@/lib/api';
import LinkGameModal from '@/components/profile/LinkGameModal';
import LevelBadge from '@/components/gamification/LevelBadge';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';
import { notifyGameSync } from '@/components/profile/gameSyncToast';
import GameSyncNotice from '@/components/profile/GameSyncNotice';

export default function ProfilePage() {
  const userProfile = useAuthStore((s: any) => s.userProfile);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);
  const setUser = useAuthStore((s: any) => s.setUser);
  const [linkGameOpen, setLinkGameOpen] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const t = useT();
  const reduce = useReducedMotion();

  useEffect(() => {
    api.gamification
      .me()
      .then((g: any) => setLevel(g?.level ?? null))
      .catch(() => setLevel(null));
  }, []);

  // Reconnect CTA elsewhere (dashboard, notices) lands here with ?relink=1.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('relink') === '1') setLinkGameOpen(true);
  }, []);

  useEffect(() => {
    if (document.getElementById('gis-script')) return;
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.id = 'gis-script';
    document.head.appendChild(s);
  }, []);

  if (!userProfile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-52 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  const apply = (updated: any) => {
    setUser(updated);
    setUserProfile(updated);
  };

  const linkGoogle = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const g = (window as any).google;
    if (!clientId || !g?.accounts?.oauth2) {
      toast.error(t('profile.googleLoading'));
      return;
    }
    const client = g.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (resp: any) => {
        if (!resp?.access_token) {
          toast.error(t('profile.googleCanceled'));
          return;
        }
        setBusy('google');
        try {
          const updated: any = await api.auth.linkGoogle({ accessToken: resp.access_token });
          apply(updated);
          toast.success(t('profile.googleSuccess'));
        } catch (e: any) {
          toast.error(e?.message || t('profile.googleError'));
        } finally {
          setBusy(null);
        }
      },
    });
    client.requestAccessToken();
  };

  const chooseSource = async (source: 'google' | 'game') => {
    if (userProfile.profileSource === source) return;
    setBusy(`source-${source}`);
    try {
      const updated: any = await api.auth.setProfileSource(source);
      apply(updated);
      toast.success(t('profile.sourceSuccess'));
    } catch (e: any) {
      toast.error(e?.message || t('profile.sourceError'));
    } finally {
      setBusy(null);
    }
  };

  const sync = async () => {
    setBusy('sync');
    try {
      const updated: any = await api.auth.syncGame();
      apply(updated);
      notifyGameSync(t, updated?.gameSyncStatus);
    } catch (e: any) {
      toast.error(e?.message || t('profile.syncError'));
    } finally {
      setBusy(null);
    }
  };

  const doUnlinkGame = async () => {
    setBusy('unlink');
    try {
      const updated: any = await api.auth.unlinkMlbb();
      apply(updated);
      toast.success(t('profile.gameUnlinkSuccess'));
      setUnlinkOpen(false);
    } catch (e: any) {
      toast.error(e?.message || t('profile.gameUnlinkError'));
    } finally {
      setBusy(null);
    }
  };

  const heroes: any[] = userProfile.gameFrequentHeroes || [];
  const name = userProfile.displayName || userProfile.username;
  const games = (userProfile.wins || 0) + (userProfile.losses || 0);
  const winRate = games ? Math.round(((userProfile.wins || 0) / games) * 100) : Number(userProfile.winRate || 0);
  const streak = Number(userProfile.streak || 0);
  const bannerHero = heroes.find((h) => h.image)?.image;
  const bannerSrc = bannerHero ? mlbbImg(bannerHero, 1200) : undefined;

  const sourceCard = (
    key: 'game' | 'google',
    enabled: boolean,
    icon: React.ReactNode,
    title: string,
    desc: string,
  ) => {
    const active = userProfile.profileSource === key;
    return (
      <button
        onClick={() => chooseSource(key)}
        disabled={!enabled || busy === `source-${key}`}
        aria-pressed={active}
        className={cn(
          'flex items-center gap-3 rounded border p-4 text-left transition-[border-color,background-color] duration-fast disabled:cursor-not-allowed disabled:opacity-50',
          active ? 'border-primary bg-primary/10' : 'border-line-subtle bg-surface-2/60 hover:border-line-strong',
        )}
      >
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded cut-corners-sm', active ? 'bg-primary/15 text-primary' : 'bg-surface-3 text-ink-2')}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-1">{title}</p>
          <p className="truncate text-xs text-ink-2">{desc}</p>
        </div>
        {active && <Check size={16} className="shrink-0 text-primary" />}
      </button>
    );
  };

  const linkedRow = (icon: React.ReactNode, title: string, desc: string, right: React.ReactNode, linked: boolean) => (
    <div className={cn('flex flex-wrap items-center gap-3 rounded border p-4', linked ? 'border-accent-green/30 bg-accent-green/5' : 'border-line-subtle bg-surface-2/60')}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded cut-corners-sm bg-surface-1 ring-1 ring-inset ring-line-subtle">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink-1">{title}</p>
        <p className="truncate text-xs text-ink-2 num">{desc}</p>
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={userProfile.gameRank || t('profile.title')}
        icon={<User size={22} />}
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {name}
            <LevelBadge level={level} size="md" />
          </span>
        }
        subtitle={
          <>
            {t('profile.displayedProfile')}{' '}
            <span className="font-semibold text-white">
              {userProfile.profileSource === 'google' ? t('profile.googleProfile') : t('profile.gameProfile')}
            </span>
            {userProfile.gameNickname && userProfile.hasGame && (
              <span className="num"> · {t('dashboard.gameId')} {userProfile.mlbbRoleId} · {t('dashboard.gameServer')} {userProfile.mlbbZoneId}</span>
            )}
          </>
        }
        variant="purple"
        banner={bannerSrc}
        breadcrumb={t('profile.title')}
        action={
          <RankFrame
            name={name}
            src={userProfile.avatar ? avatarSrc(userProfile.avatar, 200) : null}
            rank={userProfile.gameRank}
            size={88}
          />
        }
      >
        <StatCard
          label={t('profile.winrate')}
          value={`${winRate}%`}
          hint={`${userProfile.wins || 0} ${t('profile.wins')}`}
          icon={<Trophy size={18} />}
          accent="cyan"
          sparkline={<StatRing value={winRate} size={44} stroke={4} accent={winRate >= 50 ? 'cyan' : 'red'} label={`${t('profile.winrate')} ${winRate}%`} />}
        />
        <StatCard label={t('stats.games')} value={games} icon={<Swords size={18} />} accent="violet" />
        <StatCard label={t('profile.mvp')} value={userProfile.mvpCount || 0} icon={<Star size={18} />} accent="gold" />
        <StatCard
          label={t('profile.streak')}
          value={streak > 0 ? `+${streak}` : streak}
          icon={<Flame size={18} />}
          accent={streak > 0 ? 'green' : streak < 0 ? 'red' : 'cyan'}
        />
      </PageHeader>

      <Card>
        <SectionTitle title={t('profile.shownProfile')} description={t('profile.subtitle')} className="mb-4" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sourceCard(
            'game',
            !!userProfile.hasGame,
            <Gamepad2 size={20} />,
            t('profile.gameProfile'),
            userProfile.gameNickname || (userProfile.hasGame ? `${t('dashboard.gameId')} ${userProfile.mlbbRoleId} · ${t('dashboard.gameServer')} ${userProfile.mlbbZoneId}` : t('profile.profileSource.nonLinked')),
          )}
          {sourceCard(
            'google',
            !!userProfile.hasGoogle,
            <GoogleGlyph />,
            t('profile.googleProfile'),
            userProfile.googleName || (userProfile.hasGoogle ? userProfile.googleEmail || t('profile.googleLinked') : t('profile.googleDescUnlinked')),
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle title={t('profile.linkedAccounts')} className="mb-4" />
        <div className="space-y-3">
          {linkedRow(
            <GoogleGlyph />,
            t('profile.google'),
            userProfile.hasGoogle
              ? userProfile.googleEmail || userProfile.googleName || t('profile.googleLinked')
              : t('profile.googleDescUnlinked'),
            userProfile.hasGoogle ? (
              <Badge variant="green" size="sm" className="gap-1"><ShieldCheck size={12} /> {t('profile.googleLinked')}</Badge>
            ) : (
              <Button variant="secondary" size="sm" onClick={linkGoogle} disabled={busy === 'google'}>
                <Link2 size={14} /> {t('profile.googleLink')}
              </Button>
            ),
            !!userProfile.hasGoogle,
          )}
          {linkedRow(
            <Gamepad2 size={20} className="text-primary" />,
            t('profile.gameAccount'),
            userProfile.hasGame
              ? `${t('dashboard.gameId')} ${userProfile.mlbbRoleId} · ${t('dashboard.gameServer')} ${userProfile.mlbbZoneId}`
              : t('profile.gameDescUnlinked'),
            userProfile.hasGame ? (
              <>
                <Badge variant="green" size="sm" className="gap-1"><ShieldCheck size={12} /> {t('profile.gameLinked')}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUnlinkOpen(true)}
                  disabled={busy === 'unlink' || !userProfile.hasGoogle}
                  title={!userProfile.hasGoogle ? t('profile.gameUnlinkNeedsGoogle') : undefined}
                >
                  <Unlink size={14} /> {t('profile.gameUnlink')}
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setLinkGameOpen(true)}>
                <Link2 size={14} /> {t('profile.gameLink')}
              </Button>
            ),
            !!userProfile.hasGame,
          )}
        </div>
      </Card>

      {userProfile.hasGame && (
        <Card>
          <SectionTitle
            title={
              <span className="inline-flex items-center gap-2">
                {t('profile.gameData')}
                <Badge variant="neon" size="sm">{t('dashboard.stats.allModes')}</Badge>
              </span>
            }
            description={userProfile.gamePeakRank ? `${t('profile.peakRank')} : ${userProfile.gamePeakRank}` : undefined}
            action={
              <Button variant="outline" size="sm" onClick={sync} disabled={busy === 'sync'}>
                <RefreshCw size={14} className={busy === 'sync' ? 'animate-spin' : ''} />
                {busy === 'sync' ? t('profile.syncing') : t('profile.sync')}
              </Button>
            }
            className="mb-4"
          />

          <GameSyncNotice
            sync={{
              status: userProfile.gameSyncStatus,
              lastSyncAt: userProfile.gameSyncedAt,
              tokenStatus: userProfile.mlbbTokenStatus === 'expired' ? 'expired' : 'valid',
            }}
            isOwner
            onReconnect={() => setLinkGameOpen(true)}
            className="mb-4"
          />

          {heroes.length > 0 && (
            <>
              <p className="eyebrow mb-3">{t('profile.favoriteHeroes')}</p>
              <motion.div
                variants={reduce ? still : stagger(0.04)}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              >
                {heroes.slice(0, 8).map((h, i) => (
                  <motion.div
                    key={h.heroId ?? i}
                    variants={reduce ? still : fadeUp}
                    className="flex items-center gap-3 overflow-hidden rounded border border-line-subtle bg-surface-2/60"
                    title={`${h.name} — ${h.winRate}% / ${h.matches}`}
                  >
                    {h.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mlbbImg(h.image, 96)}
                        alt={h.name}
                        referrerPolicy="no-referrer"
                        className="h-14 w-14 shrink-0 object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 shrink-0 bg-surface-3" />
                    )}
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="truncate text-sm font-semibold text-ink-1">{h.name}</p>
                      <p className="text-xs text-ink-2 num">
                        <span className={h.winRate >= 50 ? 'text-accent-green' : 'text-accent-red'}>{h.winRate}%</span> · {h.matches}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </Card>
      )}

      <LinkGameModal
        open={linkGameOpen}
        onClose={() => setLinkGameOpen(false)}
        initialGameId={userProfile.mlbbRoleId}
        initialServerId={userProfile.mlbbZoneId}
      />

      {/* Game account unlink confirmation */}
      <ConfirmModal
        open={unlinkOpen}
        onClose={() => setUnlinkOpen(false)}
        onConfirm={doUnlinkGame}
        variant="danger"
        title={t('profile.gameUnlink')}
        message={t('profile.gameUnlinkConfirm')}
        confirmLabel={t('profile.gameUnlink')}
        loading={busy === 'unlink'}
      />
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
