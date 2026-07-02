'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, ExternalLink } from 'lucide-react';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { useT } from '@/lib/i18n';
import { setToken } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';

export default function AdminHeader() {
  const t = useT();
  const router = useRouter();
  const user = useAuthStore((s: any) => s.user);
  const logout = useAuthStore((s: any) => s.logout);

  const signOut = () => {
    setToken(null);
    logout?.();
    router.replace('/admin-login');
  };

  return (
    <header className="sticky top-0 z-30 h-14 shrink-0 border-b border-gaming-border bg-gaming-dark/90 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6">
      <h2 className="text-sm font-semibold text-white">{t('admin.area')}</h2>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />

        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ExternalLink size={14} /> {t('admin.backToSite')}
        </Link>

        {user?.username && (
          <span className="hidden sm:inline text-xs text-gray-500 max-w-[10rem] truncate">
            {user.username}
          </span>
        )}

        <button
          type="button"
          onClick={signOut}
          title={t('header.logout')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">{t('header.logout')}</span>
        </button>
      </div>
    </header>
  );
}
