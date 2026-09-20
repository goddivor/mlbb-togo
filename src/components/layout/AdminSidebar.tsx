'use client';

import { adminMenuGroups } from '@/config/menu';
import { useT } from '@/lib/i18n';
import { avatarSrc } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import { Badge } from '@/components/ui';
import SidebarRail from './sidebar/SidebarRail';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const ROLE_KEY: Record<string, string> = {
  admin: 'admin.users.role.admin',
  moderator: 'admin.users.role.moderator',
};

/** Admin rail: declarative admin menu + "Admin" tag + signed-in staff card. */
export default function AdminSidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const t = useT();
  const user = useAuthStore((s: any) => s.user);
  const name = user?.username || user?.displayName || 'Admin';
  const roleKey = ROLE_KEY[user?.roleUser] ?? ROLE_KEY.admin;

  return (
    <SidebarRail
      groups={adminMenuGroups}
      homeHref="/admin/league"
      tag={
        <Badge variant="neon" size="sm" className="shrink-0">
          {t('admin.users.role.admin')}
        </Badge>
      }
      user={{
        name,
        subtitle: t(roleKey),
        avatarUrl: user?.avatar ? avatarSrc(user.avatar) : null,
      }}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    />
  );
}
