'use client';

import { useEffect, useState } from 'react';
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

export default function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const lang = useLangStore((s: any) => s.lang);
  const setLang = useLangStore((s: any) => s.setLang);
  const userProfile = useAuthStore((s: any) => s.userProfile);
  const setUser = useAuthStore((s: any) => s.setUser);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);
  const t = useT();

  // Applique la langue persistée après le montage (évite tout décalage d'hydratation).
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('mlbb-lang') : null;
    if (saved && saved !== lang) setLang(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si un jeton est présent, recharge le profil pour afficher l'avatar dans le header.
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

  const logout = () => {
    setToken(null);
    setUser(null);
    setUserProfile(null);
    setProfileOpen(false);
  };

  // Défilement fluide vers une section de la page (ou le haut si id vide).
  const goTo = (id: string) => {
    setMenuOpen(false);
    if (!id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="absolute top-0 inset-x-0 z-30 h-20 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mlbb-togo-logo.png" alt="MLBB Togo" className="h-9 md:h-10 w-auto" />
        </Link>

        {/* Droite */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Sélecteur de langue */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
              aria-label="Langue"
            >
              <Globe size={18} />
              <span className="text-sm font-medium uppercase">{lang}</span>
              <ChevronDown size={14} />
            </button>
            <AnimatePresence>
              {langOpen && (
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
                        setLangOpen(false);
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

          {/* Connecté → avatar + menu profil ; sinon → bouton Login */}
          {userProfile ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
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
                {profileOpen && (
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
                      onClick={() => setProfileOpen(false)}
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
            <button
              onClick={() => setSignInOpen(true)}
              className="px-6 py-1.5 rounded-md text-white text-sm font-semibold border border-white/20 shadow-md transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(180deg, #4aa6ff 0%, #1e6fd0 100%)' }}
            >
              {t('header.login')}
            </button>
          )}

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  className="absolute right-0 top-12 w-56 rounded-xl border border-gaming-border bg-gaming-card shadow-gaming overflow-hidden py-1"
                >
                  {/* Sections de la page */}
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
