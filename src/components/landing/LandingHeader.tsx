'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Menu, X, LogIn, UserPlus, Home, Check } from 'lucide-react';
import { useLangStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';

const LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
];

export default function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const lang = useLangStore((s: any) => s.lang);
  const setLang = useLangStore((s: any) => s.setLang);
  const t = useT();

  // Applique la langue persistée après le montage (évite tout décalage d'hydratation).
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('mlbb-lang') : null;
    if (saved && saved !== lang) setLang(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

          {/* Login */}
          <Link
            href="/login"
            className="px-6 py-1.5 rounded-md text-white text-sm font-semibold border border-white/20 shadow-md transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(180deg, #4aa6ff 0%, #1e6fd0 100%)' }}
          >
            {t('header.login')}
          </Link>

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
                  className="absolute right-0 top-12 w-48 rounded-xl border border-gaming-border bg-gaming-card shadow-gaming overflow-hidden"
                >
                  <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-gaming-surface hover:text-white transition-colors">
                    <Home size={16} /> {t('header.menu.home')}
                  </Link>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-gaming-surface hover:text-white transition-colors">
                    <LogIn size={16} /> {t('header.menu.login')}
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-neon-blue hover:bg-neon-blue/10 transition-colors">
                    <UserPlus size={16} /> {t('header.menu.register')}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
