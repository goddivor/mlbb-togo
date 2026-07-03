'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { api, setToken } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';
import { Button, Input } from '@/components/ui';

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

        <div className="rounded-2xl border border-gaming-border bg-gaming-card shadow-2xl p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold text-white">{t('adminLogin.title')}</h1>
          </div>
          <p className="text-sm text-gray-400 mb-5">{t('adminLogin.subtitle')}</p>

          <form onSubmit={submit} className="space-y-4">
            <Input
              label={t('adminLogin.username')}
              value={username}
              onChange={(e: any) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <Input
              label={t('adminLogin.password')}
              type="password"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button
              type="submit"
              variant="primary"
              loading={busy}
              disabled={!username || !password}
              className="w-full"
            >
              {busy ? t('adminLogin.loading') : t('adminLogin.submit')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
