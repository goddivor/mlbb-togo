'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { MenuGroupConfig } from '@/config/theme';
import { cn } from '@/lib/helpers';
import { Avatar } from '@/components/ui';
import SidebarNav from './SidebarNav';

export interface RailUser {
  name: string;
  /** Role or area shown under the name. */
  subtitle?: string;
  avatarUrl?: string | null;
  /** Where the user card links to (profile page); omit for a static card. */
  href?: string;
}

interface SidebarRailProps {
  groups: MenuGroupConfig[];
  /** Brand link target. */
  homeHref: string;
  /** Small label next to the wordmark (e.g. "Admin"). */
  tag?: ReactNode;
  user?: RailUser | null;
  /** Extra footer content (season pill on phones, etc.). */
  footer?: ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

/**
 * Always-dark navigation rail shared by the player and admin shells:
 * brand block, grouped menu with section eyebrows and a sliding glow bar,
 * and a user card pinned at the bottom. On phones it is an off-canvas drawer
 * driven by `sidebarOpen`.
 */
export default function SidebarRail({
  groups,
  homeHref,
  tag,
  user,
  footer,
  sidebarOpen,
  setSidebarOpen,
}: SidebarRailProps) {
  const close = () => setSidebarOpen(false);

  const userCard = user && (
    <div className="flex items-center gap-3 rounded-md border border-line-subtle bg-surface-1/70 p-2.5">
      <Avatar name={user.name} src={user.avatarUrl ?? undefined} size="sm" ring />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink-1">{user.name}</p>
        {user.subtitle && <p className="truncate text-[11px] text-ink-3">{user.subtitle}</p>}
      </div>
    </div>
  );

  return (
    <aside
      className={cn(
        'sidebar-rail absolute left-0 top-0 z-9999 flex h-screen w-64 flex-col overflow-y-hidden transition-transform duration-slow ease-out lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-4">
        <Link href={homeHref} onClick={close} className="flex min-w-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mlbbtogo-icon.png" alt="" aria-hidden="true" className="h-8 w-8 shrink-0 rounded-md object-contain" />
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-display text-[15px] font-bold uppercase tracking-tight2 text-ink-1">
              MLBB Togo
            </span>
            {tag}
          </span>
        </Link>
        <button
          type="button"
          onClick={close}
          aria-label="Fermer le menu"
          className="header-btn h-8 w-8 lg:hidden"
        >
          <X size={16} />
        </button>
      </div>

      {/* Menu */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4 pt-2">
        <SidebarNav groups={groups} onNavigate={close} />
      </div>

      {/* User card */}
      {(userCard || footer) && (
        <div className="shrink-0 space-y-2 border-t border-line-subtle p-3">
          {footer}
          {user?.href ? (
            <Link href={user.href} onClick={close} className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              {userCard}
            </Link>
          ) : (
            userCard
          )}
        </div>
      )}
    </aside>
  );
}
