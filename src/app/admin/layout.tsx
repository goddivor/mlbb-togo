'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/layout/AdminShell';
import { api, getToken, setToken } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import { RealtimeProvider } from '@/lib/realtime';

const ADMIN_ROLES = ['admin', 'moderator'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const setUser = useAuthStore((s: any) => s.setUser);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/admin-login');
      return;
    }
    api.auth
      .me()
      .then((user: any) => {
        if (!user || !ADMIN_ROLES.includes(user.roleUser)) {
          setToken(null);
          router.replace('/admin-login');
          return;
        }
        setUser(user);
        setUserProfile(user);
        setChecked(true);
      })
      .catch(() => {
        setToken(null);
        router.replace('/admin-login');
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
      <AdminShell>{children}</AdminShell>
    </RealtimeProvider>
  );
}
