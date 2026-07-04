'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search } from 'lucide-react';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { disconnectSocket } from '@/lib/realtime';
import { useT } from '@/lib/i18n';
import { setToken, avatarSrc } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/store/useStore';
import DarkModeToggle from './DarkModeToggle';
import NotificationDropdown from './NotificationDropdown';
import MessageDropdown from './MessageDropdown';
import ProfileDropdown from './ProfileDropdown';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

/** Admin dashboard header (TailAdmin top bar). */
export default function AdminHeader({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const t = useT();
  const router = useRouter();
  const user = useAuthStore((s: any) => s.user);
  const storeLogout = useAuthStore((s: any) => s.logout);
  const lang = useLangStore((s: any) => s.lang);

  // Same logout logic as before: drop the socket + token, clear the auth
  // store, then bounce back to the admin login.
  const signOut = () => {
    disconnectSocket();
    setToken(null);
    storeLogout?.();
    router.replace('/admin-login');
  };

  const name = user?.username || user?.displayName || 'Admin';
  const avatarUrl = user?.avatar ? avatarSrc(user.avatar) : null;

  return (
    <header className="sticky top-0 z-999 flex w-full bg-white shadow-default dark:bg-boxdark">
      <div className="flex flex-grow items-center justify-between px-4 py-4 md:px-6 2xl:px-11">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          {/* Hamburger Toggle BTN */}
          <button
            type="button"
            aria-label="Ouvrir le menu"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
            className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 text-black shadow-sm dark:border-strokedark dark:bg-boxdark dark:text-white lg:hidden"
          >
            <Menu size={20} />
          </button>

          <Link href="/admin/esport" className="block flex-shrink-0 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mlbbtogo-icon.png" alt="MLBB Togo" className="h-8 w-8" />
          </Link>
        </div>

        {/* Search (optional) */}
        <div className="hidden sm:block">
          <div className="relative">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-body dark:text-bodydark">
              <Search size={20} />
            </span>
            <input
              type="text"
              placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'}
              className="w-full bg-transparent pl-9 pr-4 text-black focus:outline-none dark:text-white xl:w-125"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-7">
          <ul className="flex items-center gap-2 sm:gap-4">
            <li>
              <DarkModeToggle />
            </li>
            <li>
              <NotificationDropdown />
            </li>
            <li>
              <MessageDropdown href="/admin/messages" />
            </li>
            <li>
              <LanguageSwitcher />
            </li>
          </ul>

          <ProfileDropdown
            name={name}
            subtitle={t('admin.area')}
            avatarUrl={avatarUrl}
            logoutLabel={t('header.logout')}
            onLogout={signOut}
            links={[
              { href: '/', label: t('admin.backToSite'), icon: 'external' },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
