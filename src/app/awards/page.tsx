'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ChevronDown, Crown, Presentation, Trophy, ExternalLink } from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import BackToTop from '@/components/landing/BackToTop';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useSeasonStore, isLiveSeason, type Season } from '@/store/useSeasonStore';
import { SeasonStatusBadge, seasonShortLabel } from '@/components/seasons/shared';
import {
  AwardCard,
  MvpHero,
  PodiumsBlock,
  SponsorsStrip,
  PlayerAvatar,
  categoryLabel,
  type SeasonAwards,
  type HofSeason,
} from '@/components/awards/shared';

/**
 * Public awards showcase (#46): season selector (closed + current), MVP hero,
 * per-role award cards with transparent criteria, podiums and a history
 * accordion of the closed seasons.
 */
export default function AwardsPage() {
  // `useSearchParams` needs a Suspense boundary for static rendering.
  return (
    <Suspense fallback={null}>
      <AwardsContent />
    </Suspense>
  );
}

function AwardsContent() {
  const t = useT();
  const search = useSearchParams();
  const seasons = useSeasonStore((s) => s.seasons);
  const loaded = useSeasonStore((s) => s.loaded);
  const load = useSeasonStore((s) => s.load);
  const [selected, setSelected] = useState<string | null>(null);
  const [data, setData] = useState<SeasonAwards | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HofSeason[] | null>(null);
  const [openHistory, setOpenHistory] = useState<string | null>(null);

  useEffect(() => {
    load(true);
  }, [load]);

  // Selectable seasons: the live one (current) + the closed ones.
  const options = useMemo(() => seasons.filter((s) => isLiveSeason(s) || s.status === 'closed'), [seasons]);

  useEffect(() => {
    if (!loaded || selected) return;
    const wanted = search?.get('season');
    const fromQuery = wanted ? options.find((s) => s.slug === wanted || s.id === wanted) : null;
    const live = options.find(isLiveSeason);
    const first = fromQuery ?? live ?? options[0] ?? null;
    if (first) setSelected(first.id);
    else setLoading(false);
  }, [loaded, options, selected, search]);

  useEffect(() => {
    if (!selected) return;
    let alive = true;
    setLoading(true);
    api.awards
      .season(selected)
      .then((d: SeasonAwards | null) => {
        if (alive) setData(d && d.season ? d : null);
      })
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [selected]);

  useEffect(() => {
    api.awards
      .hallOfFame()
      .then((d: any) => setHistory(Array.isArray(d?.seasons) ? d.seasons : []))
      .catch(() => setHistory([]));
  }, []);

  const season: Season | null = data?.season ?? options.find((s) => s.id === selected) ?? null;
  const accent = season?.color || '#3c50e0';
  const roleAwards = data?.awards.filter((a) => a.category !== 'mvp') ?? [];

  return (
    <div className="relative min-h-screen">
      <LandingHeader />
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20 space-y-12">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 mb-3">{t('awards.kicker')}</p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white">{t('awards.title')}</h1>
          <p className="text-gray-400 mt-3 max-w-2xl mx-auto">{t('awards.intro')}</p>
        </div>

        {/* Season selector */}
        {options.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {options.map((s) => {
              const active = s.id === selected;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelected(s.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    active ? 'text-black border-transparent' : 'text-gray-300 border-white/15 hover:border-white/40'
                  }`}
                  style={active ? { background: s.color || '#3c50e0', color: '#fff' } : undefined}
                >
                  {seasonShortLabel(s)}
                  {isLiveSeason(s) && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />}
                </button>
              );
            })}
          </div>
        )}

        {loading || !loaded ? (
          <LoadingSpinner size="lg" className="py-24" />
        ) : !season || !data ? (
          <EmptyState icon={<Award size={28} />} title={t('awards.none')} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={season.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-10"
            >
              {/* Season banner */}
              <section className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeasonStatusBadge status={season.status} t={t} />
                    {season.number != null && (
                      <span className="text-xs uppercase tracking-[0.2em] text-gray-500">{t('seasons.numberLabel', { n: season.number })}</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-white mt-1 break-words">{season.name}</h2>
                  {season.theme && (
                    <p className="text-sm font-semibold" style={{ color: accent }}>
                      {season.theme}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {t('awards.count', { n: data.awards.length })} · {t('awards.matches', { n: data.matches.completed })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {season.slug && (
                    <Link
                      href={`/seasons/${season.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-white/15 text-gray-200 hover:border-white/40 transition-colors"
                    >
                      <ExternalLink size={14} /> {t('awards.viewSeason')}
                    </Link>
                  )}
                  {season.slug && (
                    <Link
                      href={`/ceremony/${season.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg text-black font-semibold bg-gradient-to-r from-yellow-300 to-amber-500 hover:brightness-110 transition"
                    >
                      <Presentation size={14} /> {t('awards.ceremony')}
                    </Link>
                  )}
                </div>
              </section>

              {/* MVP */}
              {data.mvp ? (
                <MvpHero award={data.mvp} t={t} accent={accent} />
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-gray-500 text-sm">
                  {isLiveSeason(season) ? t('awards.noneYet') : t('awards.none')}
                </div>
              )}

              {/* Role awards */}
              {roleAwards.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-white inline-flex items-center gap-2">
                      <Award size={20} className="text-yellow-400" /> {t('awards.kicker')}
                    </h2>
                    <p className="text-xs text-gray-500 hidden sm:block">{t('awards.transparency')}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roleAwards.map((a, i) => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i, duration: 0.3 }}
                      >
                        <AwardCard award={a} t={t} accent={accent} />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 sm:hidden">{t('awards.transparency')}</p>
                </section>
              )}

              {/* Podiums */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-white inline-flex items-center gap-2">
                  <Trophy size={20} className="text-yellow-400" /> {t('seasons.summary.podium')}
                </h2>
                <PodiumsBlock podiums={data.podiums} t={t} compact />
              </section>

              <SponsorsStrip sponsors={data.sponsors} t={t} />
            </motion.div>
          </AnimatePresence>
        )}

        {/* History accordion */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white inline-flex items-center gap-2">
            <Crown size={20} className="text-yellow-400" /> {t('awards.history')}
          </h2>
          {history === null ? (
            <LoadingSpinner size="md" className="py-6" />
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500">{t('awards.historyEmpty')}</p>
          ) : (
            <div className="divide-y divide-white/10 rounded-2xl border border-white/10 overflow-hidden">
              {history.map((h) => {
                const open = openHistory === h.season.id;
                return (
                  <div key={h.season.id} className="bg-white/[0.02]">
                    <button
                      type="button"
                      onClick={() => setOpenHistory(open ? null : h.season.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors"
                      aria-expanded={open}
                    >
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: h.season.color || '#3c50e0' }} />
                      <span className="font-semibold text-white truncate">{h.season.name}</span>
                      {h.champion && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-xs text-yellow-400 ml-2">
                          <Trophy size={12} /> {h.champion.name}
                        </span>
                      )}
                      {h.mvp?.user && (
                        <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-gray-400 ml-2">
                          <Crown size={12} className="text-yellow-400" /> {h.mvp.user.displayName || h.mvp.user.username}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-gray-500 shrink-0">{t('awards.count', { n: h.awardsCount })}</span>
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3">
                            {h.awards.length === 0 ? (
                              <p className="text-sm text-gray-500">{t('hof.noAwards')}</p>
                            ) : (
                              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {h.awards.map((a) => (
                                  <li key={a.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 min-w-0">
                                    <PlayerAvatar user={a.user} size="sm" />
                                    <div className="min-w-0">
                                      <p className="text-[11px] uppercase tracking-wider text-gray-500 truncate">{categoryLabel(t, a)}</p>
                                      <p className="text-sm font-semibold text-white truncate">
                                        {a.user ? a.user.displayName || a.user.username : t('awards.noPlayer')}
                                      </p>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="flex flex-wrap gap-3 text-sm">
                              <button type="button" onClick={() => setSelected(h.season.id)} className="text-primary hover:underline">
                                {t('awards.title')}
                              </button>
                              {h.season.slug && (
                                <Link href={`/ceremony/${h.season.slug}`} className="text-yellow-400 hover:underline">
                                  {t('awards.ceremony')}
                                </Link>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <LandingFooter />
      <BackToTop />
    </div>
  );
}
