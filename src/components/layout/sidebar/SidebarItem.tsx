'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import type { MenuItemConfig } from '@/config/theme';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import { springIndicator } from '@/lib/motion';

const AREA_ROOTS = new Set(['/dashboard', '/admin']);

/** Shared layoutId so the glow bar slides between items of the same rail. */
const ACTIVE_BAR_ID = 'sidebar-active-bar';

export default function SidebarItem({
  item,
  onNavigate,
}: {
  item: MenuItemConfig;
  /** Called after a click (closes the mobile drawer). */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useT();
  const reduce = useReducedMotion();
  const Icon = item.icon;
  // Area roots (the dashboard home) only match themselves: every member page
  // lives under /dashboard/*, so a prefix match would keep them highlighted.
  const isAreaRoot = AREA_ROOTS.has(item.href);
  const active =
    pathname === item.href || (!isAreaRoot && pathname.startsWith(`${item.href}/`));
  const label = t(item.labelKey);

  return (
    <Link
      href={item.href}
      title={label}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex h-9 items-center gap-2.5 rounded-md pl-3 pr-2.5 text-[13px] font-medium transition-[color,background-color] duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        active ? 'rail-active text-ink-1' : 'text-ink-2 hover:bg-surface-2/60 hover:text-ink-1'
      )}
    >
      {active && (
        <motion.span
          layoutId={reduce ? undefined : ACTIVE_BAR_ID}
          transition={springIndicator}
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-glow-cyan"
        />
      )}
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors duration-fast',
          active ? 'text-primary' : 'text-ink-3 group-hover:text-ink-1'
        )}
      >
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {item.descKey && <span className="truncate text-[11px] text-ink-3">{t(item.descKey)}</span>}
    </Link>
  );
}
