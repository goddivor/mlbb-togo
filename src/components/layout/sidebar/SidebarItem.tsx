'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MenuItemConfig } from '@/config/theme';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';

export default function SidebarItem({ item }: { item: MenuItemConfig }) {
  const pathname = usePathname();
  const t = useT();
  const Icon = item.icon;
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const label = t(item.labelKey);

  return (
    <Link
      href={item.href}
      title={label}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-2 md:px-3 py-2.5 text-sm font-medium transition-all duration-200',
        active ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-neon-blue" />
      )}
      <span
        className={cn(
          'shrink-0 flex items-center justify-center rounded-md p-1.5 transition-colors',
          active
            ? 'bg-neon-blue/20 text-neon-blue'
            : 'bg-white/5 text-gray-400 group-hover:text-white'
        )}
      >
        <Icon size={18} />
      </span>
      <span className="hidden md:block flex-1 min-w-0 truncate">{label}</span>
      {item.descKey && (
        <span className="hidden md:block text-xs text-gray-500 truncate">{t(item.descKey)}</span>
      )}
    </Link>
  );
}
