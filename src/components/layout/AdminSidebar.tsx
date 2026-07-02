'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Handshake, ShieldCheck } from 'lucide-react';
import { useT } from '@/lib/i18n';

const NAV = [
  { href: '/admin/esport', key: 'admin.esport.title', icon: Trophy },
  { href: '/admin/sponsors', key: 'admin.sponsors.title', icon: Handshake },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const t = useT();

  return (
    <aside className="sticky top-0 h-screen w-16 md:w-60 shrink-0 border-r border-gaming-border bg-gaming-card/60 flex flex-col p-2 md:p-3">
      <Link href="/admin/esport" className="flex items-center gap-2 px-2 py-3 mb-2">
        <ShieldCheck className="text-neon-blue shrink-0" size={22} />
        <span className="hidden md:block font-bold text-white truncate">{t('admin.area')}</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
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
