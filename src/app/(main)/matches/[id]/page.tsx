'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, Camera, Layers, Radio, Star, Swords, Trophy, Video } from 'lucide-react';
import { Button, EmptyState, LoadingSpinner, PageHeader } from '@/components/ui';
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

  if (loading) return <LoadingSpinner size="lg" className="py-24" />;

  if (!match)
    return (
      <div className="space-y-6">
        <PageHeader title={t('matches.detail.title')} breadcrumb={t('matches.title')} />
        <EmptyState
          icon={<Swords size={28} />}
          title={t('matches.detail.notFound')}
          action={
            <Link href="/matches">
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
      href={`/teams/${team.id}`}
      className={`flex min-w-0 flex-1 flex-col items-center gap-2 text-center sm:flex-row sm:gap-4 ${
        align === 'right' ? 'sm:flex-row-reverse sm:text-right' : 'sm:text-left'
      }`}
    >
      <TeamLogo team={team} size="xl" className={won ? 'ring-4 ring-success/40' : ''} />
      <div className="min-w-0">
        <p className={`break-words text-lg font-bold leading-tight sm:text-xl ${won ? 'text-success' : 'text-black dark:text-white'}`}>
          {team.name}
        </p>
        {won && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
            <Trophy size={12} /> {t('matches.winner')}
          </span>
        )}
      </div>
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {match.teamA?.name} <span className="text-bodydark2">vs</span> {match.teamB?.name}
          </span>
        }
        subtitle={fmtDateTime(match.scheduledAt, lang) || t('matches.tbd')}
        breadcrumb={t('matches.detail.title')}
        action={
          <Link href="/matches">
            <Button size="sm" variant="secondary">
              <ArrowLeft size={14} /> {t('matches.detail.back')}
            </Button>
          </Link>
        }
      />

      {/* Scoreboard */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-sm border bg-white p-5 shadow-default dark:bg-boxdark sm:p-8 ${
          live ? 'border-danger/60' : 'border-stroke dark:border-strokedark'
        }`}
      >
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <MatchStatusBadge match={match} t={t} size="md" />
          <StageBadge stage={match.stage} t={t} size="md" />
          <FormatBadge format={match.format} size="md" />
          {season && (
            <Link
              href={season.slug ? `/seasons/${season.slug}` : '/seasons'}
              className="inline-flex items-center gap-1 rounded-full bg-gray-2 px-2.5 py-1 text-sm text-body hover:text-primary dark:bg-meta-4 dark:text-bodydark"
            >
              <Layers size={13} /> {season.name}
            </Link>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-sm text-body dark:text-bodydark">
            <CalendarDays size={14} /> {fmtDateTime(match.scheduledAt, lang) || t('matches.tbd')}
          </span>
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          {teamBlock(match.teamA, aWon, 'left')}
          <div className="flex shrink-0 flex-col items-center">
            {done || live ? (
              <div className="flex items-center gap-3">
                <span className={`text-5xl font-black tabular-nums ${aWon ? 'text-success' : 'text-black dark:text-white'}`}>
                  {match.scoreA}
                </span>
                <span className="text-2xl font-bold text-bodydark2">:</span>
                <span className={`text-5xl font-black tabular-nums ${bWon ? 'text-success' : 'text-black dark:text-white'}`}>
                  {match.scoreB}
                </span>
              </div>
            ) : (
              <span className="rounded-sm bg-gray-2 px-5 py-2 text-lg font-black text-body dark:bg-meta-4 dark:text-bodydark">
                VS
              </span>
            )}
            {match.format && (
              <span className="mt-1 text-xs uppercase tracking-wider text-bodydark2">{match.format}</span>
            )}
          </div>
          {teamBlock(match.teamB, bWon, 'right')}
        </div>

        {(mvpUser || match.notes) && (
          <div className="mt-6 flex flex-col gap-3 border-t border-stroke pt-4 dark:border-strokedark sm:flex-row sm:items-center">
            {mvpUser && (
              <Link
                href={`/players/${mvpUser.id}`}
                className="inline-flex items-center gap-3 rounded-sm border border-warning/30 bg-warning/10 px-3 py-2 hover:border-warning"
              >
                <MvpAvatar user={mvpUser} t={t} size="md" link={false} />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-warning">
                    <Star size={11} fill="currentColor" /> {t('matches.mvp')}
                  </span>
                  <span className="block truncate text-sm font-bold text-black dark:text-white">{userLabel(mvpUser)}</span>
                  {match.mvpStats && (
                    <span className="block text-xs text-body dark:text-bodydark">
                      {match.mvpStats.hero ? `${match.mvpStats.hero} · ` : ''}
                      {match.mvpStats.kills}/{match.mvpStats.deaths}/{match.mvpStats.assists}
                    </span>
                  )}
                </span>
              </Link>
            )}
            {match.notes && <p className="text-sm text-body dark:text-bodydark sm:ml-auto sm:max-w-md">{match.notes}</p>}
          </div>
        )}
      </motion.section>

      {/* Games + video */}
      {(match.games.length > 0 || match.vodUrl || match.streamUrl) && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {match.games.length > 0 && (
            <section className={match.vodUrl || match.streamUrl ? 'xl:col-span-1' : 'xl:col-span-3'}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-body dark:text-bodydark">
                <Swords size={14} /> {t('matches.games.title')}
              </h3>
              <GamesBreakdown match={match} games={match.games} t={t} onOpenScreenshot={(url) => setGalleryOpen(url)} />
            </section>
          )}
          {(match.vodUrl || match.streamUrl) && (
            <section className={`space-y-4 ${match.games.length > 0 ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-body dark:text-bodydark">
                {live && match.streamUrl ? <Radio size={14} className="text-danger" /> : <Video size={14} />}{' '}
                {t('matches.links.title')}
              </h3>
              {match.streamUrl && (live || !match.vodUrl) && <MatchVideo url={match.streamUrl} kind="stream" t={t} />}
              {match.vodUrl && <MatchVideo url={match.vodUrl} kind="vod" t={t} />}
              {match.streamUrl && match.vodUrl && !live && (
                <a
                  href={match.streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
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
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-body dark:text-bodydark">
            <Camera size={14} /> {t('matches.screenshots.title')}
            <span className="text-xs font-normal normal-case text-bodydark2">({gallery.length})</span>
          </h3>
          <ScreenshotGallery items={gallery} t={t} openUrl={galleryOpen} onOpenHandled={() => setGalleryOpen(null)} />
        </section>
      )}

      {/* Player stats */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-body dark:text-bodydark">
          <Star size={14} /> {t('matches.players.title')}
        </h3>
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
