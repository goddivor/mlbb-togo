'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';

interface EsportTeam {
  id: string;
  name: string;
  image: string;
  sort: number;
}
interface Esport {
  name: string;
  logo: string;
  color: string;
  teams: EsportTeam[];
}

export default function HeroSection() {
  const [org, setOrg] = useState<Esport | null>(null);
  const [active, setActive] = useState(0);
  const t = useT();

  useEffect(() => {
    api.esport.org().then((o: any) => {
      if (o && Array.isArray(o.teams) && o.teams.length) setOrg(o);
    });
  }, []);

  const teams = org?.teams ?? [];
  const go = useCallback(
    (dir: number) => setActive((a) => (teams.length ? (a + dir + teams.length) % teams.length : 0)),
    [teams.length],
  );

  useEffect(() => {
    if (teams.length < 2) return;
    const id = setInterval(() => setActive((a) => (a + 1) % teams.length), 5000);
    return () => clearInterval(id);
  }, [teams.length]);

  const team = teams[active];
  const gold = org?.color || '#E9B84B';

  return (
    <section className="relative w-full h-[100svh] min-h-[620px] overflow-hidden">

      {team && (
        <AnimatePresence mode="wait">
          <motion.div
            key={team.id}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${team.image})` }}
          />
        </AnimatePresence>
      )}

      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-gaming-dark via-gaming-dark/30 to-black/40" />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight text-white text-shadow-lg"
        >
          {t('hero.titlePre')} <span className="text-gradient">Mobile Legends</span>
          <br className="hidden sm:block" /> {t('hero.titlePost')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-lg sm:text-xl text-gray-200 max-w-2xl"
        >
          {t('hero.subtitle')}
        </motion.p>
      </div>

      {org && team && (
        <div className="absolute bottom-8 left-6 sm:left-10 z-20 flex items-end gap-3 sm:gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={org.logo} alt={org.name} className="w-14 h-14 sm:w-20 sm:h-20 object-contain shrink-0" />
          <div>
            <p className="text-[11px] sm:text-sm font-bold tracking-[0.2em]" style={{ color: gold }}>
              {org.name}
            </p>
            <AnimatePresence mode="wait">
              <motion.h2
                key={team.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
                className="text-2xl sm:text-4xl font-extrabold text-white leading-none"
              >
                {team.name}
              </motion.h2>
            </AnimatePresence>
          </div>
        </div>
      )}

      {teams.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Précédent"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Suivant"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      <div className="absolute bottom-8 right-6 sm:right-10 z-20 flex items-center gap-2">
        {teams.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setActive(i)}
            aria-label={t.name}
            className={`h-2 rounded-full transition-all ${i === active ? 'w-6' : 'w-2 bg-white/40 hover:bg-white/70'}`}
            style={i === active ? { backgroundColor: gold } : undefined}
          />
        ))}
      </div>
    </section>
  );
}
