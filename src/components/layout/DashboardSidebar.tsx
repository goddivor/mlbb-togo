'use client';

import { playerMenuGroups } from '@/config/menu';
import SidebarNav from './sidebar/SidebarNav';

export default function DashboardSidebar() {
  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-16 md:w-56 shrink-0 border-r border-gaming-border bg-gaming-darker/60 p-2 md:p-3 overflow-y-auto">
      <SidebarNav groups={playerMenuGroups} />
    </aside>
  );
}
