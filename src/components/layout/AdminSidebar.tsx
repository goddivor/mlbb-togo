'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { adminMenuGroups } from '@/config/menu';
import { useT } from '@/lib/i18n';
import SidebarNav from './sidebar/SidebarNav';

export default function AdminSidebar() {
  const t = useT();

  return (
    <aside className="sticky top-0 h-screen w-16 md:w-60 shrink-0 border-r border-gaming-border bg-gaming-darker/70 flex flex-col p-2 md:p-3 overflow-y-auto">
      <Link href="/admin/esport" className="flex items-center gap-2 px-2 py-3 mb-3">
        <span className="shrink-0 flex items-center justify-center rounded-lg bg-neon-blue/15 p-2">
          <ShieldCheck className="text-neon-blue" size={20} />
        </span>
        <span className="hidden md:block font-bold text-white truncate">{t('admin.area')}</span>
      </Link>

      <SidebarNav groups={adminMenuGroups} />
    </aside>
  );
}
