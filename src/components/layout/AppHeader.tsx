'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import DarkModeToggle from './DarkModeToggle';
import ThemeSwitcher from './ThemeSwitcher';
import HeaderSearch, { type QuickLink } from './HeaderSearch';
import NotificationDropdown from './NotificationDropdown';
import MessageDropdown from './MessageDropdown';
import ProfileDropdown, { type ProfileMenuLink } from './ProfileDropdown';

interface AppHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  /** Brand link on phones (the rail is hidden there). */
  homeHref: string;
  /** Quick-navigation entries of the Ctrl+K palette. */
  searchLinks?: QuickLink[];
  /** Messages page the chat dropdown links to. */
  messagesHref: string;
  /** Extra controls between the icon cluster and the language switcher (season pill). */
  extra?: ReactNode;
  profile: {
    name: string;
    subtitle?: string;
    avatarUrl?: string | null;
    links: ProfileMenuLink[];
    logoutLabel: string;
    onLogout: () => void;
  };
}

/**
 * Compact sticky top bar shared by the player and admin shells: hamburger +
 * brand (phones), the global search trigger (desktop), then the icon cluster
 * (search on phones, theme, palette, notifications, messages), optional
 * extras (season pill), language and the profile menu.
 */
export default function AppHeader({
  sidebarOpen,
  setSidebarOpen,
  homeHref,
  searchLinks,
  messagesHref,
  extra,
  profile,
}: AppHeaderProps) {
  return (
    <header className="app-header sticky top-0 z-999 flex w-full">
      <div className="flex h-16 flex-grow items-center justify-between gap-3 px-4 md:px-6 2xl:px-10">
        {/* Left: hamburger + brand on phones, search bar on desktop */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={sidebarOpen}
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
            className="header-btn lg:hidden"
          >
            <Menu size={18} />
          </button>

          <Link href={homeHref} className="shrink-0 lg:hidden" aria-label="MLBB Togo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mlbbtogo-icon.png" alt="" aria-hidden="true" className="h-8 w-8 rounded-md" />
          </Link>

          <div className="hidden lg:block">
            <HeaderSearch links={searchLinks} variant="bar" shortcut={false} />
          </div>
        </div>

        {/* Right: icon cluster + profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ul className="flex items-center gap-1.5 sm:gap-2">
            <li className="lg:hidden">
              <HeaderSearch links={searchLinks} />
            </li>
            {/* Dark toggle hidden on phones (the palette menu handles light/dark there) */}
            <li className="hidden sm:block">
              <DarkModeToggle />
            </li>
            <li>
              <ThemeSwitcher />
            </li>
            <li>
              <NotificationDropdown />
            </li>
            <li>
              <MessageDropdown href={messagesHref} />
            </li>
            {extra}
            {/* Language hidden on phones to keep the bar from overflowing */}
            <li className="hidden sm:block">
              <LanguageSwitcher />
            </li>
          </ul>

          <span aria-hidden="true" className="hidden h-6 w-px bg-line-subtle sm:block" />

          <ProfileDropdown
            name={profile.name}
            subtitle={profile.subtitle}
            avatarUrl={profile.avatarUrl}
            logoutLabel={profile.logoutLabel}
            onLogout={profile.onLogout}
            links={profile.links}
          />
        </div>
      </div>
    </header>
  );
}
