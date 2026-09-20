'use client';

import type { MenuGroupConfig } from '@/config/theme';
import { useT } from '@/lib/i18n';
import SidebarItem from './SidebarItem';

/** Renders declarative menu groups: section eyebrow + hairline, then items. */
export default function SidebarNav({
  groups,
  onNavigate,
}: {
  groups: MenuGroupConfig[];
  onNavigate?: () => void;
}) {
  const t = useT();
  return (
    <nav className="flex flex-col gap-5" aria-label="Navigation">
      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-0.5">
          {group.titleKey && (
            <p className="mb-1.5 flex items-center gap-2 pl-3 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
              <span>{t(group.titleKey)}</span>
              <span aria-hidden="true" className="h-px flex-1 bg-line-subtle" />
            </p>
          )}
          {group.items.map((item) => (
            <SidebarItem key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  );
}
