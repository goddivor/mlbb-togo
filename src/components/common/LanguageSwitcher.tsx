'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLangStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lang = useLangStore((s: any) => s.lang);
  const setLang = useLangStore((s: any) => s.setLang);
  const t = useT();

  // Ferme le menu au clic en dehors.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Globe size={14} />
        <span>{lang === 'fr' ? 'FR' : 'EN'}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-gaming-border bg-gaming-card shadow-gaming overflow-hidden z-50"
          >
            {[
              { code: 'fr', label: t('lang.fr') },
              { code: 'en', label: t('lang.en') },
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
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
  );
}
