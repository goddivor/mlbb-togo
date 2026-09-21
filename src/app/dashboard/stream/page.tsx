'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Play,
  Radio,
  Youtube,
  Eye,
  Calendar,
  Clock,
  Flame,
  WifiOff,
  ExternalLink,
} from 'lucide-react';
import { Button, Badge, Tabs, Card, LoadingSpinner, PageHeader, Skeleton, StatCard } from '@/components/ui';
import { cn } from '@/lib/helpers';
import { fade, still } from '@/lib/motion';
import { api } from '@/lib/api';
import { useSelectedSeason } from '@/store/useSeasonStore';
import { useT } from '@/lib/i18n';

type StreamVideo = {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: string;
  date?: string;
  views?: string;
};

type Season = { seasonId: string; name: string; videos: StreamVideo[] };

type StreamConfig = {
  youtubeChannel: string;
  channelId: string;
  channelTitle: string;
  channelAvatar: string;
  channelBanner: string;
  liveTitle: string;
  liveDesc: string;
};

function channelUrl(channel: string) {
  return `https://www.youtube.com/@${channel}/videos`;
}

function videoEmbedUrl(id: string) {
  return `https://www.youtube.com/embed/${id}`;
}

function watchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

function formatViews(count: string | undefined): string {
  if (!count) return '—';
  const num = parseInt(count, 10);
  if (isNaN(num)) return count;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return num.toString();
}

