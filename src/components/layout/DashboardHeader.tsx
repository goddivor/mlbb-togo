'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, ChevronDown, MessageSquare } from 'lucide-react';
import { useAuthStore, useLangStore } from '@/store/useStore';
import { setToken, avatarSrc } from '@/lib/api';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import NotificationBell from '@/components/common/NotificationBell';
import { useT } from '@/lib/i18n';

export default function DashboardHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const userProfile = useAuthStore((s: any) => s.userProfile);
  const lang = useLangStore((s: any) => s.lang);
  const setLang = useLangStore((s: any) => s.setLang);
  const t = useT();

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('mlbb-lang') : null;
    if (saved && saved !== lang) setLang(saved);
  }, [lang, setLang]);

  const logout = () => {
    setToken(null);
    useAuthStore.getState().logout();
    router.replace('/');
  };

  const name = userProfile?.displayName || userProfile?.username || 'Joueur';

  return (
    <header className="sticky top-0 z-40 h-16 bg-gaming-card/95 backdrop-blur border-b border-gaming-border">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">

        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mlbb-togo-logo.png" alt="MLBB Togo" className="h-9 w-auto" />
        </Link>

        <div className="flex items-center gap-2">

          <Link
            href="/messages"
            title={t('header.messages')}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-gaming-surface transition-colors"
          >
            <MessageSquare size={18} />
          </Link>

          <NotificationBell />

          <LanguageSwitcher />

          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gaming-surface transition-colors"
              aria-label="Profil"
            >
              {userProfile?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc(userProfile.avatar)}
                  alt={name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-lg object-cover border border-gaming-border"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-sm font-bold text-white">
                  {name[0]?.toUpperCase() || 'J'}
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium text-gray-200 max-w-[140px] truncate">{name}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            <AnimatePresence>
              {open && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-gaming-border bg-gaming-card shadow-gaming overflow-hidden py-1"
                  >
                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-gaming-surface hover:text-white transition-colors"
                    >
                      <User size={16} /> {t('header.menu.profile')}
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut size={16} /> {t('header.logout')}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
