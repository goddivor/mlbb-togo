'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Award, ChevronDown, Crown, Presentation, Trophy, ExternalLink } from 'lucide-react';
import PublicShell from '@/components/landing/PublicShell';
import { Button, Card, EmptyState, SectionTitle, Skeleton, Tabs } from '@/components/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { useSeasonStore, isLiveSeason, type Season } from '@/store/useSeasonStore';
import { fadeUp, stagger, still } from '@/lib/motion';
import { SeasonHero, seasonAccent, seasonShortLabel } from '@/components/seasons/shared';
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
  const lang = useLangStore((s: any) => s.lang);
  const reduce = useReducedMotion();
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
  const accent = season ? seasonAccent(season.color) : undefined;
  const roleAwards = data?.awards.filter((a) => a.category !== 'mvp') ?? [];
  const listVariants = reduce ? still : stagger(0.05);
  const itemVariants = reduce ? still : fadeUp;

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl space-y-12 px-4 pb-20 sm:px-6">
        <header className="max-w-2xl">
          <p className="eyebrow mb-3">{t('awards.kicker')}</p>
          <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight2 text-ink-1 sm:text-6xl">{t('awards.title')}</h1>
          <p className="mt-4 text-base text-ink-2">{t('awards.intro')}</p>
        </header>

        {/* Season selector */}
        {options.length > 0 && (
          <div className="overflow-x-auto whitespace-nowrap">
            <Tabs
              variant="underline"
              tabs={options.map((s) => ({
                id: s.id,
                label: (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: seasonAccent(s.color) }} />
                    {seasonShortLabel(s)}
                    {isLiveSeason(s) && <span className="live-dot text-accent-green" aria-hidden="true" />}
                  </span>
                ),
              }))}
              active={selected ?? ''}
              onChange={(id) => setSelected(id)}
            />
          </div>
        )}

        {loading || !loaded ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : !season || !data ? (
          <EmptyState icon={<Award size={28} />} title={t('awards.none')} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={season.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-10"
            >
              {/* Season banner */}
              <SeasonHero
                season={season}
                t={t}
                lang={lang}
                size="md"
                meta={
                  <span className="num">
                    {t('awards.count', { n: data.awards.length })} · {t('awards.matches', { n: data.matches.completed })}
                  </span>
                }
                actions={
                  season.slug ? (
                    <>
                      <Link href={`/ceremony/${season.slug}`}>
                        <Button variant="primary">
                          <Presentation size={16} /> {t('awards.ceremony')}
                        </Button>
                      </Link>
                      <Link href={`/seasons/${season.slug}`}>
                        <Button variant="outline" className="!border-white/30 !text-white hover:!border-white">
                          <ExternalLink size={16} /> {t('awards.viewSeason')}
                        </Button>
                      </Link>
                    </>
                  ) : undefined
                }
              />

              {/* MVP */}
              {data.mvp ? (
                <MvpHero award={data.mvp} t={t} accent={accent} />
              ) : (
                <Card className="border-dashed text-center text-sm text-ink-3">
                  {isLiveSeason(season) ? t('awards.noneYet') : t('awards.none')}
                </Card>
              )}

              {/* Role awards */}
              {roleAwards.length > 0 && (
                <section>
                  <SectionTitle
                    title={<span className="inline-flex items-center gap-2"><Award size={20} className="text-accent-gold" /> {t('awards.kicker')}</span>}
                    description={t('awards.transparency')}
                    className="mb-5"
                  />
                  <motion.div variants={listVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {roleAwards.map((a) => (
                      <motion.div key={a.id} variants={itemVariants} className="h-full">
                        <AwardCard award={a} t={t} accent={accent} />
                      </motion.div>
                    ))}
                  </motion.div>
                </section>
              )}

              {/* Podiums */}
              <section>
                <SectionTitle
                  title={<span className="inline-flex items-center gap-2"><Trophy size={20} className="text-accent-gold" /> {t('seasons.summary.podium')}</span>}
                  className="mb-5"
                />
                <PodiumsBlock podiums={data.podiums} t={t} compact />
              </section>

              <SponsorsStrip sponsors={data.sponsors} t={t} />
            </motion.div>
          </AnimatePresence>
        )}

        {/* History accordion */}
        <section>
          <SectionTitle
            title={<span className="inline-flex items-center gap-2"><Crown size={20} className="text-accent-gold" /> {t('awards.history')}</span>}
            className="mb-5"
          />
          {history === null ? (
            <Skeleton lines={3} />
          ) : history.length === 0 ? (
            <p className="text-sm text-ink-3">{t('awards.historyEmpty')}</p>
          ) : (
            <Card className="divide-y divide-line-subtle overflow-hidden !p-0">
              {history.map((h) => {
                const open = openHistory === h.season.id;
                return (
                  <div key={h.season.id}>
                    <button
                      type="button"
                      onClick={() => setOpenHistory(open ? null : h.season.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                      aria-expanded={open}
                    >
                      <span className="h-6 w-1 shrink-0 -skew-x-12 rounded-sm" style={{ background: seasonAccent(h.season.color) }} />
                      <span className="truncate font-display font-bold text-ink-1">{h.season.name}</span>
                      {h.champion && (
                        <span className="ml-2 hidden items-center gap-1 text-xs text-accent-gold sm:inline-flex">
                          <Trophy size={12} /> {h.champion.name}
                        </span>
                      )}
                      {h.mvp?.user && (
                        <span className="ml-2 hidden items-center gap-1.5 text-xs text-ink-2 md:inline-flex">
                          <Crown size={12} className="text-accent-gold" /> {h.mvp.user.displayName || h.mvp.user.username}
                        </span>
                      )}
                      <span className="ml-auto shrink-0 text-xs text-ink-3 num">{t('awards.count', { n: h.awardsCount })}</span>
                      <ChevronDown size={16} className={`text-ink-3 transition-transform duration-fast ${open ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 px-4 pb-4">
                            {h.awards.length === 0 ? (
                              <p className="text-sm text-ink-3">{t('hof.noAwards')}</p>
                            ) : (
                              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {h.awards.map((a) => (
                                  <li key={a.id} className="flex min-w-0 items-center gap-3 rounded border border-line-subtle bg-surface-2/60 px-3 py-2">
                                    <PlayerAvatar user={a.user} size="sm" />
                                    <div className="min-w-0">
                                      <p className="truncate text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{categoryLabel(t, a)}</p>
                                      <p className="truncate text-sm font-semibold text-ink-1">
                                        {a.user ? a.user.displayName || a.user.username : t('awards.noPlayer')}
                                      </p>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm">
                              <button type="button" onClick={() => setSelected(h.season.id)} className="font-medium text-primary hover:underline">
                                {t('awards.title')}
                              </button>
                              {h.season.slug && (
                                <Link href={`/ceremony/${h.season.slug}`} className="font-medium text-accent-gold hover:underline">
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
            </Card>
          )}
        </section>
      </div>
    </PublicShell>
  );
}
