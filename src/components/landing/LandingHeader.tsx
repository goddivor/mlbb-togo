'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, ChevronDown, Menu, X, Home, Check,
  LayoutGrid, Trophy, Sparkles, Handshake, Mail,
  LayoutDashboard, LogOut,
} from 'lucide-react';
import { useLangStore, useAuthStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';
import { api, getToken, setToken, avatarSrc } from '@/lib/api';
import { Button } from '@/components/ui';
import SignInModal from './SignInModal';

const LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
];

const SECTIONS = [
  { key: 'nav.home', id: '', icon: Home },
  { key: 'nav.features', id: 'features', icon: LayoutGrid },
  { key: 'nav.mtl', id: 'mtl', icon: Trophy },
  { key: 'nav.heroes', id: 'heroes', icon: Sparkles },
  { key: 'nav.partners', id: 'partners', icon: Handshake },
  { key: 'nav.contact', id: 'contact', icon: Mail },
];

type OpenMenu = 'lang' | 'profile' | 'sections' | null;

export default function LandingHeader() {

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [signInOpen, setSignInOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const lang = useLangStore((s: any) => s.lang);
  const setLang = useLangStore((s: any) => s.setLang);
  const userProfile = useAuthStore((s: any) => s.userProfile);
  const setUser = useAuthStore((s: any) => s.setUser);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);
  const t = useT();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('mlbb-lang') : null;
    if (saved && saved !== lang) setLang(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    api.auth
      .me()
      .then((u: any) => {
        setUser(u);
        setUserProfile(u);
      })
      .catch(() => setToken(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openMenu]);

  const toggle = (menu: Exclude<OpenMenu, null>) =>
    setOpenMenu((cur) => (cur === menu ? null : menu));

  const logout = () => {
    setToken(null);
    setUser(null);
    setUserProfile(null);
    setOpenMenu(null);
  };

  const goTo = (id: string) => {
    setOpenMenu(null);
    if (!id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 h-20 transition-colors duration-300 ${
        scrolled
          ? 'bg-gaming-dark/90 backdrop-blur border-b border-gaming-border'
          : 'bg-gradient-to-b from-black/70 via-black/30 to-transparent'
      }`}
    >
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">

        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mlbb-togo-logo.png" alt="MLBB Togo" className="h-9 md:h-10 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => goTo(s.id)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {t(s.key)}
            </button>
          ))}
        </nav>

        <div ref={navRef} className="flex items-center gap-3 sm:gap-4">

          <div className="relative">
            <button
              onClick={() => toggle('lang')}
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
              aria-label="Langue"
            >
              <Globe size={18} />
              <span className="text-sm font-medium uppercase">{lang}</span>
              <ChevronDown size={14} />
            </button>
            <AnimatePresence>
              {openMenu === 'lang' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  className="absolute right-0 top-10 w-32 rounded-xl border border-gaming-border bg-gaming-card shadow-gaming overflow-hidden"
                >
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setOpenMenu(null);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        lang === l.code
                          ? 'text-neon-blue bg-neon-blue/10'
                          : 'text-gray-300 hover:bg-gaming-surface hover:text-white'
                      }`}
                    >
                      {l.label}
                      {lang === l.code && <Check size={14} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {userProfile ? (
            <div className="relative">
              <button
                onClick={() => toggle('profile')}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Profil"
              >
                {userProfile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc(userProfile.avatar)}
                    alt={userProfile.displayName || userProfile.username || 'Profil'}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-lg object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-sm font-bold text-white">
                    {(userProfile.displayName || userProfile.username)?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <ChevronDown size={14} className="text-white/80" />
              </button>

              <AnimatePresence>
                {openMenu === 'profile' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="absolute right-0 top-12 w-52 rounded-xl border border-gaming-border bg-gaming-card shadow-gaming overflow-hidden py-1"
                  >
                    <div className="px-4 py-2.5 border-b border-gaming-border">
                      <p className="text-sm font-semibold text-white truncate">{userProfile.displayName || userProfile.username || 'Joueur'}</p>
                      {userProfile.email && (
                        <p className="text-xs text-gray-400 truncate">{userProfile.email}</p>
                      )}
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setOpenMenu(null)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-gaming-surface hover:text-white transition-colors"
                    >
                      <LayoutDashboard size={16} /> {t('header.dashboard')}
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut size={16} /> {t('header.logout')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setSignInOpen(true)}>
              {t('header.login')}
            </Button>
          )}

          <div className="relative md:hidden">
            <button
              onClick={() => toggle('sections')}
              aria-label="Menu"
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {openMenu === 'sections' ? <X size={22} /> : <Menu size={22} />}
            </button>

            <AnimatePresence>
              {openMenu === 'sections' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  className="absolute right-0 top-12 w-56 rounded-xl border border-gaming-border bg-gaming-card shadow-gaming overflow-hidden py-1"
                >

                  {SECTIONS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.key}
                        onClick={() => goTo(s.id)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-gaming-surface hover:text-white transition-colors text-left"
                      >
                        <Icon size={16} /> {t(s.key)}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </header>
  );
}
