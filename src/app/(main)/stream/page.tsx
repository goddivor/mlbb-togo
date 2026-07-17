'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Radio,
  ExternalLink,
  Youtube,
  Eye,
  Calendar,
  Clock,
  Flame,
  WifiOff,
} from 'lucide-react';
import { Button, SectionCard, Badge, Tabs, Card, LoadingSpinner } from '@/components/ui';
import { api } from '@/lib/api';
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

  if (loading) {
    return <LoadingSpinner size="lg" className="py-32" />;
  }

  const channel = config?.youtubeChannel || 'eternumesports';
  const banner = config?.channelBanner || '';
  const avatar = config?.channelAvatar || '';

  const tabs = [
    { id: 'live', label: t('stream.tabLive'), icon: Radio },
    ...seasons.map((s) => ({ id: s.seasonId, label: s.name, icon: Play })),
  ];

  const mainVideo = activeSeason
    ? selectedVideo || activeSeason.videos[0] || null
    : null;

  return (
    <div className="relative min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-3xl">
        {banner ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gaming-dark/80 backdrop-blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-t from-gaming-dark via-gaming-dark/40 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-gaming-darker via-gaming-dark to-gaming-darker" />
            <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
            <div className="absolute top-20 right-20 h-[300px] w-[400px] rounded-full bg-neon-purple/15 blur-[100px] pointer-events-none" />
          </>
        )}

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center"
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={config?.channelTitle || 'Channel'}
                className="mx-auto mb-6 h-24 w-24 rounded-full border-2 border-white/20 object-cover shadow-neon"
              />
            ) : (
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 shadow-neon">
                <Radio size={36} className="text-red-500" />
              </div>
            )}
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
                {t('stream.title')}
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300 sm:text-xl">
              {t('stream.subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Badge variant="red" size="lg" className="animate-pulse shadow-neon">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                {t('stream.live')}
              </Badge>
              <a href={channelUrl(channel)} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="lg" className="shadow-neon">
                  <ExternalLink size={18} />
                  {t('stream.openChannel')}
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gaming-dark to-transparent" />
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mt-8">
          <SectionCard className="!p-1.5">
            <Tabs tabs={tabs} active={activeTab} onChange={(id: string) => setActiveTab(id)} />
          </SectionCard>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {/* LIVE */}
              {activeTab === 'live' && (
                <motion.div
                  key="live"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card className="overflow-hidden !p-0 shadow-2xl">
                    {live?.live && live.videoId ? (
                      <div className="relative aspect-video w-full overflow-hidden bg-black">
                        <iframe
                          src={videoEmbedUrl(live.videoId)}
                          title={config?.liveTitle || t('stream.liveTitle')}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="h-full w-full"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center bg-gaming-darker">
                        {loadingLive ? (
                          <LoadingSpinner size="lg" />
                        ) : (
                          <div className="text-center">
                            <WifiOff size={48} className="mx-auto mb-4 text-gray-500" />
                            <p className="text-lg font-semibold text-gray-300">{t('stream.noLive')}</p>
                            <p className="mt-2 text-sm text-gray-400">{t('stream.noLiveDesc')}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>

                  <Card className="border border-white/10 bg-white/5 backdrop-blur-xl">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="red" size="sm" className="animate-pulse">
                            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                            {t('stream.live')}
                          </Badge>
                          <h3 className="text-xl font-bold text-white">
                            {config?.liveTitle || t('stream.liveTitle')}
                          </h3>
                        </div>
                        <p className="mt-2 text-gray-300">{config?.liveDesc || t('stream.liveDesc')}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={16} />
                            {new Date().toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <a href={channelUrl(channel)} target="_blank" rel="noreferrer">
                        <Button variant="primary" size="sm" className="shadow-neon">
                          <Youtube size={16} />
                          {t('stream.watchOnYoutube')}
                        </Button>
                      </a>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* SEASON */}
              {activeSeason && (
                <motion.div
                  key={activeSeason.seasonId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card className="overflow-hidden !p-0 shadow-2xl">
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
                        <div className="flex h-full w-full items-center justify-center">
                          <Play size={48} className="text-gray-600" />
                        </div>
                      )}
                      {mainVideo && (
                        <div className="absolute bottom-4 left-4">
                          <Badge variant="default" size="sm" className="bg-black/60 backdrop-blur-sm">
                            <Play size={12} className="mr-1" />
                            {mainVideo.title}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="border border-white/10 bg-white/5 backdrop-blur-xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="gold" size="sm">
                        <Flame size={14} />
                        {activeSeason.name}
                      </Badge>
                      <h3 className="text-xl font-bold text-white">
                        {mainVideo?.title || activeSeason.name}
                      </h3>
                    </div>
                    {mainVideo && (
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-400">
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
                      </div>
                    )}
                    {mainVideo && (
                      <div className="mt-4">
                        <a href={watchUrl(mainVideo.id)} target="_blank" rel="noreferrer">
                          <Button variant="primary" size="sm" className="shadow-neon">
                            <Youtube size={16} />
                            {t('stream.watchOnYoutube')}
                          </Button>
                        </a>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar: the active season's videos */}
          {activeSeason && activeSeason.videos.length > 0 && (
            <div className="hidden lg:block">
              <div className="sticky top-6">
                <Card className="border border-white/10 bg-white/5 backdrop-blur-xl !p-0">
                  <div className="flex items-center gap-3 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20">
                      <Flame size={20} className="text-neon-blue" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{activeSeason.name}</h3>
                      <p className="text-xs text-gray-400">
                        {t('stream.videosCount', { count: activeSeason.videos.length })}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-white/10" />
                  <div className="p-3">
                    <div className="space-y-2">
                      {activeSeason.videos.map((video) => {
                        const isActive = (mainVideo?.id || '') === video.id;
                        return (
                          <button
                            key={video.id}
                            type="button"
                            onClick={() => setSelectedVideo(video)}
                            className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all duration-300 ${
                              isActive
                                ? 'bg-neon-blue/10 text-neon-blue'
                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-white/5">
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
                              <p className="text-xs text-gray-500">
                                {video.duration}
                                {viewsMap[video.id] ? ` • ${t('stream.viewsCount', { count: viewsMap[video.id] })}` : ''}
                              </p>
                            </div>
                            {isActive && <div className="h-2 w-2 rounded-full bg-neon-blue shadow-neon" />}
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
    </div>
  );
}
