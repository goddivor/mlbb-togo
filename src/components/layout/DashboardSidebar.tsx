'use client';

import { playerMenuGroups } from '@/config/menu';
import { useT } from '@/lib/i18n';
import { avatarSrc } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import SeasonSwitcher from '@/components/seasons/SeasonSwitcher';
import SidebarRail from './sidebar/SidebarRail';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

/** Player rail: declarative player menu + season pill (phones) + profile card. */
export default function DashboardSidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const t = useT();
  const userProfile = useAuthStore((s: any) => s.userProfile);
  const name = userProfile?.displayName || userProfile?.username || 'Joueur';

  return (
    <SidebarRail
      groups={playerMenuGroups}
      homeHref="/dashboard"
      user={{
        name,
        subtitle: userProfile?.gameNickname || (userProfile?.username ? `@${userProfile.username}` : t('header.menu.profile')),
        avatarUrl: userProfile?.avatar ? avatarSrc(userProfile.avatar) : null,
        href: '/profile',
      }}
      // The header hides the season pill on phones: offer it in the drawer instead.
      footer={
        <div className="sm:hidden">
          <SeasonSwitcher variant="header" className="w-full" />
        </div>
      }
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    />
  );
}
