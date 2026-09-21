'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CalendarDays, Camera, Layers, Radio, Star, Swords, Trophy, Video } from 'lucide-react';
import { Button, EmptyState, PageHeader, Skeleton } from '@/components/ui';
import { cn } from '@/lib/helpers';
import { scaleIn, still } from '@/lib/motion';
import GamesBreakdown from '@/components/matches/GamesBreakdown';
import MatchPlayersTable from '@/components/matches/MatchPlayersTable';
import MatchVideo from '@/components/matches/MatchVideo';
import ScreenshotGallery, { GalleryItem } from '@/components/matches/ScreenshotGallery';
import {
  FormatBadge,
  MatchDetail,
  MatchStatusBadge,
  MvpAvatar,
  StageBadge,
  TeamLogo,
  displayStatus,
  fmtDateTime,
  userLabel,
} from '@/components/matches/shared';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { useSeasonStore } from '@/store/useSeasonStore';

export default function MatchDetailPage() {
  const t = useT();
  const reduce = useReducedMotion();
  const lang = useLangStore((s: any) => s.lang) as string;
  const params = useParams();
  const id = String(params?.id || '');
  const seasons = useSeasonStore((s) => s.seasons);
  const loadSeasons = useSeasonStore((s) => s.load);

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState<string | null>(null);

  useEffect(() => {
    void loadSeasons();
  }, [loadSeasons]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    api.esport
      .match(id)
      .then((m: any) => {
        if (!cancelled) setMatch(m && m.id ? m : null);
      })
      .catch(() => {
        if (!cancelled) setMatch(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const season = useMemo(
    () => (match?.seasonId ? seasons.find((s) => s.id === match.seasonId) ?? null : null),
    [match?.seasonId, seasons],
  );

  // Gallery: match screenshots + per-game screenshots (deduplicated).
  const gallery = useMemo<GalleryItem[]>(() => {
    if (!match) return [];
    const items: GalleryItem[] = [];
    const seen = new Set<string>();
    for (const g of match.games) {
      if (g.screenshot && !seen.has(g.screenshot)) {
        seen.add(g.screenshot);
        items.push({ url: g.screenshot, caption: `${t('matches.games.game')} ${g.number}` });
      }
    }
    for (const url of match.screenshots) {
      if (!seen.has(url)) {
        seen.add(url);
        items.push({ url });
      }
    }
    return items;
  }, [match, t]);

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-56 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!match)
    return (
      <div className="space-y-6">
        <PageHeader title={t('matches.detail.title')} breadcrumb={t('matches.title')} />
        <EmptyState
          icon={<Swords size={28} />}
          title={t('matches.detail.notFound')}
          action={
            <Link href="/dashboard/matches">
              <Button size="sm" variant="secondary">
                <ArrowLeft size={14} /> {t('matches.detail.back')}
              </Button>
            </Link>
          }
        />
      </div>
    );

  const status = displayStatus(match);
  const done = status === 'completed';
  const live = status === 'live';
  const aWon = done && match.winnerTeamId === match.teamA?.id;
  const bWon = done && match.winnerTeamId === match.teamB?.id;
  const mvpUser = match.mvp ?? match.mvpStats?.user ?? null;

  const teamBlock = (team: typeof match.teamA, won: boolean, align: 'left' | 'right') => (
    <Link
      href={`/dashboard/teams/${team.id}`}
      className={cn(
        'group flex min-w-0 flex-1 flex-col items-center gap-2 text-center sm:flex-row sm:gap-4',
        align === 'right' ? 'sm:flex-row-reverse sm:text-right' : 'sm:text-left'
      )}
    >
      <TeamLogo team={team} size="xl" className={won ? '!ring-2 !ring-accent-green/60 shadow-glow-cyan' : 'opacity-90'} />
      <div className="min-w-0">
        <p className={cn('break-words font-display text-xl font-bold leading-tight tracking-tight2 transition-colors group-hover:text-primary sm:text-2xl', won || !done ? 'text-ink-1' : 'text-ink-2')}>
          {team.name}
        </p>
        {won && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-eyebrow text-accent-green">
            <Trophy size={12} /> {t('matches.winner')}
          </span>
        )}
      </div>
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={season ? season.name : t('matches.stage.' + match.stage)}
        variant={live ? 'danger' : 'default'}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {match.teamA?.name} <span className="text-ink-3">vs</span> {match.teamB?.name}
          </span>
        }
        subtitle={fmtDateTime(match.scheduledAt, lang) || t('matches.tbd')}
        breadcrumb={t('matches.detail.title')}
        action={
          <Link href="/dashboard/matches">
            <Button size="sm" variant="secondary">
              <ArrowLeft size={14} /> {t('matches.detail.back')}
            </Button>
          </Link>
        }
      />

      {/* Scoreboard */}
      <motion.section
        variants={reduce ? still : scaleIn}
        initial="hidden"
        animate="visible"
        className={cn(
          'relative overflow-hidden rounded-lg border bg-surface-1 p-5 shadow-elev-2 dark:bg-gradient-to-b dark:from-surface-2/60 dark:to-surface-1 sm:p-8',
          live ? 'border-accent-red/50' : 'border-line-subtle'
        )}
      >
        {/* Arena glow behind the score: the one glow element of the page. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(50%_80%_at_50%_0%,rgb(var(--accent-cyan)/0.14),transparent_70%)]" />
        {live && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-accent-red" />}
        <div className="relative mb-6 flex flex-wrap items-center gap-2">
          <MatchStatusBadge match={match} t={t} size="md" />
          <StageBadge stage={match.stage} t={t} size="md" />
          <FormatBadge format={match.format} size="md" />
          {season && (
            <Link
              href={season.slug ? `/dashboard/seasons/${season.slug}` : '/dashboard/seasons'}
              className="inline-flex items-center gap-1 rounded bg-surface-3 px-2.5 py-1.5 text-xs font-semibold text-ink-2 transition-colors hover:text-primary"
            >
              <Layers size={13} /> {season.name}
            </Link>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-sm num text-ink-2">
            <CalendarDays size={14} /> {fmtDateTime(match.scheduledAt, lang) || t('matches.tbd')}
          </span>
        </div>

        <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          {teamBlock(match.teamA, aWon, 'left')}
          <div className="flex shrink-0 flex-col items-center">
            {done || live ? (
              <div className="flex items-center gap-4 font-display num">
                <span className={cn('text-6xl font-bold leading-none tracking-tight2 sm:text-7xl', aWon || live ? 'text-ink-1' : 'text-ink-3')}>
                  {match.scoreA}
                </span>
                <span className="text-sm font-semibold text-ink-3">VS</span>
                <span className={cn('text-6xl font-bold leading-none tracking-tight2 sm:text-7xl', bWon || live ? 'text-ink-1' : 'text-ink-3')}>
                  {match.scoreB}
                </span>
              </div>
            ) : (
              <span className="rounded cut-corners bg-surface-3 px-6 py-2.5 font-display text-2xl font-bold text-ink-2">
                VS
              </span>
            )}
            {match.format && (
              <span className="mt-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{match.format}</span>
            )}
          </div>
          {teamBlock(match.teamB, bWon, 'right')}
        </div>

        {(mvpUser || match.notes) && (
          <div className="relative mt-6 flex flex-col gap-3 border-t border-line-subtle pt-4 sm:flex-row sm:items-center">
            {mvpUser && (
              <Link
                href={`/dashboard/players/${mvpUser.id}`}
                className="tier-gold inline-flex items-center gap-3 rounded px-3 py-2 transition-[filter] hover:brightness-110"
              >
                <MvpAvatar user={mvpUser} t={t} size="md" link={false} />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-eyebrow text-accent-gold">
                    <Star size={11} fill="currentColor" /> {t('matches.mvp')}
                  </span>
                  <span className="block truncate font-display text-sm font-bold text-ink-1">{userLabel(mvpUser)}</span>
                  {match.mvpStats && (
                    <span className="block text-xs num text-ink-2">
                      {match.mvpStats.hero ? `${match.mvpStats.hero} · ` : ''}
                      {match.mvpStats.kills}/{match.mvpStats.deaths}/{match.mvpStats.assists}
                    </span>
                  )}
                </span>
              </Link>
            )}
            {match.notes && <p className="text-sm text-ink-2 sm:ml-auto sm:max-w-md">{match.notes}</p>}
          </div>
        )}
      </motion.section>

      {/* Games + video */}
      {(match.games.length > 0 || match.vodUrl || match.streamUrl) && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {match.games.length > 0 && (
            <section className={match.vodUrl || match.streamUrl ? 'xl:col-span-1' : 'xl:col-span-3'}>
              <h3 className="eyebrow mb-3 flex items-center gap-1.5"><Swords size={12} /> {t('matches.games.title')}</h3>
              <GamesBreakdown match={match} games={match.games} t={t} onOpenScreenshot={(url) => setGalleryOpen(url)} />
            </section>
          )}
          {(match.vodUrl || match.streamUrl) && (
            <section className={`space-y-4 ${match.games.length > 0 ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
              <h3 className="eyebrow mb-3 flex items-center gap-1.5">{live && match.streamUrl ? <Radio size={12} className="text-accent-red" /> : <Video size={12} />} {t('matches.links.title')}</h3>
              {match.streamUrl && (live || !match.vodUrl) && <MatchVideo url={match.streamUrl} kind="stream" t={t} />}
              {match.vodUrl && <MatchVideo url={match.vodUrl} kind="vod" t={t} />}
              {match.streamUrl && match.vodUrl && !live && (
                <a
                  href={match.streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <Radio size={14} /> {t('matches.links.stream')}
                </a>
              )}
            </section>
          )}
        </div>
      )}

      {/* Screenshots */}
      {gallery.length > 0 && (
        <section>
          <h3 className="eyebrow mb-3 flex items-center gap-1.5"><Camera size={12} /> {t('matches.screenshots.title')} <span className="num">({gallery.length})</span></h3>
          <ScreenshotGallery items={gallery} t={t} openUrl={galleryOpen} onOpenHandled={() => setGalleryOpen(null)} />
        </section>
      )}

      {/* Player stats */}
      <section>
        <h3 className="eyebrow mb-3 flex items-center gap-1.5"><Star size={12} /> {t('matches.players.title')}</h3>
        {match.players.teamA.length === 0 && match.players.teamB.length === 0 ? (
          <EmptyState icon={<Star size={24} />} title={t('matches.players.none')} description={t('matches.players.noneHint')} />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <MatchPlayersTable team={match.teamA} players={match.players.teamA} won={aWon} t={t} />
            <MatchPlayersTable team={match.teamB} players={match.players.teamB} won={bWon} t={t} />
          </div>
        )}
      </section>
    </div>
  );
}
