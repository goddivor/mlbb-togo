'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Trophy, Sparkles, ChevronRight } from 'lucide-react';
import { useSectionBase } from '@/components/layout/SectionBase';
import { Button, Card, EmptyState, SectionTitle, Skeleton } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { useSeasonStore, isLiveSeason, type Season } from '@/store/useSeasonStore';
import { fadeUp, stagger, still } from '@/lib/motion';
import { SeasonHero, SeasonStatusBadge, seasonAccent, seasonPeriod } from '@/components/seasons/shared';
import type { TFn } from '@/components/seasons/shared';

/** Public list of league seasons: the live one as a themed banner, then the archive. */
export function SeasonsView() {
  const base = useSectionBase();
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const reduce = useReducedMotion();
  const seasons = useSeasonStore((s) => s.seasons);
  const loaded = useSeasonStore((s) => s.loaded);
  const load = useSeasonStore((s) => s.load);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    load(true).finally(() => setReady(true));
  }, [load]);

  const live = seasons.find(isLiveSeason) ?? null;
  const upcoming = seasons.filter((s) => s.status === 'upcoming');
  const closed = seasons.filter((s) => s.status === 'closed');
  const listVariants = reduce ? still : stagger(0.06);
  const itemVariants = reduce ? still : fadeUp;

  const grid = (items: Season[]) => (
    <motion.div variants={listVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s) => (
        <motion.div key={s.id} variants={itemVariants} className="h-full">
          <SeasonCard season={s} t={t} lang={lang} />
        </motion.div>
      ))}
    </motion.div>
  );

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-12 px-4 pb-20 sm:px-6">
        <header className="max-w-2xl">
          <p className="eyebrow mb-3">{t('seasons.kicker')}</p>
          <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight2 text-ink-1 sm:text-6xl">{t('seasons.title')}</h1>
          <p className="mt-4 text-base text-ink-2">{t('seasons.intro')}</p>
        </header>

        {!ready || !loaded ? (
          <div className="space-y-6">
            <Skeleton className="h-[22rem] w-full rounded-lg" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : seasons.length === 0 ? (
          <EmptyState icon={<CalendarDays size={28} />} title={t('seasons.none')} />
        ) : (
          <>
            {live && (
              <SeasonHero
                season={live}
                t={t}
                lang={lang}
                actions={
                  live.slug ? (
                    <Link href={`${base}/seasons/${live.slug}`}>
                      <Button variant="primary">
                        {t('seasons.details')} <ChevronRight size={16} />
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            )}

            {upcoming.length > 0 && (
              <section>
                <SectionTitle
                  title={<span className="inline-flex items-center gap-2"><CalendarDays size={18} className="text-ink-3" /> {t('seasons.section.upcoming')}</span>}
                  className="mb-5"
                />
                {grid(upcoming)}
              </section>
            )}

            {closed.length > 0 && (
              <section>
                <SectionTitle
                  title={<span className="inline-flex items-center gap-2"><Trophy size={18} className="text-accent-gold" /> {t('seasons.section.archive')}</span>}
                  description={t('seasons.count', { n: closed.length })}
                  className="mb-5"
                />
                {grid(closed)}
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}

function SeasonCard({ season, t, lang }: { season: Season; t: TFn; lang: string }) {
  const base = useSectionBase();
  const accent = seasonAccent(season.color);
  const period = seasonPeriod(season, lang);
  const champion = season.summary?.champion?.team ?? null;
  const inner = (
    <Card hover className="group flex h-full flex-col overflow-hidden !p-0">
      <div className="relative h-32 bg-[#0a0e19]">
        {season.banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={season.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-base group-hover:opacity-100" />
        ) : (
          <div aria-hidden="true" className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${accent} -20%, #0a0e19 75%)` }} />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0a0e19] via-[#0a0e19]/40 to-transparent" />
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} />
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {season.number != null && <p className="eyebrow !text-white/70">{t('seasons.numberLabel', { n: season.number })}</p>}
            <p className="mt-1 truncate font-display text-xl font-bold uppercase leading-none tracking-tight2 text-white">{season.name}</p>
          </div>
          <SeasonStatusBadge status={season.status} t={t} className="shrink-0 bg-black/50" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 text-sm">
        {season.theme && (
          <p className="inline-flex items-center gap-1.5 font-display font-semibold" style={{ color: accent }}>
            <Sparkles size={14} /> {season.theme}
          </p>
        )}
        {season.slogan && <p className="text-xs italic text-ink-2">« {season.slogan} »</p>}
        {period && (
          <p className="inline-flex items-center gap-1.5 text-xs text-ink-3 num">
            <CalendarDays size={12} /> {period}
          </p>
        )}
        {champion && (
          <p className="mt-auto inline-flex items-center gap-2 pt-2 text-xs text-accent-gold">
            <Trophy size={14} />
            {t('seasons.champion')} : <b className="text-ink-1">{champion.name}</b>
          </p>
        )}
        {season.status === 'closed' && season.slug && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-3 transition-colors group-hover:text-primary">
            {t('seasons.viewSummary')} <ChevronRight size={14} />
          </span>
        )}
      </div>
    </Card>
  );
  return season.slug ? (
    <Link href={`${base}/seasons/${season.slug}`} className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
      {inner}
    </Link>
  ) : (
    inner
  );
}
