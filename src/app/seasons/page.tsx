'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CalendarDays, Trophy, Sparkles, ChevronRight, Flag } from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import BackToTop from '@/components/landing/BackToTop';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { useSeasonStore, isLiveSeason, type Season } from '@/store/useSeasonStore';
import { SeasonStatusBadge, seasonPeriod, fmtSeasonDate } from '@/components/seasons/shared';

/** Public list of league seasons: the live one as a themed banner, then the archive. */
export default function SeasonsPage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
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

  return (
    <div className="relative min-h-screen">
      <LandingHeader />
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20 space-y-12">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 mb-3">{t('seasons.kicker')}</p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white">{t('seasons.title')}</h1>
          <p className="text-gray-400 mt-3 max-w-2xl mx-auto">{t('seasons.intro')}</p>
        </div>

        {!ready || !loaded ? (
          <LoadingSpinner size="lg" className="py-24" />
        ) : seasons.length === 0 ? (
          <EmptyState icon={<CalendarDays size={28} />} title={t('seasons.none')} />
        ) : (
          <>
            {live && <LiveBanner season={live} t={t} lang={lang} />}

            {upcoming.length > 0 && (
              <section>
                <SectionTitle icon={<CalendarDays size={16} />}>{t('seasons.section.upcoming')}</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcoming.map((s) => (
                    <SeasonCard key={s.id} season={s} t={t} lang={lang} />
                  ))}
                </div>
              </section>
            )}

            {closed.length > 0 && (
              <section>
                <SectionTitle icon={<Trophy size={16} />}>{t('seasons.section.archive')}</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {closed.map((s) => (
                    <SeasonCard key={s.id} season={s} t={t} lang={lang} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <LandingFooter />
      <BackToTop />
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
      {icon} {children}
    </h2>
  );
}

function LiveBanner({ season, t, lang }: { season: Season; t: (k: string, p?: any) => string; lang: string }) {
  const accent = season.color || '#3c50e0';
  const period = seasonPeriod(season, lang);
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-white/10"
      style={{ boxShadow: `0 0 80px -20px ${accent}` }}
    >
      {season.banner ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={season.banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}, #0b0f1a 70%)` }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
      <div className="relative p-6 sm:p-10 md:p-14 flex flex-col gap-4 min-h-[18rem] justify-end">
        <div className="flex flex-wrap items-center gap-2">
          <SeasonStatusBadge status={season.status} t={t} size="md" className="bg-white/10 backdrop-blur" />
          {season.number != null && (
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
              {t('seasons.numberLabel', { n: season.number })}
            </span>
          )}
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white drop-shadow">{season.name}</h2>
        {season.theme && (
          <p className="inline-flex items-center gap-2 text-lg sm:text-2xl font-semibold" style={{ color: accent }}>
            <Sparkles size={20} /> {season.theme}
          </p>
        )}
        {season.slogan && <p className="text-white/80 italic text-base sm:text-lg max-w-2xl">« {season.slogan} »</p>}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/70">
          {period && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} /> {period}
            </span>
          )}
          {season.playoffsStartDate && (
            <span className="inline-flex items-center gap-1.5">
              <Flag size={14} /> {t('seasons.playoffsFrom', { date: fmtSeasonDate(season.playoffsStartDate, lang) || '' })}
            </span>
          )}
        </div>
        {season.slug && (
          <Link
            href={`/seasons/${season.slug}`}
            className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
          >
            {t('seasons.details')} <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </motion.section>
  );
}

function SeasonCard({ season, t, lang }: { season: Season; t: (k: string, p?: any) => string; lang: string }) {
  const accent = season.color || '#3c50e0';
  const period = seasonPeriod(season, lang);
  const champion = season.summary?.champion?.team ?? null;
  const inner = (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/25 transition-colors h-full flex flex-col">
      <div className="relative h-28">
        {season.banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={season.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}aa, #0b0f1a)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute left-4 right-4 bottom-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {season.number != null && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                {t('seasons.numberLabel', { n: season.number })}
              </p>
            )}
            <p className="text-lg font-bold text-white truncate">{season.name}</p>
          </div>
          <SeasonStatusBadge status={season.status} t={t} className="shrink-0 bg-black/50" />
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1 text-sm">
        {season.theme && (
          <p className="font-semibold inline-flex items-center gap-1.5" style={{ color: accent }}>
            <Sparkles size={14} /> {season.theme}
          </p>
        )}
        {season.slogan && <p className="text-gray-400 italic text-xs">« {season.slogan} »</p>}
        {period && (
          <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <CalendarDays size={12} /> {period}
          </p>
        )}
        {champion && (
          <p className="mt-auto pt-2 inline-flex items-center gap-2 text-xs text-yellow-400">
            <Trophy size={14} />
            {t('seasons.champion')} : <b className="text-white">{champion.name}</b>
          </p>
        )}
        {season.status === 'closed' && season.slug && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 group-hover:text-white transition-colors">
            {t('seasons.viewSummary')} <ChevronRight size={14} />
          </span>
        )}
      </div>
    </div>
  );
  return season.slug ? (
    <Link href={`/seasons/${season.slug}`} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}
