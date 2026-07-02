'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { api, setToken } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';

export default function AdminLoginPage() {
  const t = useT();
  const router = useRouter();
  const setUser = useAuthStore((s: any) => s.setUser);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setBusy(true);
    setError('');
    try {
      const res: any = await api.auth.adminLogin({ username, password });
      setToken(res.token);
      setUser(res.user);
      setUserProfile(res.user);
      router.replace('/admin/esport');
    } catch (err: any) {
      setError(err?.message || t('adminLogin.error'));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gaming-dark px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft size={16} /> {t('adminLogin.back')}
        </Link>

        <div className="rounded-2xl border border-gaming-border bg-gaming-surface/40 p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/15 flex items-center justify-center">
              <ShieldCheck className="text-neon-blue" size={20} />
            </div>
            <h1 className="text-xl font-bold text-white">{t('adminLogin.title')}</h1>
          </div>
          <p className="text-sm text-gray-400 mb-5">{t('adminLogin.subtitle')}</p>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('adminLogin.username')}</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 focus:outline-none focus:border-neon-blue"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('adminLogin.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 focus:outline-none focus:border-neon-blue"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={busy || !username || !password}
              className="w-full py-2.5 rounded-lg bg-neon-blue text-gaming-dark font-semibold text-sm hover:bg-neon-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? t('adminLogin.loading') : t('adminLogin.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
