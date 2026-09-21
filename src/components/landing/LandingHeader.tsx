'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, ChevronDown, Menu, X, Home, Check,
  Trophy, Mail, Award,
  LayoutDashboard, LogOut, Info, Flag,
} from 'lucide-react';
import { useLangStore, useAuthStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';
import { api, getToken, setToken, avatarSrc } from '@/lib/api';
import { Button } from '@/components/ui';
import SignInModal from './SignInModal';
import { SIGN_IN_EVENT } from './HeroSection';

const LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
];

// Public pages only: the landing sections are reached by scrolling the home
// page, so the header never mixes in-page anchors with page links.
const SECTIONS: { key: string; href: string; icon: any }[] = [
  { key: 'nav.home', href: '/', icon: Home },
  { key: 'nav.league', href: '/league', icon: Flag },
  { key: 'header.awards', href: '/awards', icon: Award },
  { key: 'nav.hallOfFame', href: '/hall-of-fame', icon: Trophy },
  { key: 'nav.about', href: '/about', icon: Info },
  { key: 'nav.contact', href: '/contact', icon: Mail },
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
  const pathname = usePathname();
  const router = useRouter();

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

  // The landing hero CTA opens the same sign-in modal.
  useEffect(() => {
    const onOpen = () => setSignInOpen(true);
    window.addEventListener(SIGN_IN_EVENT, onOpen);
    return () => window.removeEventListener(SIGN_IN_EVENT, onOpen);
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

  const goTo = (s: (typeof SECTIONS)[number]) => {
    setOpenMenu(null);
    if (s.href === pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    router.push(s.href);
  };

  // White text only over the dark landing hero; everywhere else the header is
  // solid and uses the theme ink colors (readable in light mode too).
  const solid = scrolled || pathname !== '/';
  const ink = solid ? 'text-ink-2 hover:text-ink-1' : 'text-white/80 hover:text-white';

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 h-20 transition-colors duration-300 ${
        solid
          ? 'bg-surface-0/85 backdrop-blur-md border-b border-line-subtle'
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
              onClick={() => goTo(s)}
              aria-current={pathname === s.href ? 'page' : undefined}
              className={`relative px-3 py-2 rounded text-sm font-medium transition-colors ${
                pathname === s.href
                  ? `${solid ? 'text-ink-1' : 'text-white'} after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:bg-primary`
                  : ink
              }`}
            >
              {t(s.key)}
            </button>
          ))}
        </nav>

        <div ref={navRef} className="flex items-center gap-3 sm:gap-4">

          <div className="relative">
            <button
              onClick={() => toggle('lang')}
              className={`flex items-center gap-1.5 ${ink} transition-colors`}
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
                  className="absolute right-0 top-10 w-32 rounded-md border border-line-strong bg-surface-1 shadow-elev-3 overflow-hidden"
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
                          ? 'text-primary bg-primary/10'
                          : 'text-ink-2 hover:bg-surface-2 hover:text-ink-1'
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
                    className="w-9 h-9 rounded object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-9 h-9 rounded bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center text-sm font-bold text-on-primary">
                    {(userProfile.displayName || userProfile.username)?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <ChevronDown size={14} className={solid ? 'text-ink-2' : 'text-white/80'} />
              </button>

              <AnimatePresence>
                {openMenu === 'profile' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="absolute right-0 top-12 w-52 rounded-md border border-line-strong bg-surface-1 shadow-elev-3 overflow-hidden py-1"
                  >
                    <div className="px-4 py-2.5 border-b border-line-subtle">
                      <p className="text-sm font-semibold text-ink-1 truncate">{userProfile.displayName || userProfile.username || 'Joueur'}</p>
                      {userProfile.email && (
                        <p className="text-xs text-ink-3 truncate">{userProfile.email}</p>
                      )}
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setOpenMenu(null)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink-1 transition-colors"
                    >
                      <LayoutDashboard size={16} /> {t('header.dashboard')}
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-accent-red hover:bg-accent-red/10 transition-colors text-left"
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
              className={`p-2 rounded-lg ${ink} ${solid ? 'hover:bg-surface-2' : 'hover:bg-white/10'} transition-colors`}
            >
              {openMenu === 'sections' ? <X size={22} /> : <Menu size={22} />}
            </button>

            <AnimatePresence>
              {openMenu === 'sections' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  className="absolute right-0 top-12 w-56 rounded-md border border-line-strong bg-surface-1 shadow-elev-3 overflow-hidden py-1"
                >

                  {SECTIONS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.key}
                        onClick={() => goTo(s)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink-1 transition-colors text-left"
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
