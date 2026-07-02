'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Swords, Users, Shield } from 'lucide-react';
import { useT } from '@/lib/i18n';

const NAV = [
  { href: '/dashboard', key: 'header.dashboard', icon: LayoutDashboard },
  { href: '/heroes', key: 'header.heroes', icon: Swords },
  { href: '/players', key: 'header.players', icon: Users },
  { href: '/teams', key: 'header.teams', icon: Shield },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const t = useT();
  const nav = NAV;

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-16 md:w-56 shrink-0 border-r border-gaming-border bg-gaming-card/40 p-2 md:p-3">
      <nav className="flex flex-col gap-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={t(item.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'text-neon-blue bg-neon-blue/10'
                  : 'text-gray-300 hover:text-white hover:bg-gaming-surface'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="hidden md:inline">{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