export default function StreamPage() {
  const t = useT();
  const reduce = useReducedMotion();
  const [config, setConfig] = useState<StreamConfig | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('live');
  const [selectedVideo, setSelectedVideo] = useState<StreamVideo | null>(null);
  const [viewsMap, setViewsMap] = useState<Record<string, string>>({});
  const [live, setLive] = useState<{ live: boolean; videoId: string | null } | null>(null);
  const [loadingLive, setLoadingLive] = useState(true);

  // Load the connected channel + admin-defined seasons.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cfg, seasonList] = await Promise.all([
          api.stream.config() as Promise<StreamConfig>,
          api.stream.seasons() as Promise<Season[]>,
        ]);
        if (cancelled) return;
        setConfig(cfg);
        setSeasons(Array.isArray(seasonList) ? seasonList : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live status.
  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    setLoadingLive(true);
    (async () => {
      try {
        const data = (await api.stream.live()) as { live: boolean; videoId: string | null };
        if (!cancelled) setLive(data);
      } catch {
        if (!cancelled) setLive({ live: false, videoId: null });
      } finally {
        if (!cancelled) setLoadingLive(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config]);

  // Default to the globally selected season when it has videos (once).
  const { seasonId: selectedSeasonId, ready: seasonsReady } = useSelectedSeason();
  const appliedRef = useRef(false);
  useEffect(() => {
    if (appliedRef.current || loading || !seasonsReady) return;
    appliedRef.current = true;
    if (selectedSeasonId && seasons.some((s) => s.seasonId === selectedSeasonId)) {
      setActiveTab(selectedSeasonId);
    }
  }, [loading, seasonsReady, selectedSeasonId, seasons]);

  const activeSeason = seasons.find((s) => s.seasonId === activeTab) || null;

  // Reset the selected video + fetch view counts when switching season tab.
  useEffect(() => {
    setSelectedVideo(null);
    if (!activeSeason || activeSeason.videos.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const ids = activeSeason.videos.map((v) => v.id).join(',');
        const data = (await api.stream.views(ids)) as { views?: Record<string, string> };
        if (cancelled || !data.views) return;
        const mapped: Record<string, string> = {};
        for (const [id, count] of Object.entries(data.views)) mapped[id] = formatViews(count);
        setViewsMap((prev) => ({ ...prev, ...mapped }));
      } catch {
        /* keep counts empty on failure */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const channel = config?.youtubeChannel || 'eternumesports';
  const banner = config?.channelBanner || '';
  const avatar = config?.channelAvatar || '';
  const isLive = !!live?.live;
  const totalVideos = seasons.reduce((n, s) => n + s.videos.length, 0);

  const tabs = [
    { id: 'live', label: t('stream.tabLive'), icon: Radio },
    ...seasons.map((s) => ({ id: s.seasonId, label: s.name, icon: Play, count: s.videos.length })),
  ];

  const mainVideo = activeSeason
    ? selectedVideo || activeSeason.videos[0] || null
    : null;
  const hasSidebar = !!(activeSeason && activeSeason.videos.length > 0);
  const paneVariants = reduce ? still : fade;

  const channelAvatar = (
    <a
      href={channelUrl(channel)}
      target="_blank"
      rel="noreferrer"
      aria-label={config?.channelTitle || 'YouTube'}
      className="group relative block h-14 w-14 shrink-0 sm:h-16 sm:w-16"
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={config?.channelTitle || 'Channel'} className="h-full w-full rounded-full border-2 border-white/40 object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white/30 bg-surface-1/60 text-accent-red backdrop-blur">
          <Youtube size={26} />
        </div>
      )}
      <span
        className={cn(
          'absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-[#0a0e19]',
          isLive ? 'bg-accent-red shadow-[0_0_10px_rgb(var(--accent-red)/0.9)] animate-pulse' : 'bg-ink-3',
        )}
        aria-hidden="true"
      />
    </a>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-lg" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="aspect-video w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Youtube size={12} /> {config?.channelTitle || `@${channel}`}
          </span>
        }
        icon={<Radio size={22} />}
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {t('stream.title')}
            {isLive && (
              <Badge variant="live" size="md">
                {t('stream.live')}
              </Badge>
            )}
          </span>
        }
        subtitle={t('stream.subtitle')}
        variant="danger"
        banner={banner || undefined}
        action={
          <div className="flex items-center gap-3">
            {channelAvatar}
            <a href={channelUrl(channel)} target="_blank" rel="noreferrer">
              <Button variant="primary" size="sm">
                <ExternalLink size={14} /> {t('stream.openChannel')}
              </Button>
            </a>
          </div>
        }
      >
        <StatCard
          label={t('stream.kpi.status')}
          value={isLive ? t('stream.live') : t('stream.kpi.offline')}
          icon={<Radio size={18} />}
          accent={isLive ? 'red' : 'cyan'}
        />
        <StatCard label={t('stream.kpi.seasons')} value={seasons.length} icon={<Flame size={18} />} accent="gold" />
        <StatCard label={t('stream.kpi.videos')} value={totalVideos} icon={<Play size={18} />} accent="violet" />
        <StatCard label={t('stream.channel')} value={<span className="text-xl">@{channel}</span>} icon={<Youtube size={18} />} accent="red" />
      </PageHeader>

      <div className="overflow-x-auto whitespace-nowrap">
        <Tabs variant="underline" tabs={tabs} active={activeTab} onChange={(id: string) => setActiveTab(id)} />
      </div>

      <div className={hasSidebar ? 'grid grid-cols-1 gap-6 lg:grid-cols-3' : ''}>
        <div className={hasSidebar ? 'space-y-6 lg:col-span-2' : 'space-y-6'}>
          <AnimatePresence mode="wait">
            {/* LIVE */}
            {activeTab === 'live' && (
              <motion.div key="live" variants={paneVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <Card className={cn('relative overflow-hidden !p-0', isLive && 'border-accent-red/40 shadow-[var(--glow-cyan)]')}>
                  <div className="flex items-center justify-between gap-3 border-b border-line-subtle px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Badge variant={isLive ? 'live' : 'default'} size="sm">
                        {isLive ? t('stream.live') : t('stream.kpi.offline')}
                      </Badge>
                      <span className="truncate font-display text-sm font-bold tracking-tight2 text-ink-1">
                        {config?.liveTitle || t('stream.liveTitle')}
                      </span>
                    </div>
                    <a
                      href={isLive && live?.videoId ? watchUrl(live.videoId) : channelUrl(channel)}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="secondary" size="sm">
                        <Youtube size={16} />
                        <span className="hidden sm:inline">{t('stream.watchOnYoutube')}</span>
                      </Button>
                    </a>
                  </div>

                  {isLive && live?.videoId ? (
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <iframe
                        src={videoEmbedUrl(live.videoId)}
                        title={config?.liveTitle || t('stream.liveTitle')}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                  ) : (
                    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-surface-0">
                      <div aria-hidden="true" className="absolute inset-0 bg-grid opacity-60" />
                      {loadingLive ? (
                        <LoadingSpinner size="lg" />
                      ) : (
                        <div className="relative px-6 text-center">
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded cut-corners bg-surface-2 text-ink-3 ring-1 ring-inset ring-line-subtle">
                            <WifiOff size={28} />
                          </div>
                          <p className="font-display text-lg font-bold tracking-tight2 text-ink-1">{t('stream.noLive')}</p>
                          <p className="mt-1.5 text-sm text-ink-2">{t('stream.noLiveDesc')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* SEASON */}
            {activeSeason && (
              <motion.div key={activeSeason.seasonId} variants={paneVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <Card className="overflow-hidden !p-0">
                  <div className="relative aspect-video w-full overflow-hidden bg-black">
                    {mainVideo ? (
                      <iframe
                        src={videoEmbedUrl(mainVideo.id)}
                        title={mainVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-ink-3">
                        <Play size={48} />
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="!p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="gold" size="sm" className="gap-1">
                      <Flame size={12} />
                      {activeSeason.name}
                    </Badge>
                    <h3 className="font-display text-xl font-bold tracking-tight2 text-ink-1">
                      {mainVideo?.title || activeSeason.name}
                    </h3>
                  </div>
                  {mainVideo && (
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-2 num">
                      <span className="flex items-center gap-1.5">
                        <Eye size={16} />
                        {t('stream.viewsCount', { count: viewsMap[mainVideo.id] || '—' })}
                      </span>
                      {mainVideo.date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={16} />
                          {mainVideo.date}
                        </span>
                      )}
                      {mainVideo.duration && (
                        <span className="flex items-center gap-1.5">
                          <Clock size={16} />
                          {mainVideo.duration}
                        </span>
                      )}
                      <a
                        href={watchUrl(mainVideo.id)}
                        target="_blank"
                        rel="noreferrer"
                        title={t('stream.watchOnYoutube')}
                        className="ml-auto inline-flex items-center gap-1.5 text-primary transition-colors hover:text-primary/80"
                      >
                        <Youtube size={18} /> <span className="text-xs font-semibold">{t('stream.watchOnYoutube')}</span>
                      </a>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar: the active season's videos (stacks below the player on mobile) */}
        {activeSeason && activeSeason.videos.length > 0 && (
          <div>
            <div className="lg:sticky lg:top-6">
              <Card className="!p-0">
                <div className="flex items-center gap-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded cut-corners-sm bg-accent-gold/15 text-accent-gold">
                    <Flame size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold tracking-tight2 text-ink-1">{activeSeason.name}</h3>
                    <p className="text-xs text-ink-3 num">
                      {t('stream.videosCount', { count: activeSeason.videos.length })}
                    </p>
                  </div>
                </div>
                <div className="border-t border-line-subtle" />
                <div className="max-h-[60vh] overflow-y-auto p-3">
                  <div className="space-y-1.5">
                    {activeSeason.videos.map((video) => {
                      const isActive = (mainVideo?.id || '') === video.id;
                      return (
                        <button
                          key={video.id}
                          type="button"
                          onClick={() => setSelectedVideo(video)}
                          aria-current={isActive || undefined}
                          className={cn(
                            'flex w-full items-center gap-3 rounded border-l-2 p-2 text-left transition-colors duration-fast',
                            isActive
                              ? 'border-l-primary bg-primary/10 text-ink-1'
                              : 'border-l-transparent text-ink-2 hover:bg-surface-2 hover:text-ink-1',
                          )}
                        >
                          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-surface-3">
                            {video.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center">
                                <Play size={14} />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{video.title}</p>
                            <p className="text-xs text-ink-3 num">
                              {video.duration}
                              {viewsMap[video.id] ? ` · ${t('stream.viewsCount', { count: viewsMap[video.id] })}` : ''}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
