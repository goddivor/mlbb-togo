'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { api, setToken } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

export default function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const [mode, setMode] = useState<'choice' | 'vc'>('choice');
  const [form, setForm] = useState({ gameId: '', serverId: '', code: '' });
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!open) {
      setMode('choice');
      setForm({ gameId: '', serverId: '', code: '' });
      setCooldown(0);
    }
  }, [open]);

  useEffect(() => {
    if (document.getElementById('gis-script')) return;
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.id = 'gis-script';
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handle = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value.replace(/[^0-9]/g, '') }));

  const sendCode = async () => {
    if (!form.gameId || !form.serverId) {
      toast.error(t('signin.fillIds'));
      return;
    }
    setSending(true);
    try {
      await api.auth.mlbbSendVc({ roleId: Number(form.gameId), zoneId: Number(form.serverId) });
      toast.success(t('signin.codeSent'));
      setCooldown(60);
    } catch (err: any) {
      toast.error(err?.message || "Échec de l'envoi du code.");
    } finally {
      setSending(false);
    }
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gameId || !form.serverId || !form.code) {
      toast.error(t('signin.fillAll'));
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.auth.mlbbLogin({
        roleId: Number(form.gameId),
        zoneId: Number(form.serverId),
        vc: Number(form.code),
      });
      setToken(res.token);
      useAuthStore.getState().setUser(res.user);
      useAuthStore.getState().setUserProfile(res.user);
      toast.success(t('signin.success'));
      onClose();
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const g = (window as any).google;
    if (!clientId || !g?.accounts?.oauth2) {
      toast.error('Google se charge, réessayez dans un instant.');
      return;
    }
    const client = g.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (resp: any) => {
        if (!resp?.access_token) {
          toast.error('Connexion Google annulée.');
          return;
        }
        setLoading(true);
        try {
          const res: any = await api.auth.google({ accessToken: resp.access_token });
          setToken(res.token);
          useAuthStore.getState().setUser(res.user);
          useAuthStore.getState().setUserProfile(res.user);
          toast.success(t('signin.success'));
          onClose();
          router.push('/dashboard');
        } catch (err: any) {
          toast.error(err?.message || 'Échec de la connexion Google.');
        } finally {
          setLoading(false);
        }
      },
    });
    client.requestAccessToken();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-[#1e3f66] bg-gradient-to-b from-[#0c2038] to-[#0a1626] p-7 sm:p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute top-4 right-4 text-[#6f9fd6] hover:text-white transition-colors"
            >
              <X size={22} />
            </button>

            <h2 className="text-center text-2xl font-bold tracking-wide text-[#7fb3ff] mb-7">
              {t('signin.title')}
            </h2>

            {mode === 'choice' ? (
              <div className="space-y-4">
                <button
                  onClick={() => setMode('vc')}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-lg text-white font-semibold border border-white/15 transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(180deg, #2f7ad1 0%, #1f5aa8 100%)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/mlbb-game-icon.png" alt="MLBB" className="w-7 h-7 rounded" /> {t('signin.withCode')}
                </button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#1e3f66]" /></div>
                  <div className="relative flex justify-center"><span className="px-3 text-xs text-[#6f9fd6] bg-[#0b1c30]">{t('signin.or')}</span></div>
                </div>

                <button
                  onClick={googleLogin}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-lg font-semibold bg-white text-gray-800 hover:bg-gray-100 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  {t('signin.google')}
                </button>
              </div>
            ) : (
              <form onSubmit={signIn} className="space-y-4">
                <button type="button" onClick={() => setMode('choice')} className="flex items-center gap-1 text-sm text-[#6f9fd6] hover:text-white transition-colors">
                  <ArrowLeft size={16} /> {t('signin.back')}
                </button>

                <input
                  className="w-full px-4 py-3 rounded-lg bg-[#0a1a2e] border border-[#1e3f66] text-white placeholder-[#5a7ba6] focus:outline-none focus:border-[#3f7ad1]"
                  placeholder={t('signin.gameId')}
                  inputMode="numeric"
                  value={form.gameId}
                  onChange={handle('gameId')}
                />
                <input
                  className="w-full px-4 py-3 rounded-lg bg-[#0a1a2e] border border-[#1e3f66] text-white placeholder-[#5a7ba6] focus:outline-none focus:border-[#3f7ad1]"
                  placeholder={t('signin.serverId')}
                  inputMode="numeric"
                  value={form.serverId}
                  onChange={handle('serverId')}
                />
                <div className="flex gap-0">
                  <input
                    className="flex-1 px-4 py-3 rounded-l-lg bg-[#0a1a2e] border border-[#1e3f66] border-r-0 text-white placeholder-[#5a7ba6] focus:outline-none focus:border-[#3f7ad1]"
                    placeholder={t('signin.code')}
                    inputMode="numeric"
                    value={form.code}
                    onChange={handle('code')}
                  />
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={sending || cooldown > 0}
                    className="px-4 rounded-r-lg text-white text-sm font-medium border border-[#1e3f66] disabled:opacity-60 transition-all"
                    style={{ background: 'linear-gradient(180deg, #2f7ad1 0%, #1f5aa8 100%)' }}
                  >
                    {cooldown > 0 ? `${cooldown}s` : sending ? '…' : t('signin.getCode')}
                  </button>
                </div>
                <p className="text-xs text-[#6f9fd6] text-center">{t('signin.hint')}</p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-white font-bold border border-yellow-700/40 transition-all hover:brightness-110 disabled:opacity-70"
                  style={{ background: 'linear-gradient(180deg, #f0b32a 0%, #d4901a 100%)' }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {t('signin.signin')} <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
