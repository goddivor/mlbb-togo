'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, mlbbImg } from '@/lib/api';
import { MLBB_ROLE_ICONS, MLBB_ARROW_LEFT, MLBB_ARROW_RIGHT } from '@/lib/constants';

interface ShowcaseHero {
  heroId: number;
  name: string;
  art: string;
  thumb: string;
  roles: string[];
  specialities: string[];
  stats: { durability: number; offense: number; ability: number; difficulty: number };
  skills: { name: string; icon: string }[];
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-sm text-white/70 mb-1.5">{label}</p>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-neon-blue to-cyan-300"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function HeroShowcase() {
  const [heroes, setHeroes] = useState<ShowcaseHero[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    api.mlbb.showcase(6).then((list: any) => {
      if (Array.isArray(list) && list.length) setHeroes(list);
    });
  }, []);

  const go = useCallback(
    (dir: number) => {
      setActive((a) => (heroes.length ? (a + dir + heroes.length) % heroes.length : 0));
    },
    [heroes.length],
  );

  // Défilement automatique.
  useEffect(() => {
    if (heroes.length < 2) return;
    const id = setInterval(() => setActive((a) => (a + 1) % heroes.length), 7000);
    return () => clearInterval(id);
  }, [heroes.length]);

  if (!heroes.length) {
    return (
      <div className="relative w-full rounded-2xl border border-gaming-border bg-gaming-card/60 h-[520px] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" />
      </div>
    );
  }

  const hero = heroes[active];

  return (
    <div className="relative w-full rounded-2xl border border-gaming-border overflow-hidden bg-gradient-to-br from-[#0b1a3a] via-[#0a1228] to-[#0a0a1a]">
      {/* Fond immersif : illustration floutée du héros courant */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${hero.heroId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.18 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-cover bg-center blur-2xl scale-110"
          style={{ backgroundImage: `url(${mlbbImg(hero.art, 500)})` }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-gaming-dark via-gaming-dark/40 to-transparent" />

      {/* Contenu principal */}
      <div className="relative z-10 grid md:grid-cols-2 gap-4 px-6 pb-28 pt-6 min-h-[460px]">
        {/* Illustration */}
        <div className="relative hidden md:flex items-end justify-center overflow-hidden">
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-72 h-72 border border-neon-blue/10 rotate-45 rounded-3xl" />
          <AnimatePresence mode="wait">
            <motion.img
              key={`art-${hero.heroId}`}
              src={mlbbImg(hero.art, 700)}
              alt={hero.name}
              initial={{ opacity: 0, x: -30, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.45 }}
              className="relative max-h-[440px] max-w-full object-contain drop-shadow-[0_10px_40px_rgba(0,212,255,0.25)]"
            />
          </AnimatePresence>
        </div>

        {/* Infos */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`info-${hero.heroId}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col justify-center gap-5 md:pr-4"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-4xl md:text-5xl font-bold text-white">{hero.name}</h2>
              {hero.roles[0] && MLBB_ROLE_ICONS[String(hero.roles[0]).toLowerCase()] && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={mlbbImg(MLBB_ROLE_ICONS[String(hero.roles[0]).toLowerCase()])}
                  alt={hero.roles[0]}
                  title={hero.roles[0]}
                  className="w-8 h-8 md:w-9 md:h-9 object-contain drop-shadow-[0_0_6px_rgba(0,212,255,0.5)]"
                />
              )}
            </div>

            <div className="h-px bg-white/15" />

            <div>
              <p className="text-neon-blue font-medium">{hero.roles.join('  ·  ')}</p>
              <p className="text-white/60 text-sm mt-1">{hero.specialities.join('   ')}</p>
            </div>

            {/* Icônes de compétences */}
            <div className="flex items-center gap-3">
              {hero.skills.slice(0, 4).map((s, i) => (
                <div
                  key={i}
                  title={s.name}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border border-white/20 bg-black/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mlbbImg(s.icon, 96)} alt={s.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 max-w-md">
              <StatBar label="Durability" value={hero.stats.durability} />
              <StatBar label="Offense" value={hero.stats.offense} />
              <StatBar label="Ability Effects" value={hero.stats.ability} />
              <StatBar label="Difficulty" value={hero.stats.difficulty} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Flèches (SVG officiels) */}
      <button
        onClick={() => go(-1)}
        aria-label="Précédent"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 opacity-70 hover:opacity-100 transition-opacity"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mlbbImg(MLBB_ARROW_LEFT)} alt="Précédent" className="w-8 h-12 object-contain" />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Suivant"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 opacity-70 hover:opacity-100 transition-opacity"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mlbbImg(MLBB_ARROW_RIGHT)} alt="Suivant" className="w-8 h-12 object-contain" />
      </button>

      {/* Bande de vignettes */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-2">
        {heroes.map((h, i) => (
          <button
            key={h.heroId}
            onClick={() => setActive(i)}
            aria-label={h.name}
            className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
              i === active ? 'border-neon-blue scale-110 shadow-neon' : 'border-white/10 opacity-70 hover:opacity-100'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mlbbImg(h.thumb, 120)} alt={h.name} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
