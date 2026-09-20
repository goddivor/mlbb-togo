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
    <div className="app-surface flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink-1"
        >
          <ArrowLeft size={16} /> {t('adminLogin.back')}
        </Link>

        <div className="cut-corners relative overflow-hidden border border-line-subtle bg-surface-1 p-7 shadow-elev-3 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1">
          <div aria-hidden="true" className="absolute -right-12 -top-12 h-32 w-32 rotate-45 bg-primary/10" />
          <div className="mb-5 flex h-11 w-11 items-center justify-center cut-corners-sm bg-primary/10 text-primary">
            <ShieldCheck size={22} />
          </div>
          <p className="eyebrow mb-2">{t('adminLogin.eyebrow')}</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight2 text-ink-1">{t('adminLogin.title')}</h1>
          <p className="mb-6 mt-1.5 text-sm text-ink-2">{t('adminLogin.subtitle')}</p>

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

            {error && <p className="text-sm text-accent-red">{error}</p>}

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
