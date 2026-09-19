'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ListOrdered,
  CalendarDays,
  Megaphone,
  Trophy,
  Sparkles,
  ChevronRight,
  Flag,
  Handshake,
  History,
  Clock,
  Radio,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Badge, Button, EmptyState, LoadingSpinner } from '@/components/ui';
import PublicShell from '@/components/landing/PublicShell';
import { SeasonStatusBadge, seasonPeriod, fmtSeasonDate } from '@/components/seasons/shared';
import type { Season } from '@/store/useSeasonStore';
import MatchCard from '@/components/matches/MatchCard';
import { displayStatus, type EsportMatch } from '@/components/matches/shared';
import { SponsorBadge, type FeedPost } from '@/components/forum/PostCard';
import { markdownToText } from '@/lib/markdown';
import { timeAgo } from '@/lib/helpers';
import LeaguePodium, { type PodiumRow } from '@/components/league/LeaguePodium';
import LeagueStream from '@/components/league/LeagueStream';
import SponsorTiers, { useSponsors } from '@/components/sponsors/SponsorTiers';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

function SectionTitle({
  icon,
  children,
  href,
  linkLabel,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
        {icon} {children}
      </h2>
      {href && linkLabel && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm text-neon-blue hover:underline">
          {linkLabel} <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

/** League portal landing (issue #55): season theme, podium, results, news, stream, sponsors. */
export default function LeaguePage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const [season, setSeason] = useState<Season | null>(null);
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<PodiumRow[]>([]);
  const [matches, setMatches] = useState<EsportMatch[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [sponsored, setSponsored] = useState<FeedPost | null>(null);
  const sponsors = useSponsors('current');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = (await api.esport.currentSeason()) as Season | null;
        if (cancelled) return;
        setSeason(s);
        if (s?.id) {
          const [standings, calendar] = await Promise.all([
            api.standings.get('current', 'league').catch(() => null),
            api.esport.matchesCalendar({ seasonId: s.id }).catch(() => null),
          ]);
          if (cancelled) return;
          if (standings?.rows) setRows(standings.rows);
          if (calendar?.days) {
            const flat = [...calendar.days.flatMap((d: any) => d.matches), ...(calendar.undated ?? [])];
            setMatches(flat);
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    api.posts
      .feed({ category: 'announcement', sort: 'recent', limit: 3 })
      .then((d: any) => !cancelled && Array.isArray(d?.items) && setPosts(d.items))
      .catch(() => {});
    api.posts
      .feed({ sort: 'recent', limit: 20 })
      .then((d: any) => {
        if (cancelled || !Array.isArray(d?.items)) return;
        const s = d.items.find((p: FeedPost) => p.isSponsored);
        if (s) setSponsored(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const { lastResults, nextMatches } = useMemo(() => {
    const now = Date.now();
    const done = matches
      .filter((m) => m.status === 'completed')
      .sort((a, b) => new Date(b.scheduledAt ?? 0).getTime() - new Date(a.scheduledAt ?? 0).getTime())
      .slice(0, 5);
    const next = matches
      .filter((m) => {
        const st = displayStatus(m, now);
        return st === 'scheduled' || st === 'live';
      })
      .sort((a, b) => {
        const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
        const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
        return ta - tb;
      })
      .slice(0, 5);
    return { lastResults: done, nextMatches: next };
  }, [matches]);

  const accent = season?.color || '#3c50e0';
  const period = season ? seasonPeriod(season, lang) : null;
  const news = sponsored && !posts.some((p) => p.id === sponsored.id) ? [...posts.slice(0, 3), sponsored] : posts.slice(0, 3);

  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 space-y-14">
        {/* Season theme header */}
        {!ready ? (
          <LoadingSpinner size="lg" className="py-24" />
        ) : !season ? (
          <EmptyState icon={<CalendarDays size={28} />} title={t('seasons.none')} />
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-white/10"
            style={{ boxShadow: `0 0 90px -20px ${accent}` }}
          >
            {season.banner ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={season.banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}, #0b0f1a 70%)` }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/25" />
            <div className="relative p-6 sm:p-10 md:p-14 flex flex-col gap-4 min-h-[20rem] justify-end">
              <div className="flex flex-wrap items-center gap-2">
                <SeasonStatusBadge status={season.status} t={t} size="md" className="bg-white/10 backdrop-blur" />
                {season.number != null && (
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                    {t('seasons.numberLabel', { n: season.number })}
                  </span>
                )}
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">{t('league.kicker')}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white drop-shadow">{season.name}</h1>
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
              <div className="mt-3 flex flex-wrap gap-3">
                <Link href="/standings">
                  <Button variant="primary" size="md">
                    <ListOrdered size={16} /> {t('league.cta.standings')}
                  </Button>
                </Link>
                <Link href="/matches">
                  <Button variant="outline" size="md">
                    <CalendarDays size={16} /> {t('league.cta.calendar')}
                  </Button>
                </Link>
                <Link href="/forum">
                  <Button variant="outline" size="md">
                    <Megaphone size={16} /> {t('league.cta.news')}
                  </Button>
                </Link>
                {season.slug && (
                  <Link
                    href={`/seasons/${season.slug}`}
                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                  >
                    {t('seasons.details')} <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* Podium */}
        {ready && season && (
          <motion.section {...fadeUp}>
            <SectionTitle icon={<Trophy size={16} />} href="/standings" linkLabel={t('league.seeStandings')}>
              {t('league.podium.title')}
            </SectionTitle>
            <div className="card-gaming p-6 sm:p-10">
              <LeaguePodium rows={rows} t={t} />
            </div>
          </motion.section>
        )}

        {/* Results + upcoming */}
        {ready && season && (
          <div className="grid lg:grid-cols-2 gap-8">
            <motion.section {...fadeUp}>
              <SectionTitle icon={<History size={16} />} href="/matches" linkLabel={t('league.seeCalendar')}>
                {t('league.lastResults')}
              </SectionTitle>
              {lastResults.length === 0 ? (
                <p className="card-gaming p-6 text-sm text-gray-400">{t('league.noResults')}</p>
              ) : (
                <div className="space-y-3">
                  {lastResults.map((m) => (
                    <MatchCard key={m.id} match={m} t={t} lang={lang} compact />
                  ))}
                </div>
              )}
            </motion.section>
            <motion.section {...fadeUp} transition={{ delay: 0.08 }}>
              <SectionTitle icon={<Clock size={16} />} href="/matches" linkLabel={t('league.seeCalendar')}>
                {t('league.nextMatches')}
              </SectionTitle>
              {nextMatches.length === 0 ? (
                <p className="card-gaming p-6 text-sm text-gray-400">{t('league.noUpcoming')}</p>
              ) : (
                <div className="space-y-3">
                  {nextMatches.map((m) => (
                    <MatchCard key={m.id} match={m} t={t} lang={lang} compact />
                  ))}
                </div>
              )}
            </motion.section>
          </div>
        )}

        {/* News + stream */}
        <div className="grid lg:grid-cols-5 gap-8">
          <motion.section {...fadeUp} className="lg:col-span-2">
            <SectionTitle icon={<Megaphone size={16} />} href="/forum" linkLabel={t('league.seeNews')}>
              {t('league.news')}
            </SectionTitle>
            {news.length === 0 ? (
              <p className="card-gaming p-6 text-sm text-gray-400">{t('league.noNews')}</p>
            ) : (
              <div className="space-y-3">
                {news.map((p) => (
                  <Link
                    key={p.id}
                    href={`/forum?post=${p.id}`}
                    className={`block card-gaming p-4 transition-colors hover:border-neon-blue/50 ${
                      p.isSponsored ? '!border-warning/40' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {p.isSponsored ? (
                        <SponsorBadge sponsor={p.sponsor} t={t} />
                      ) : (
                        <Badge variant="neon" size="sm">{t('league.announcement')}</Badge>
                      )}
                      <span className="text-xs text-gray-500">{timeAgo(p.createdAt)}</span>
                    </div>
                    <h3 className="font-semibold text-white line-clamp-1">{p.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mt-1">{markdownToText(p.content)}</p>
                  </Link>
                ))}
              </div>
            )}
          </motion.section>
          <motion.section {...fadeUp} transition={{ delay: 0.08 }} className="lg:col-span-3">
            <SectionTitle icon={<Radio size={16} />} href="/stream" linkLabel={t('league.stream.all')}>
              {t('league.stream.title')}
            </SectionTitle>
            <LeagueStream seasonId={season?.id ?? null} t={t} />
          </motion.section>
        </div>

        {/* Sponsors banner */}
        {sponsors && sponsors.items.length > 0 && (
          <motion.section {...fadeUp}>
            <SectionTitle icon={<Handshake size={16} />} href="/sponsors" linkLabel={t('sponsors.becomeSponsor')}>
              {t('league.sponsors')}
            </SectionTitle>
            <div className="card-gaming p-6 sm:p-8">
              <SponsorTiers data={sponsors} compact showCta={false} />
            </div>
          </motion.section>
        )}
      </div>
    </PublicShell>
  );
}
