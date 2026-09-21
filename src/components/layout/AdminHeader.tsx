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
  KeyRound,
  Flag,
  Plug,
  Images,
} from 'lucide-react';
import { disconnectSocket } from '@/lib/realtime';
import { useT } from '@/lib/i18n';
import { setToken, avatarSrc } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import { can, firstAllowedAdminHref, permissionForAdminPath } from '@/lib/permissions';
import AppHeader from './AppHeader';
import { type QuickLink } from './HeaderSearch';

const ADMIN_LINKS: QuickLink[] = [
  { href: '/admin/league', key: 'admin.league.title', icon: Flag },
  { href: '/admin/catalog', key: 'admin.catalog.title', icon: LayoutGrid },
  { href: '/admin/esport', key: 'admin.esport.title', icon: Shield },
  { href: '/admin/seasons', key: 'admin.seasons.title', icon: CalendarDays },
  { href: '/admin/matches', key: 'admin.matches.title', icon: Swords },
  { href: '/admin/stream', key: 'admin.stream.title', icon: Radio },
  { href: '/admin/users', key: 'admin.users.title', icon: Users },
  { href: '/admin/requests', key: 'requests.title', icon: Inbox },
  { href: '/admin/messages', key: 'header.messages', icon: MessageSquare },
  { href: '/admin/sponsors', key: 'admin.sponsors.title', icon: Handshake },
  { href: '/admin/roles', key: 'admin.roles.title', icon: KeyRound },
  { href: '/admin/integrations', key: 'admin.integrations.title', icon: Plug },
  { href: '/admin/media', key: 'admin.media.title', icon: Images },
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
  // Quick links limited to the admin areas the user may open.
  const links = ADMIN_LINKS.filter((l) => {
    const perm = permissionForAdminPath(l.href);
    return !perm || can(user, perm);
  });

  return (
    <AppHeader
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      homeHref={firstAllowedAdminHref(user) ?? '/admin'}
      searchLinks={links}
      messagesHref="/admin/messages"
      profile={{
        name,
        subtitle: t('admin.area'),
        avatarUrl,
        logoutLabel: t('header.logout'),
        onLogout: signOut,
        links: [
          { href: '/dashboard', label: t('admin.rbac.playerArea'), icon: 'profile' },
          { href: '/', label: t('admin.backToSite'), icon: 'external' },
        ],
      }}
    />
  );
}
