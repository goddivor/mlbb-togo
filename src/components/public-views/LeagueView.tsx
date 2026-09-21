'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ListOrdered,
  CalendarDays,
  Megaphone,
  Trophy,
  ChevronRight,
  Handshake,
  History,
  Clock,
  Radio,
  Shield,
  Swords,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Badge, Button, Card, EmptyState, SectionTitle, Skeleton, StatCard } from '@/components/ui';
import { MatchScoreline } from '@/components/game';
import { useSectionBase } from '@/components/layout/SectionBase';
import { SeasonHero } from '@/components/seasons/shared';
import type { Season } from '@/store/useSeasonStore';
import { displayStatus, type EsportMatch } from '@/components/matches/shared';
import { SponsorBadge, type FeedPost } from '@/components/forum/PostCard';
import { markdownToText } from '@/lib/markdown';
import { timeAgo } from '@/lib/helpers';
import { fadeUp, stagger, still } from '@/lib/motion';
import LeaguePodium, { type PodiumRow } from '@/components/league/LeaguePodium';
import LeagueStream from '@/components/league/LeagueStream';
import SponsorTiers, { useSponsors } from '@/components/sponsors/SponsorTiers';

function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
      {children} <ChevronRight size={14} />
    </Link>
  );
}

/** League portal landing (issue #55): season theme, podium, results, news, stream, sponsors. */
export function LeagueView() {
  const base = useSectionBase();
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const reduce = useReducedMotion();
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
      .feed({ category: 'announcement', sort: 'latest', limit: 3 })
      .then((d: any) => !cancelled && Array.isArray(d?.items) && setPosts(d.items))
      .catch(() => {});
    api.posts
      .feed({ sort: 'latest', limit: 20 })
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

  const { lastResults, nextMatches, completed, live } = useMemo(() => {
    const now = Date.now();
    const done = matches
      .filter((m) => m.status === 'completed')
      .sort((a, b) => new Date(b.scheduledAt ?? 0).getTime() - new Date(a.scheduledAt ?? 0).getTime());
    const next = matches
      .filter((m) => {
        const st = displayStatus(m, now);
        return st === 'scheduled' || st === 'live';
      })
      .sort((a, b) => {
        const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
        const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
        return ta - tb;
      });
    return {
      lastResults: done.slice(0, 5),
      nextMatches: next.slice(0, 5),
      completed: done.length,
      live: matches.filter((m) => displayStatus(m, now) === 'live').length,
    };
  }, [matches]);

  const news = sponsored && !posts.some((p) => p.id === sponsored.id) ? [...posts.slice(0, 3), sponsored] : posts.slice(0, 3);
  const leader = rows.find((r) => r.rank === 1) ?? null;
  const listVariants = reduce ? still : stagger(0.05);
  const itemVariants = reduce ? still : fadeUp;

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-14 px-4 pb-20 sm:px-6">
        {/* Season theme header */}
        {!ready ? (
          <Skeleton className="h-[22rem] w-full rounded-lg md:h-[26rem]" />
        ) : !season ? (
          <EmptyState icon={<CalendarDays size={28} />} title={t('seasons.none')} />
        ) : (
          <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
            <SeasonHero
              season={season}
              t={t}
              lang={lang}
              eyebrow={`${t('league.kicker')}${season.number != null ? ` · ${t('seasons.numberLabel', { n: season.number })}` : ''}`}
              actions={
                <>
                  <Link href="/dashboard/standings">
                    <Button variant="primary" size="md">
                      <ListOrdered size={16} /> {t('league.cta.standings')}
                    </Button>
                  </Link>
                  <Link href="/dashboard/matches">
                    <Button variant="outline" size="md" className="!border-white/30 !text-white hover:!border-white">
                      <CalendarDays size={16} /> {t('league.cta.calendar')}
                    </Button>
                  </Link>
                  <Link href="/dashboard/forum">
                    <Button variant="outline" size="md" className="!border-white/30 !text-white hover:!border-white">
                      <Megaphone size={16} /> {t('league.cta.news')}
                    </Button>
                  </Link>
                  {season.slug && (
                    <Link href={`${base}/seasons/${season.slug}`}>
                      <Button variant="ghost" size="md" className="!text-white/80 hover:!bg-white/10 hover:!text-white">
                        {t('seasons.details')} <ChevronRight size={16} />
                      </Button>
                    </Link>
                  )}
                </>
              }
            />
            {/* Season pulse */}
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label={t('league.kpi.teams')} value={rows.length} icon={<Shield size={18} />} accent="cyan" />
              <StatCard
                label={t('league.kpi.played')}
                value={completed}
                hint={t('league.kpi.of', { n: matches.length })}
                icon={<Swords size={18} />}
                accent="violet"
              />
              <StatCard label={t('league.kpi.upcoming')} value={Math.max(matches.length - completed, 0)} icon={<Clock size={18} />} accent="green" />
              <StatCard
                label={t('league.kpi.leader')}
                value={<span className="block whitespace-normal break-words text-lg leading-tight sm:text-2xl">{leader ? leader.team.name : '—'}</span>}
                hint={leader ? `${leader.points} pts` : undefined}
                icon={<Trophy size={18} />}
                accent="gold"
              />
            </div>
          </motion.div>
        )}

        {/* Podium */}
        {ready && season && (
          <section>
            <SectionTitle
              title={<span className="inline-flex items-center gap-2"><Trophy size={18} className="text-accent-gold" /> {t('league.podium.title')}</span>}
              action={<MoreLink href="/dashboard/standings">{t('league.seeStandings')}</MoreLink>}
              className="mb-5"
            />
            <Card glow className="p-6 sm:p-10">
              <LeaguePodium rows={rows} t={t} />
            </Card>
          </section>
        )}

        {/* Results + upcoming */}
        {ready && season && (
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="min-w-0">
              <SectionTitle
                title={<span className="inline-flex items-center gap-2"><History size={18} className="text-ink-3" /> {t('league.lastResults')}</span>}
                action={<MoreLink href="/dashboard/matches">{t('league.seeCalendar')}</MoreLink>}
                className="mb-4"
              />
              {lastResults.length === 0 ? (
                <Card className="text-sm text-ink-2">{t('league.noResults')}</Card>
              ) : (
                <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
                  {lastResults.map((m) => (
                    <motion.div key={m.id} variants={itemVariants}>
                      <MatchScoreline match={m} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </section>
            <section className="min-w-0">
              <SectionTitle
                title={
                  <span className="inline-flex items-center gap-2">
                    <Clock size={18} className="text-ink-3" /> {t('league.nextMatches')}
                    {live > 0 && <Badge variant="live" size="sm">{t('matches.status.live')}</Badge>}
                  </span>
                }
                action={<MoreLink href="/dashboard/matches">{t('league.seeCalendar')}</MoreLink>}
                className="mb-4"
              />
              {nextMatches.length === 0 ? (
                <Card className="text-sm text-ink-2">{t('league.noUpcoming')}</Card>
              ) : (
                <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
                  {nextMatches.map((m) => (
                    <motion.div key={m.id} variants={itemVariants}>
                      <MatchScoreline match={m} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </section>
          </div>
        )}

        {/* News + stream */}
        <div className="grid gap-8 lg:grid-cols-5">
          <section className="min-w-0 lg:col-span-2">
            <SectionTitle
              title={<span className="inline-flex items-center gap-2"><Megaphone size={18} className="text-ink-3" /> {t('league.news')}</span>}
              action={<MoreLink href="/dashboard/forum">{t('league.seeNews')}</MoreLink>}
              className="mb-4"
            />
            {news.length === 0 ? (
              <Card className="text-sm text-ink-2">{t('league.noNews')}</Card>
            ) : (
              <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
                {news.map((p) => (
                  <motion.div key={p.id} variants={itemVariants}>
                    <Link href={`/dashboard/forum?post=${p.id}`} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                      <Card hover accent={p.isSponsored ? 'gold' : 'cyan'} className="p-4">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          {p.isSponsored ? (
                            <SponsorBadge sponsor={p.sponsor} t={t} />
                          ) : (
                            <Badge variant="neon" size="sm">{t('league.announcement')}</Badge>
                          )}
                          <span className="text-xs text-ink-3">{timeAgo(p.createdAt)}</span>
                        </div>
                        <h3 className="line-clamp-1 font-display font-bold text-ink-1">{p.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-ink-2">{markdownToText(p.content)}</p>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>
          <section className="min-w-0 lg:col-span-3">
            <SectionTitle
              title={<span className="inline-flex items-center gap-2"><Radio size={18} className="text-ink-3" /> {t('league.stream.title')}</span>}
              action={<MoreLink href="/dashboard/stream">{t('league.stream.all')}</MoreLink>}
              className="mb-4"
            />
            <LeagueStream seasonId={season?.id ?? null} t={t} />
          </section>
        </div>

        {/* Sponsors banner */}
        {sponsors && sponsors.items.length > 0 && (
          <section>
            <SectionTitle
              title={<span className="inline-flex items-center gap-2"><Handshake size={18} className="text-ink-3" /> {t('league.sponsors')}</span>}
              action={<MoreLink href="/sponsors">{t('sponsors.becomeSponsor')}</MoreLink>}
              className="mb-4"
            />
            <Card className="p-6 sm:p-8">
              <SponsorTiers data={sponsors} compact showCta={false} />
            </Card>
          </section>
        )}
      </div>
    </>
  );
}
