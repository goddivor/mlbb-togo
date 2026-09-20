'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { EASE_OUT, DURATION } from '@/lib/motion';
import { getAboutContent } from '@/content/about';
import CountUp from '@/components/about/CountUp';

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

type FigureKey = 'streamAudience' | 'socialReach' | 'teams' | 'offlineEvents';
type Figures = Record<FigureKey, number>;

/** Ask the header to open the sign-in modal (keeps a single modal instance). */
export const SIGN_IN_EVENT = 'mlbb:open-signin';

export default function HeroSection() {
  const [org, setOrg] = useState<Esport | null>(null);
  const [figures, setFigures] = useState<Figures | null>(null);
  const [active, setActive] = useState(0);
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const reduce = useReducedMotion();
  const figureLabels = useMemo(() => getAboutContent(lang).figures.items, [lang]);

  useEffect(() => {
    api.catalog
      .esportOrg()
      .then((o: any) => {
        if (o && Array.isArray(o.teams) && o.teams.length) setOrg(o);
      })
      .catch(() => {}); // silent fallback
    api.esport
      .figures()
      .then((f: any) => {
        if (f && typeof f === 'object') setFigures(f);
      })
      .catch(() => {});
  }, []);

  const teams = org?.teams ?? [];
  const go = useCallback(
    (dir: number) => setActive((a) => (teams.length ? (a + dir + teams.length) % teams.length : 0)),
    [teams.length],
  );

  useEffect(() => {
    if (teams.length < 2 || reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % teams.length), 6000);
    return () => clearInterval(id);
  }, [teams.length, reduce]);

  const team = teams[active];
  const gold = org?.color || '#E9B84B';

  // One orchestrated entrance: kicker -> headline -> copy -> CTAs -> stat strip.
  const seq = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: DURATION.slow + 0.1, ease: EASE_OUT, delay: 0.15 + i * 0.1 },
        };

  return (
    <section className="relative w-full min-h-[100svh] overflow-hidden bg-surface-0">
      {/* Splash art */}
      <AnimatePresence mode="wait">
        {team && (
          <motion.div
            key={team.id}
            initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${team.image})` }}
          />
        )}
      </AnimatePresence>

      {/* Cinematic treatment: vignette + angled colour wash in the org colour */}
      <div className="absolute inset-0 bg-gradient-to-r from-surface-0 via-surface-0/70 to-surface-0/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-0 via-transparent to-surface-0/60" />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-[46%] mix-blend-screen opacity-40"
        style={{
          background: `linear-gradient(200deg, ${gold} 0%, transparent 60%)`,
          clipPath: 'polygon(35% 0, 100% 0, 100% 100%, 0 100%)',
        }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-grid opacity-60 [mask-image:linear-gradient(to_bottom,transparent,black_40%,transparent)]" />

      {/* Copy */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pb-28 pt-32 sm:px-6 sm:pb-32 lg:justify-center lg:pb-40">
        <motion.p {...seq(0)} className="eyebrow mb-5 !leading-snug">
          {t('hero.kicker')}
        </motion.p>
        <motion.h1
          {...seq(1)}
          className="max-w-4xl font-display text-[2.75rem] font-bold uppercase leading-[0.92] tracking-tight2 text-white sm:text-6xl lg:text-[5.5rem]"
        >
          {t('hero.titlePre')} <span className="text-accent-cyan">Mobile Legends</span>
          <br /> {t('hero.titlePost')}
        </motion.h1>
        <motion.p {...seq(2)} className="mt-6 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
          {t('hero.subtitle')}
        </motion.p>
        <motion.div {...seq(3)} className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(SIGN_IN_EVENT))}
            className="btn-cut [--btn-bg:rgb(var(--primary))] inline-flex items-center gap-2 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-on-primary transition-[box-shadow,filter] duration-base hover:shadow-glow-cyan hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {t('hero.cta.join')} <ArrowRight size={16} />
          </button>
          <Link
            href="/league"
            className="cut-corners-sm inline-flex items-center gap-2 border border-white/25 bg-white/5 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-white backdrop-blur transition-colors duration-base hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {t('hero.cta.league')}
          </Link>
        </motion.div>
      </div>

      {/* Org + active team tag */}
      {org && team && (
        <div className="absolute bottom-8 left-4 z-20 flex items-end gap-3 sm:left-6 sm:gap-4 lg:bottom-32 lg:left-[max(1.5rem,calc((100%-80rem)/2+1.5rem))]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={org.logo} alt={org.name} className="h-11 w-11 shrink-0 object-contain sm:h-14 sm:w-14" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-eyebrow sm:text-xs" style={{ color: gold }}>
              {org.name}
            </p>
            <AnimatePresence mode="wait">
              <motion.h2
                key={team.id}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: DURATION.slow, ease: EASE_OUT }}
                className="max-w-[45vw] truncate font-display text-xl font-bold uppercase leading-none text-white sm:max-w-none sm:text-3xl"
              >
                {team.name}
              </motion.h2>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Slide controls: numbered angled bars */}
      {teams.length > 1 && (
        <div className="absolute bottom-8 right-4 z-20 flex items-center gap-3 sm:right-6 lg:bottom-32 lg:right-[max(1.5rem,calc((100%-80rem)/2+1.5rem))]">
          <span className="num hidden font-display text-xs font-bold text-white/70 sm:inline">
            {String(active + 1).padStart(2, '0')}
            <span className="text-white/35"> / {String(teams.length).padStart(2, '0')}</span>
          </span>
          <div className="flex items-center gap-1.5">
            {teams.map((tm, i) => (
              <button
                key={tm.id}
                onClick={() => setActive(i)}
                aria-label={t('hero.slide', { n: i + 1, total: teams.length })}
                aria-current={i === active}
                className={`h-1.5 -skew-x-12 transition-[width,background-color] duration-base ${
                  i === active ? 'w-8' : 'w-3 bg-white/30 hover:bg-white/60'
                }`}
                style={i === active ? { backgroundColor: gold } : undefined}
              />
            ))}
          </div>
          <div className="ml-2 hidden items-center gap-1 sm:flex">
            <button
              onClick={() => go(-1)}
              aria-label="Précédent"
              className="flex h-9 w-9 items-center justify-center border border-white/20 text-white/70 transition-colors hover:border-white/60 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Suivant"
              className="flex h-9 w-9 items-center justify-center border border-white/20 text-white/70 transition-colors hover:border-white/60 hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Stat strip: angled plate on the bottom edge of the hero */}
      {figures && (
        <motion.dl
          {...seq(4)}
          className="absolute inset-x-0 -bottom-px z-10 hidden lg:block"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="cut-corners grid grid-cols-4 divide-x divide-white/10 border border-white/10 bg-surface-0/70 backdrop-blur-md">
              {figureLabels.map((f) => (
                <div key={f.key} className="px-6 py-4">
                  <dd className="num font-display text-2xl font-bold leading-none text-white">
                    <CountUp value={figures[f.key] ?? 0} locale={lang === 'en' ? 'en-US' : 'fr-FR'} />
                    <span className="text-accent-cyan">+</span>
                  </dd>
                  <dt className="mt-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-3">{f.label}</dt>
                </div>
              ))}
            </div>
          </div>
        </motion.dl>
      )}
    </section>
  );
}
