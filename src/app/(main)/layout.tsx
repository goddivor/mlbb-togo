'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';
import { api, getToken, setToken } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import { RealtimeProvider } from '@/lib/realtime';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const setUser = useAuthStore((s: any) => s.setUser);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    api.auth
      .me()
      .then((user: any) => {
        setUser(user);
        setUserProfile(user);
        setChecked(true);
      })
      .catch(() => {

        setToken(null);
        router.replace('/');
      });
  }, [router, setUser, setUserProfile]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gaming-dark">
        <div className="w-10 h-10 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <RealtimeProvider>
      <DashboardShell>{children}</DashboardShell>
    </RealtimeProvider>
  );
}
