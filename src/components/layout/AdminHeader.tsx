'use client';

import { useRouter } from 'next/navigation';
import {
  Shield,
  CalendarDays,
  Swords,
  Radio,
  Users,
  Inbox,
  MessageSquare,
  Handshake,
  LayoutGrid,
} from 'lucide-react';
import { disconnectSocket } from '@/lib/realtime';
import { useT } from '@/lib/i18n';
import { setToken, avatarSrc } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import AppHeader from './AppHeader';
import { type QuickLink } from './HeaderSearch';

const ADMIN_LINKS: QuickLink[] = [
  { href: '/admin/catalog', key: 'admin.catalog.title', icon: LayoutGrid },
  { href: '/admin/esport', key: 'admin.esport.title', icon: Shield },
  { href: '/admin/seasons', key: 'admin.seasons.title', icon: CalendarDays },
  { href: '/admin/matches', key: 'admin.matches.title', icon: Swords },
  { href: '/admin/stream', key: 'admin.stream.title', icon: Radio },
  { href: '/admin/users', key: 'admin.users.title', icon: Users },
  { href: '/admin/requests', key: 'requests.title', icon: Inbox },
  { href: '/admin/messages', key: 'header.messages', icon: MessageSquare },
  { href: '/admin/sponsors', key: 'admin.sponsors.title', icon: Handshake },
];

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

/** Admin top bar. */
export default function AdminHeader({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const t = useT();
  const router = useRouter();
  const user = useAuthStore((s: any) => s.user);
  const storeLogout = useAuthStore((s: any) => s.logout);

  // Same logout logic as before: drop the socket + token, clear the auth
  // store, then bounce back to the admin login.
  const signOut = () => {
    disconnectSocket();
    setToken(null);
    storeLogout?.();
    router.replace('/admin-login');
  };

  const name = user?.username || user?.displayName || 'Admin';
  const avatarUrl = user?.avatar ? avatarSrc(user.avatar) : null;

  return (
    <AppHeader
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      homeHref="/admin/esport"
      searchLinks={ADMIN_LINKS}
      messagesHref="/admin/messages"
      profile={{
        name,
        subtitle: t('admin.area'),
        avatarUrl,
        logoutLabel: t('header.logout'),
        onLogout: signOut,
        links: [{ href: '/', label: t('admin.backToSite'), icon: 'external' }],
      }}
    />
  );
}
