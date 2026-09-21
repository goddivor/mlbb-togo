'use client';

import { useEffect, useState } from 'react';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';
import BackToTop from './BackToTop';
import DashboardShell from '@/components/layout/DashboardShell';
import { RealtimeProvider } from '@/lib/realtime';
import { api, getToken, setToken } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';

type Mode = 'public' | 'checking' | 'dashboard';

/**
 * Shell shared by the standalone public pages (league, awards, hall of fame,
 * seasons, sponsors, about, contact). Visitors get the landing header/footer;
 * signed-in members get the same page inside the dashboard shell, so opening
 * it from the sidebar never leaves the dashboard.
 */
export default function PublicShell({ children }: { children: React.ReactNode }) {
  // Always start as "public" so the server render (visitors, SEO) and the
  // first client render match; the session is resolved right after mount.
  const [mode, setMode] = useState<Mode>('public');
  const setUser = useAuthStore((s: any) => s.setUser);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);

  useEffect(() => {
    if (!getToken()) return;
    if (useAuthStore.getState().user) {
      setMode('dashboard');
      return;
    }
    setMode('checking');
    let cancelled = false;
    api.auth
      .me()
      .then((user: any) => {
        if (cancelled) return;
        setUser(user);
        setUserProfile(user);
        setMode('dashboard');
      })
      .catch(() => {
        if (cancelled) return;
        setToken(null);
        setMode('public');
      });
    return () => {
      cancelled = true;
    };
  }, [setUser, setUserProfile]);

  if (mode === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (mode === 'dashboard') {
    return (
      <RealtimeProvider>
        <DashboardShell>{children}</DashboardShell>
      </RealtimeProvider>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-surface-0">
      <LandingHeader />
      <main className="relative z-10 flex-1 pt-24 sm:pt-28">{children}</main>
      <LandingFooter />
      <BackToTop />
    </div>
  );
}
