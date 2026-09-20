'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Crown, Presentation, Trophy, ExternalLink, Award } from 'lucide-react';
import PublicShell from '@/components/landing/PublicShell';
import { Button, Card, EmptyState, Skeleton, StatCard } from '@/components/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { fadeUp, stagger, still } from '@/lib/motion';
import { SeasonHero, SeasonPodium, seasonAccent, type TFn } from '@/components/seasons/shared';
import { PlayerAvatar, TeamChip, categoryLabel, SponsorsStrip, type HofSeason } from '@/components/awards/shared';

/**
 * Hall of Fame (#47): one card per closed season with the theme banner,
 * both podiums, the MVP, the awards, the sponsors and links to the season
 * page and to the ceremony.
 */
export default function HallOfFamePage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const reduce = useReducedMotion();
  const [items, setItems] = useState<HofSeason[] | null>(null);

  useEffect(() => {
    api.awards
      .hallOfFame()
      .then((d: any) => setItems(Array.isArray(d?.seasons) ? d.seasons : []))
      .catch(() => setItems([]));
  }, []);

  const champions = items ? new Set(items.map((h) => h.champion?.id).filter(Boolean)).size : 0;
  const awards = items ? items.reduce((n, h) => n + h.awardsCount, 0) : 0;

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl space-y-12 px-4 pb-20 sm:px-6">
        <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">{t('hof.kicker')}</p>
            <h1 className="inline-flex items-center gap-4 font-display text-4xl font-bold uppercase leading-none tracking-tight2 text-ink-1 sm:text-6xl">
              <Crown className="shrink-0 text-accent-gold" size={44} /> {t('hof.title')}
            </h1>
            <p className="mt-4 text-base text-ink-2">{t('hof.intro')}</p>
          </div>
          {items && items.length > 0 && (
            <div className="grid w-full grid-cols-3 gap-3 lg:w-auto lg:min-w-[26rem]">
              <StatCard label={t('hof.kpi.seasons')} value={items.length} accent="cyan" />
              <StatCard label={t('hof.kpi.champions')} value={champions} accent="gold" />
              <StatCard label={t('hof.kpi.awards')} value={awards} accent="violet" />
            </div>
          )}
        </header>

        {items === null ? (
          <div className="space-y-6">
            <Skeleton className="h-[16rem] w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={<Trophy size={28} />} title={t('hof.none')} />
        ) : (
          <motion.ol
            variants={reduce ? still : stagger(0.08)}
            initial="hidden"
            animate="visible"
            className="relative space-y-12 border-l border-line-subtle pl-6 sm:pl-10"
          >
            {items.map((h, i) => (
              <motion.li key={h.season.id} variants={reduce ? still : fadeUp} className="relative">
                {/* Timeline marker */}
                <span
                  aria-hidden="true"
                  className="absolute -left-6 top-6 flex h-6 w-6 -translate-x-1/2 -skew-x-12 items-center justify-center rounded-sm font-display text-[11px] font-bold text-black sm:-left-10"
                  style={{ background: seasonAccent(h.season.color) }}
                >
                  {items.length - i}
                </span>
                <HofCard item={h} t={t} lang={lang} />
              </motion.li>
            ))}
          </motion.ol>
        )}
      </div>
    </PublicShell>
  );
}

function HofCard({ item, t, lang }: { item: HofSeason; t: TFn; lang: string }) {
  const s = item.season;
  const roleAwards = item.awards.filter((a) => a.category !== 'mvp');
  return (
    <article className="space-y-6">
      <SeasonHero
        season={s}
        t={t}
        lang={lang}
        size="md"
        eyebrow={s.number != null ? t('seasons.numberLabel', { n: s.number }) : t('hof.kicker')}
        actions={
          s.slug ? (
            <>
              <Link href={`/ceremony/${s.slug}`}>
                <Button variant="primary" size="sm">
                  <Presentation size={14} /> {t('hof.openCeremony')}
                </Button>
              </Link>
              <Link href={`/seasons/${s.slug}`}>
                <Button variant="outline" size="sm" className="!border-white/30 !text-white hover:!border-white">
                  <ExternalLink size={14} /> {t('hof.recap')}
                </Button>
              </Link>
              <Link href={`/awards?season=${s.slug}`}>
                <Button variant="outline" size="sm" className="!border-white/30 !text-white hover:!border-white">
                  <Award size={14} /> {t('awards.title')}
                </Button>
              </Link>
            </>
          ) : undefined
        }
        aside={
          item.champion ? (
            <Link
              href={`/teams/${item.champion.id}`}
              className="flex items-center gap-3 rounded-md border border-accent-gold/40 bg-black/50 px-4 py-3 backdrop-blur transition-colors hover:border-accent-gold"
            >
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded cut-corners-sm tier-gold">
                {item.champion.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.champion.image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display font-bold">{item.champion.name?.[0]}</span>
                )}
              </span>
              <div>
                <p className="eyebrow inline-flex items-center gap-1 !text-accent-gold">
                  <Trophy size={11} /> {t('hof.champion')}
                </p>
                <p className="font-display font-bold text-white">{item.champion.name}</p>
              </div>
            </Link>
          ) : undefined
        }
      />

      {/* Podiums */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(['regular', 'playoffs'] as const).map((key) => (
          <Card key={key} className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="inline-flex items-center gap-2 font-display font-bold text-ink-1">
                <Trophy size={14} className="text-accent-gold" /> {t('awards.podium.' + key)}
              </h3>
              <span className="eyebrow !text-ink-3">{t('awards.source.' + item.podiums.source[key])}</span>
            </div>
            {item.podiums[key].length ? (
              <SeasonPodium podium={item.podiums[key] as any} t={t} compact linkTeams />
            ) : (
              <p className="py-4 text-center text-sm text-ink-3">{t('awards.podium.none')}</p>
            )}
          </Card>
        ))}
      </div>

      {/* MVP + awards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card accent="gold" className="flex items-center gap-4 p-5">
          {item.mvp ? (
            <>
              <PlayerAvatar user={item.mvp.user} size="lg" className="ring-accent-gold/60" />
              <div className="min-w-0">
                <p className="eyebrow inline-flex items-center gap-1 !text-accent-gold">
                  <Crown size={11} /> {t('hof.mvp')}
                </p>
                <p className="mt-1 truncate font-display text-lg font-bold text-ink-1">
                  {item.mvp.user ? item.mvp.user.displayName || item.mvp.user.username : t('awards.noPlayer')}
                </p>
                <TeamChip team={item.mvp.team} t={t} />
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-3">{t('hof.noAwards')}</p>
          )}
        </Card>
        <Card className="p-5 md:col-span-2">
          <p className="eyebrow mb-3 inline-flex items-center gap-1 !text-ink-3">
            <Award size={11} /> {t('awards.kicker')} · <span className="num">{t('awards.count', { n: item.awardsCount })}</span>
          </p>
          {roleAwards.length === 0 ? (
            <p className="text-sm text-ink-3">{t('hof.noAwards')}</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {roleAwards.map((a) => (
                <li key={a.id} className="flex min-w-0 items-center gap-3">
                  <PlayerAvatar user={a.user} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{categoryLabel(t, a)}</p>
                    <p className="truncate text-sm font-semibold text-ink-1">
                      {a.user ? a.user.displayName || a.user.username : a.team?.name || t('awards.noPlayer')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {item.sponsors.length ? <SponsorsStrip sponsors={item.sponsors} t={t} /> : <p className="text-xs text-ink-3">{t('hof.noSponsors')}</p>}
    </article>
  );
}
