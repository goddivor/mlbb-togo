'use client';

import type { MenuGroupConfig } from '@/config/theme';
import { useT } from '@/lib/i18n';
import SidebarItem from './SidebarItem';

/** Rend une liste de groupes de menu déclaratifs (titre de section + items). */
export default function SidebarNav({ groups }: { groups: MenuGroupConfig[] }) {
  const t = useT();
  return (
    <nav className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-1">
          {group.titleKey && (
            <p className="hidden md:block px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t(group.titleKey)}
            </p>
          )}
          {group.items.map((item) => (
            <SidebarItem key={item.href} item={item} />
          ))}
        </div>
      ))}
    </nav>
  );
}
