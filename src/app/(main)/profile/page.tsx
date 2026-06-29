'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gamepad2, Check, Link2, RefreshCw, ShieldCheck, Trophy, Star, Target, Flame,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { useAuthStore } from '@/store/useStore';
import { api, avatarSrc, mlbbImg } from '@/lib/api';
import LinkGameModal from '@/components/profile/LinkGameModal';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const userProfile = useAuthStore((s: any) => s.userProfile);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);
  const setUser = useAuthStore((s: any) => s.setUser);
  const [linkGameOpen, setLinkGameOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Charge Google Identity Services (pour la liaison Google).
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
      toast.error('Google se charge, réessaie dans un instant.');
      return;
    }
    const client = g.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (resp: any) => {
        if (!resp?.access_token) {
          toast.error('Liaison Google annulée.');
          return;
        }
        setBusy('google');
        try {
          const updated: any = await api.auth.linkGoogle({ accessToken: resp.access_token });
          apply(updated);
          toast.success('Compte Google lié.');
        } catch (e: any) {
          toast.error(e?.message || 'Échec de la liaison Google.');
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
      toast.success('Profil affiché mis à jour.');
    } catch (e: any) {
      toast.error(e?.message || 'Échec du changement de profil.');
    } finally {
      setBusy(null);
    }
  };

  const sync = async () => {
    setBusy('sync');
    try {
      const updated: any = await api.auth.syncGame();
      apply(updated);
      toast.success('Données de jeu synchronisées.');
    } catch (e: any) {
      toast.error(e?.message || 'Échec de la synchronisation.');
    } finally {
      setBusy(null);
    }
  };

  const stats = userProfile.gameStats || {};
  const heroes: any[] = userProfile.gameFrequentHeroes || [];
  const name = userProfile.displayName || userProfile.username;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Mon profil</h1>
      <p className="text-sm text-gray-400 mb-6">
        Gère tes comptes liés et choisis le profil affiché.
      </p>

      {/* Profil affiché */}
      <Card className="mb-6" hover={false}>
        <div className="flex items-center gap-4">
          {userProfile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc(userProfile.avatar, 160)}
              alt={name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-neon-blue/40"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-2xl font-bold text-white">
              {name?.[0]?.toUpperCase() || 'J'}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">{name}</h2>
            <p className="text-sm text-gray-400">
              Profil affiché :{' '}
              <span className="text-neon-blue font-medium">
                {userProfile.profileSource === 'google' ? 'Compte Google' : 'Compte de jeu'}
              </span>
            </p>
          </div>
        </div>
      </Card>

      {/* Choix de la source du profil */}
      <Card className="mb-6" hover={false}>
        <h3 className="font-bold text-white mb-1">Profil affiché</h3>
        <p className="text-sm text-gray-400 mb-4">
          Quelle identité utiliser pour ton avatar et ton nom ?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option jeu */}
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
              <p className="text-sm font-semibold text-white">Profil de jeu</p>
              <p className="text-xs text-gray-400 truncate">
                {userProfile.gameNickname || (userProfile.hasGame ? 'Compte de jeu' : 'Non lié')}
              </p>
            </div>
            {userProfile.profileSource === 'game' && <Check size={16} className="text-neon-blue" />}
          </button>

          {/* Option Google */}
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
              <p className="text-sm font-semibold text-white">Profil Google</p>
              <p className="text-xs text-gray-400 truncate">
                {userProfile.googleName || (userProfile.hasGoogle ? 'Compte Google' : 'Non lié')}
              </p>
            </div>
            {userProfile.profileSource === 'google' && <Check size={16} className="text-neon-blue" />}
          </button>
        </div>
      </Card>

      {/* Comptes liés */}
      <Card className="mb-6" hover={false}>
        <h3 className="font-bold text-white mb-4">Comptes liés</h3>
        <div className="space-y-3">
          {/* Google */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-gaming-border">
            <GoogleGlyph />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Google</p>
              <p className="text-xs text-gray-400 truncate">
                {userProfile.hasGoogle
                  ? userProfile.googleEmail || userProfile.googleName || 'Lié'
                  : 'Permet de te reconnecter en un clic.'}
              </p>
            </div>
            {userProfile.hasGoogle ? (
              <Badge variant="green" size="sm"><ShieldCheck size={12} className="mr-1" /> Lié</Badge>
            ) : (
              <Button variant="secondary" size="sm" onClick={linkGoogle} disabled={busy === 'google'}>
                <Link2 size={14} /> Lier
              </Button>
            )}
          </div>

          {/* Jeu */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-gaming-border">
            <Gamepad2 size={22} className="text-neon-blue shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Compte Mobile Legends</p>
              <p className="text-xs text-gray-400 truncate">
                {userProfile.hasGame
                  ? `ID ${userProfile.mlbbRoleId} · Serveur ${userProfile.mlbbZoneId}`
                  : 'Récupère tes vraies statistiques de jeu.'}
              </p>
            </div>
            {userProfile.hasGame ? (
              <Badge variant="green" size="sm"><ShieldCheck size={12} className="mr-1" /> Lié</Badge>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setLinkGameOpen(true)}>
                <Link2 size={14} /> Lier
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Données de jeu */}
      {userProfile.hasGame && (
        <Card hover={false}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">Données de jeu</h3>
              <Badge variant="neon" size="sm">Tous modes</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={sync} disabled={busy === 'sync'}>
              <RefreshCw size={14} className={busy === 'sync' ? 'animate-spin' : ''} />
              {busy === 'sync' ? 'Synchro…' : 'Synchroniser'}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <MiniStat icon={<Trophy size={14} />} label="Victoires" value={stats.wins ?? 0} color="text-green-400" />
            <MiniStat icon={<Target size={14} />} label="Winrate" value={`${stats.winRate ?? 0}%`} color="text-neon-blue" />
            <MiniStat icon={<Star size={14} />} label="MVP" value={stats.mvpCount ?? 0} color="text-amber-400" />
            <MiniStat icon={<Flame size={14} />} label="Série" value={stats.winStreak ?? 0} color="text-red-400" />
          </div>

          {heroes.length > 0 && (
            <>
              <p className="text-sm font-medium text-gray-300 mb-2">Héros favoris</p>
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
                      // eslint-disable-next-line @next/next/no-img-element
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
