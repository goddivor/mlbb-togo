'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useLangStore } from '@/store/useStore';
import { setToken, avatarSrc } from '@/lib/api';
import SeasonSwitcher from '@/components/seasons/SeasonSwitcher';
import { disconnectSocket } from '@/lib/realtime';
import { useT } from '@/lib/i18n';
import { hasAdminAccess } from '@/lib/permissions';
import AppHeader from './AppHeader';
import type { ProfileMenuLink } from './ProfileDropdown';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

/** Player top bar (adds the global season pill). */
export default function DashboardHeader({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const router = useRouter();
  const userProfile = useAuthStore((s: any) => s.userProfile);
  const lang = useLangStore((s: any) => s.lang);
  const setLang = useLangStore((s: any) => s.setLang);
  const t = useT();

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('mlbb-lang') : null;
    if (saved && saved !== lang) setLang(saved);
  }, [lang, setLang]);

  // Same logout logic as before: drop the socket + token, clear the auth
  // store, then bounce back to the public landing.
  const logout = () => {
    disconnectSocket();
    setToken(null);
    useAuthStore.getState().logout();
    router.replace('/');
  };

  const name = userProfile?.displayName || userProfile?.username || 'Joueur';
  const avatarUrl = userProfile?.avatar ? avatarSrc(userProfile.avatar) : null;

  return (
    <AppHeader
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      homeHref="/dashboard"
      messagesHref="/dashboard/messages"
      // Global season selector (pages filter on it); the drawer carries it on phones.
      extra={
        <li className="hidden sm:block">
          <SeasonSwitcher />
        </li>
      }
      profile={{
        name,
        avatarUrl,
        logoutLabel: t('header.logout'),
        onLogout: logout,
        links: [
          { href: '/dashboard/profile', label: t('header.menu.profile'), icon: 'profile' },
          { href: '/dashboard/settings', label: t('header.menu.settings'), icon: 'settings' },
          // Staff shortcut: any admin area permission opens the admin interface.
          ...(hasAdminAccess(userProfile)
            ? [{ href: '/admin', label: t('admin.rbac.menuEntry'), icon: 'admin' } as ProfileMenuLink]
            : []),
        ],
      }}
    />
  );
}
