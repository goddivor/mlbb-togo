'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AdminShell from '@/components/layout/AdminShell';
import { api, getToken, setToken } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import { RealtimeProvider } from '@/lib/realtime';
import { useT } from '@/lib/i18n';
import {
  can,
  firstAllowedAdminHref,
  hasAdminAccess,
  permissionForAdminPath,
} from '@/lib/permissions';

/**
 * Admin guard (RBAC). Entry requires any `admin.*` permission; each admin page
 * additionally requires its own area permission (`/admin/users` ->
 * `admin.users`). Permissions are re-read on every navigation so a revoked
 * role closes the door right away (the API enforces it on its side too).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const [checked, setChecked] = useState(false);
  const user = useAuthStore((s: any) => s.user);
  const setUser = useAuthStore((s: any) => s.setUser);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);

  // Session check (first load) + permission refresh on every navigation.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/admin-login');
      return;
    }
    api.auth
      .me(true)
      .then((me: any) => {
        if (!me || !hasAdminAccess(me)) {
          if (me) {
            // Signed-in player without (or no longer with) admin rights.
            toast.error(t('admin.rbac.noAccess'));
            setUser(me);
            setUserProfile(me);
            router.replace('/dashboard');
          } else {
            setToken(null);
            router.replace('/admin-login');
          }
          return;
        }
        setUser(me);
        setUserProfile(me);
        setChecked(true);
      })
      .catch(() => {
        setToken(null);
        router.replace('/admin-login');
      });
  }, [pathname, router, setUser, setUserProfile, t]);

  // Page gating: redirect to the first allowed section when forbidden.
  const required = permissionForAdminPath(pathname);
  const allowed = !required || can(user, required);
  const fallback = firstAllowedAdminHref(user);

  useEffect(() => {
    if (!checked || !user) return;
    if (pathname === '/admin') {
      if (fallback) router.replace(fallback);
      return;
    }
    if (!allowed) {
      toast.error(t('admin.rbac.forbiddenPage'), { id: 'admin-forbidden' });
      router.replace(fallback ?? '/dashboard');
    }
  }, [checked, user, pathname, allowed, fallback, router, t]);

  if (!checked || !allowed || pathname === '/admin') {
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
