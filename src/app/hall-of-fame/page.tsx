'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Crown, Presentation, Trophy, ExternalLink, Award, Lock } from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import BackToTop from '@/components/landing/BackToTop';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { SeasonPodium, seasonPeriod, fmtSeasonDate } from '@/components/seasons/shared';
import { PlayerAvatar, TeamChip, categoryLabel, SponsorsStrip, type HofSeason } from '@/components/awards/shared';

/**
 * Hall of Fame (#47): one card per closed season with the theme banner,
 * both podiums, the MVP, the awards, the sponsors and links to the season
 * page and to the ceremony.
 */
export default function HallOfFamePage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const [items, setItems] = useState<HofSeason[] | null>(null);

  useEffect(() => {
    api.awards
      .hallOfFame()
      .then((d: any) => setItems(Array.isArray(d?.seasons) ? d.seasons : []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="relative min-h-screen">
      <LandingHeader />
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20 space-y-12">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 mb-3">{t('hof.kicker')}</p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white inline-flex items-center gap-3">
            <Crown className="text-yellow-400" size={36} /> {t('hof.title')}
          </h1>
          <p className="text-gray-400 mt-3 max-w-2xl mx-auto">{t('hof.intro')}</p>
        </div>

        {items === null ? (
          <LoadingSpinner size="lg" className="py-24" />
        ) : items.length === 0 ? (
          <EmptyState icon={<Trophy size={28} />} title={t('hof.none')} />
        ) : (
          <div className="space-y-10">
            {items.map((h, i) => (
              <motion.div
                key={h.season.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.4, delay: Math.min(i, 3) * 0.05 }}
              >
                <HofCard item={h} t={t} lang={lang} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <LandingFooter />
      <BackToTop />
    </div>
  );
}

function HofCard({ item, t, lang }: { item: HofSeason; t: (k: string, p?: any) => string; lang: string }) {
  const s = item.season;
  const accent = s.color || '#3c50e0';
  const period = seasonPeriod(s, lang);
  const closedOn = fmtSeasonDate(s.closedAt, lang);
  return (
    <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]" style={{ boxShadow: `0 0 80px -30px ${accent}` }}>
      {/* Theme banner */}
      <div className="relative min-h-[11rem] overflow-hidden">
        {s.banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${accent}, #0b0f1a 75%)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end gap-4 justify-between min-h-[11rem]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
              {s.number != null && <span className="uppercase tracking-[0.25em] font-semibold">{t('seasons.numberLabel', { n: s.number })}</span>}
              {period && <span>{s.number != null ? '· ' : ''}{period}</span>}
              {closedOn && (
                <span className="inline-flex items-center gap-1">
                  <Lock size={11} /> {t('seasons.closedOn', { date: closedOn })}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white drop-shadow mt-1">{s.name}</h2>
            {s.theme && (
              <p className="font-semibold" style={{ color: accent }}>
                {s.theme}
              </p>
            )}
          </div>
          {item.champion && (
            <div className="shrink-0 flex items-center gap-3 rounded-2xl bg-black/50 backdrop-blur px-4 py-3 border border-yellow-400/40">
              {item.champion.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.champion.image} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-yellow-400" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-yellow-400/20 text-yellow-300 flex items-center justify-center font-bold">
                  {item.champion.name?.[0]}
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-yellow-400 inline-flex items-center gap-1">
                  <Trophy size={11} /> {t('hof.champion')}
                </p>
                <p className="font-bold text-white">{item.champion.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* Podiums */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(['regular', 'playoffs'] as const).map((key) => (
            <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
                  <Trophy size={14} className="text-yellow-400" /> {t('awards.podium.' + key)}
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-gray-500">{t('awards.source.' + item.podiums.source[key])}</span>
              </div>
              {item.podiums[key].length ? (
                <SeasonPodium podium={item.podiums[key] as any} t={t} compact />
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">{t('awards.podium.none')}</p>
              )}
            </div>
          ))}
        </div>

        {/* MVP + awards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-500/5 p-5 flex items-center gap-4">
            {item.mvp ? (
              <>
                <PlayerAvatar user={item.mvp.user} size="lg" className="ring-yellow-400/60" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-yellow-400 inline-flex items-center gap-1">
                    <Crown size={11} /> {t('hof.mvp')}
                  </p>
                  <p className="font-black text-white text-lg truncate">
                    {item.mvp.user ? item.mvp.user.displayName || item.mvp.user.username : t('awards.noPlayer')}
                  </p>
                  <TeamChip team={item.mvp.team} t={t} />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">{t('hof.noAwards')}</p>
            )}
          </div>
          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 inline-flex items-center gap-1 mb-3">
              <Award size={11} /> {t('awards.kicker')} · {t('awards.count', { n: item.awardsCount })}
            </p>
            {item.awards.filter((a) => a.category !== 'mvp').length === 0 ? (
              <p className="text-sm text-gray-500">{t('hof.noAwards')}</p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {item.awards
                  .filter((a) => a.category !== 'mvp')
                  .map((a) => (
                    <li key={a.id} className="flex items-center gap-3 min-w-0">
                      <PlayerAvatar user={a.user} size="sm" />
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider text-gray-500 truncate">{categoryLabel(t, a)}</p>
                        <p className="text-sm font-semibold text-white truncate">
                          {a.user ? a.user.displayName || a.user.username : a.team?.name || t('awards.noPlayer')}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sponsors + links */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          {item.sponsors.length ? (
            <SponsorsStrip sponsors={item.sponsors} t={t} />
          ) : (
            <p className="text-xs text-gray-500">{t('hof.noSponsors')}</p>
          )}
          <div className="flex flex-wrap gap-2 shrink-0">
            {s.slug && (
              <Link
                href={`/seasons/${s.slug}`}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-white/15 text-gray-200 hover:border-white/40 transition-colors"
              >
                <ExternalLink size={14} /> {t('hof.recap')}
              </Link>
            )}
            {s.slug && (
              <Link
                href={`/awards?season=${s.slug}`}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-white/15 text-gray-200 hover:border-white/40 transition-colors"
              >
                <Award size={14} /> {t('awards.title')}
              </Link>
            )}
            {s.slug && (
              <Link
                href={`/ceremony/${s.slug}`}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg text-black font-semibold bg-gradient-to-r from-yellow-300 to-amber-500 hover:brightness-110 transition"
              >
                <Presentation size={14} /> {t('hof.openCeremony')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
