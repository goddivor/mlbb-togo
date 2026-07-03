'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gamepad2, Check, Link2, Unlink, RefreshCw, ShieldCheck, Trophy, Star, Target, Flame, User,
} from 'lucide-react';
import { Card, Badge, Button, PageHeader, Avatar } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useAuthStore } from '@/store/useStore';
import { api, avatarSrc, mlbbImg } from '@/lib/api';
import LinkGameModal from '@/components/profile/LinkGameModal';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

export default function ProfilePage() {
  const userProfile = useAuthStore((s: any) => s.userProfile);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);
  const setUser = useAuthStore((s: any) => s.setUser);
  const [linkGameOpen, setLinkGameOpen] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const t = useT();

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
      <div className="p-6 max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
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
      toast.success(t('profile.syncSuccess'));
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

  const stats = userProfile.gameStats || {};
  const heroes: any[] = userProfile.gameFrequentHeroes || [];
  const name = userProfile.displayName || userProfile.username;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">

      <PageHeader
        icon={<User size={28} />}
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        variant="purple"
      />

      {/* En-tête d'identité */}
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={name} src={userProfile.avatar ? avatarSrc(userProfile.avatar, 160) : undefined} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-white">{name}</h2>
            <p className="text-sm text-gray-400">
              {t('profile.displayedProfile')}{' '}
              <span className="text-neon-blue font-medium">
                {userProfile.profileSource === 'google' ? t('profile.googleProfile') : t('profile.gameProfile')}
              </span>
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-white mb-1">{t('profile.shownProfile')}</h3>
        <p className="text-sm text-gray-400 mb-4">
          {t('profile.subtitle')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => chooseSource('game')}
            disabled={!userProfile.hasGame || busy === 'source-game'}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              userProfile.profileSource === 'game'
                ? 'border-neon-blue bg-neon-blue/10'
                : 'border-gaming-border hover:bg-gaming-surface'
            }`}
          >
            <Gamepad2 size={20} className="text-neon-blue shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{t('profile.gameProfile')}</p>
              <p className="text-xs text-gray-400 truncate">
                {userProfile.gameNickname || (userProfile.hasGame ? `${t('dashboard.gameId')} ${userProfile.mlbbRoleId} · ${t('dashboard.gameServer')} ${userProfile.mlbbZoneId}` : t('profile.profileSource.nonLinked'))}
              </p>
            </div>
            {userProfile.profileSource === 'game' && <Check size={16} className="text-neon-blue" />}
          </button>

          <button
            onClick={() => chooseSource('google')}
            disabled={!userProfile.hasGoogle || busy === 'source-google'}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              userProfile.profileSource === 'google'
                ? 'border-neon-blue bg-neon-blue/10'
                : 'border-gaming-border hover:bg-gaming-surface'
            }`}
          >
            <GoogleGlyph />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{t('profile.googleProfile')}</p>
              <p className="text-xs text-gray-400 truncate">
                {userProfile.googleName || (userProfile.hasGoogle ? userProfile.googleEmail || t('profile.googleLinked') : t('profile.googleDescUnlinked'))}
              </p>
            </div>
            {userProfile.profileSource === 'google' && <Check size={16} className="text-neon-blue" />}
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-white mb-4">{t('profile.linkedAccounts')}</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-gaming-border">
            <GoogleGlyph />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{t('profile.google')}</p>
              <p className="text-xs text-gray-400 truncate">
                {userProfile.hasGoogle
                  ? userProfile.googleEmail || userProfile.googleName || t('profile.googleLinked')
                  : t('profile.googleDescUnlinked')}
              </p>
            </div>
            {userProfile.hasGoogle ? (
              <Badge variant="green" size="sm"><ShieldCheck size={12} className="mr-1" /> {t('profile.googleLinked')}</Badge>
            ) : (
              <Button variant="secondary" size="sm" onClick={linkGoogle} disabled={busy === 'google'}>
                <Link2 size={14} /> {t('profile.googleLink')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl border border-gaming-border">
            <Gamepad2 size={22} className="text-neon-blue shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{t('profile.gameAccount')}</p>
              <p className="text-xs text-gray-400 truncate">
                {userProfile.hasGame
                  ? `${t('dashboard.gameId')} ${userProfile.mlbbRoleId} · ${t('dashboard.gameServer')} ${userProfile.mlbbZoneId}`
                  : t('profile.gameDescUnlinked')}
              </p>
            </div>
            {userProfile.hasGame ? (
              <div className="flex items-center gap-2">
                <Badge variant="green" size="sm"><ShieldCheck size={12} className="mr-1" /> {t('profile.gameLinked')}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUnlinkOpen(true)}
                  disabled={busy === 'unlink' || !userProfile.hasGoogle}
                  title={!userProfile.hasGoogle ? t('profile.gameUnlinkNeedsGoogle') : undefined}
                >
                  <Unlink size={14} /> {t('profile.gameUnlink')}
                </Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setLinkGameOpen(true)}>
                <Link2 size={14} /> {t('profile.gameLink')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {userProfile.hasGame && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">{t('profile.gameData')}</h3>
              <Badge variant="neon" size="sm">{t('dashboard.stats.allModes')}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={sync} disabled={busy === 'sync'}>
              <RefreshCw size={14} className={busy === 'sync' ? 'animate-spin' : ''} />
              {busy === 'sync' ? t('profile.syncing') : t('profile.sync')}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <MiniStat icon={<Trophy size={14} />} label={t('profile.wins')} value={stats.wins ?? 0} color="text-green-400" />
            <MiniStat icon={<Target size={14} />} label={t('profile.winrate')} value={`${stats.winRate ?? 0}%`} color="text-neon-blue" />
            <MiniStat icon={<Star size={14} />} label={t('profile.mvp')} value={stats.mvpCount ?? 0} color="text-amber-400" />
            <MiniStat icon={<Flame size={14} />} label={t('profile.streak')} value={stats.winStreak ?? 0} color="text-red-400" />
          </div>

          {heroes.length > 0 && (
            <>
              <p className="text-sm font-medium text-gray-300 mb-2">{t('profile.favoriteHeroes')}</p>
              <div className="flex flex-wrap gap-2">
                {heroes.slice(0, 8).map((h, i) => (
                  <motion.div
                    key={h.heroId ?? i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-2 rounded-lg border border-gaming-border bg-gaming-surface/30 pr-3"
                    title={`${h.name} — ${h.winRate}% sur ${h.matches} parties`}
                  >
                    {h.image && (
                      <img
                        src={mlbbImg(h.image, 64)}
                        alt={h.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-l-lg object-cover bg-gaming-dark"
                      />
                    )}
                    <span className="text-xs text-gray-200">{h.name}</span>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      <LinkGameModal open={linkGameOpen} onClose={() => setLinkGameOpen(false)} />

      {/* Confirmation de dissociation du compte de jeu */}
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

function MiniStat({ icon, label, value, color }: any) {
  return (
    <div className="rounded-lg border border-gaming-border bg-gaming-surface/30 p-3 text-center">
      <div className={`flex items-center justify-center gap-1 ${color} mb-1`}>
        {icon} <span className="text-lg font-bold">{value}</span>
      </div>
      <p className="text-xs text-gray-400">{label}</p>
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
