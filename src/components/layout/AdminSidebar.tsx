'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeftRight } from 'lucide-react';
import { adminMenuGroups, filterMenuByPermission } from '@/config/menu';
import { useT } from '@/lib/i18n';
import { avatarSrc } from '@/lib/api';
import { firstAllowedAdminHref, permissionsOf } from '@/lib/permissions';
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

/**
 * Admin rail: declarative admin menu filtered by the user's RBAC permissions,
 * a "player area" shortcut and the signed-in staff card.
 */
export default function AdminSidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const t = useT();
  const user = useAuthStore((s: any) => s.user);
  const name = user?.username || user?.displayName || 'Admin';
  const roleKey = ROLE_KEY[user?.roleUser] ?? ROLE_KEY.admin;
  const perms = permissionsOf(user);
  const groups = useMemo(() => filterMenuByPermission(adminMenuGroups, perms), [perms]);

  return (
    <SidebarRail
      groups={groups}
      homeHref={firstAllowedAdminHref(user) ?? '/admin'}
      tag={
        <Badge variant="neon" size="sm" className="shrink-0">
          {t('admin.users.role.admin')}
        </Badge>
      }
      footer={
        <Link
          href="/dashboard"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-2.5 rounded-md border border-line-subtle px-3 py-2 text-[13px] font-medium text-ink-2 transition-colors duration-fast hover:border-primary/50 hover:bg-primary/5 hover:text-ink-1"
        >
          <ArrowLeftRight size={15} className="text-primary" />
          {t('admin.rbac.playerArea')}
        </Link>
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
