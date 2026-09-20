'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { api, mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { MLBB_ROLE_ICONS, MLBB_ARROW_LEFT, MLBB_ARROW_RIGHT } from '@/lib/constants';
import { Skeleton } from '@/components/ui';
import { DURATION, EASE_OUT } from '@/lib/motion';

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

function StatBar({ label, value, reduce }: { label: string; value: number; reduce: boolean }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-3">{label}</p>
        <span className="num text-xs font-bold text-ink-1">{pct}</span>
      </div>
      <div className="h-1.5 overflow-hidden bg-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent-violet"
          initial={reduce ? { width: `${pct}%` } : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        />
      </div>
    </div>
  );
}

export default function HeroShowcase() {
  const t = useT();
  const reduce = useReducedMotion();
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

  useEffect(() => {
    if (heroes.length < 2 || reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % heroes.length), 7000);
    return () => clearInterval(id);
  }, [heroes.length, reduce]);

  if (!heroes.length) {
    return (
      <div className="cut-corners relative flex h-[520px] w-full flex-col justify-end border border-line-subtle bg-surface-1 p-8">
        <Skeleton className="mb-3 h-10 w-1/3" />
        <Skeleton lines={3} className="max-w-md" />
      </div>
    );
  }

  const hero = heroes[active];
  const enter = reduce ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } } : undefined;

  return (
    <div className="cut-corners relative w-full overflow-hidden border border-line-subtle bg-surface-1">
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${hero.heroId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.22 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
          style={{ backgroundImage: `url(${mlbbImg(hero.art, 500)})` }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-surface-0 via-surface-0/50 to-transparent" />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 hidden w-1/2 bg-primary/10 md:block"
        style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 100%)' }}
      />

      <div className="relative z-10 grid min-h-[460px] gap-4 px-6 pb-28 pt-6 md:grid-cols-2">
        <div className="relative hidden items-end justify-center overflow-hidden md:flex">
          <AnimatePresence mode="wait">
            <motion.img
              key={`art-${hero.heroId}`}
              src={mlbbImg(hero.art, 700)}
              alt={hero.name}
              {...(enter ?? {
                initial: { opacity: 0, x: -30, scale: 0.96 },
                animate: { opacity: 1, x: 0, scale: 1 },
                exit: { opacity: 0, x: 30 },
              })}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="relative max-h-[440px] max-w-full object-contain drop-shadow-[0_10px_40px_rgb(var(--accent-cyan)/0.25)]"
            />
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`info-${hero.heroId}`}
            {...(enter ?? {
              initial: { opacity: 0, y: 16 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -10 },
            })}
            transition={{ duration: DURATION.slow, ease: EASE_OUT }}
            className="flex flex-col justify-center gap-5 md:pr-4"
          >
            <div>
              <p className="eyebrow mb-2">{(hero.roles ?? []).join(' / ')}</p>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-4xl font-bold uppercase tracking-tight2 text-ink-1 md:text-6xl">{hero.name}</h2>
                {hero.roles[0] && MLBB_ROLE_ICONS[String(hero.roles[0]).toLowerCase()] && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={mlbbImg(MLBB_ROLE_ICONS[String(hero.roles[0]).toLowerCase()])}
                    alt={hero.roles[0]}
                    title={hero.roles[0]}
                    className="h-8 w-8 object-contain md:h-9 md:w-9"
                  />
                )}
              </div>
              <p className="mt-2 text-sm text-ink-2">{(hero.specialities ?? []).join(', ')}</p>
            </div>

            <div className="flex items-center gap-3">
              {(hero.skills ?? []).slice(0, 4).map((s, i) => (
                <div
                  key={i}
                  title={s.name}
                  className="cut-corners-sm h-12 w-12 overflow-hidden border border-white/20 bg-black/30 md:h-14 md:w-14"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mlbbImg(s.icon, 96)} alt={s.name} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>

            <div className="grid max-w-md grid-cols-2 gap-x-6 gap-y-3">
              <StatBar label={t('showcase.stat.durability')} value={hero.stats?.durability ?? 0} reduce={!!reduce} />
              <StatBar label={t('showcase.stat.offense')} value={hero.stats?.offense ?? 0} reduce={!!reduce} />
              <StatBar label={t('showcase.stat.ability')} value={hero.stats?.ability ?? 0} reduce={!!reduce} />
              <StatBar label={t('showcase.stat.difficulty')} value={hero.stats?.difficulty ?? 0} reduce={!!reduce} />
            </div>

            <Link
              href="/heroes"
              className="inline-flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:text-ink-1"
            >
              {t('showcase.viewAll')} <ArrowRight size={14} />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        onClick={() => go(-1)}
        aria-label="Précédent"
        className="absolute left-2 top-1/2 z-20 -translate-y-1/2 opacity-70 transition-opacity hover:opacity-100 sm:left-4"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mlbbImg(MLBB_ARROW_LEFT)} alt="Précédent" className="h-12 w-8 object-contain" />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Suivant"
        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 opacity-70 transition-opacity hover:opacity-100 sm:right-4"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mlbbImg(MLBB_ARROW_RIGHT)} alt="Suivant" className="h-12 w-8 object-contain" />
      </button>

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 px-2">
        {heroes.map((h, i) => (
          <button
            key={h.heroId}
            onClick={() => setActive(i)}
            aria-label={h.name}
            aria-current={i === active}
            className={`relative h-14 w-14 overflow-hidden cut-corners-sm border-2 transition-[transform,opacity,border-color] duration-base ${
              i === active ? 'scale-110 border-primary' : 'border-white/10 opacity-60 hover:opacity-100'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mlbbImg(h.thumb, 120)} alt={h.name} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
