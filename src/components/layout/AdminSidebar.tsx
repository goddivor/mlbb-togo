'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { adminMenuGroups } from '@/config/menu';
import { useT } from '@/lib/i18n';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

/** Admin dashboard sidebar (TailAdmin dark shell + declarative menu). */
export default function AdminSidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const t = useT();

  return (
    <aside
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-boxdark duration-300 ease-linear lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* SIDEBAR HEADER */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <Link href="/admin/esport" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mlbbtogo-icon.png"
            alt="MLBB Togo"
            className="h-9 w-9 rounded-md object-contain"
          />
          <span className="text-lg font-bold text-white">{t('admin.area')}</span>
        </Link>

        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fermer le menu"
          className="block text-white lg:hidden"
        >
          <ChevronLeft size={22} />
        </button>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        {/* Sidebar Menu */}
        <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
          {adminMenuGroups.map((group) => (
            <div key={group.id}>
              {group.titleKey && (
                <h3 className="mb-4 ml-4 text-sm font-semibold uppercase text-bodydark2">
                  {t(group.titleKey)}
                </h3>
              )}
              <ul className="mb-6 flex flex-col gap-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium duration-300 ease-in-out ${
                          active
                            ? 'bg-graydark text-white dark:bg-meta-4'
                            : 'text-bodydark hover:bg-graydark dark:hover:bg-meta-4'
                        }`}
                      >
                        <Icon size={18} />
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
