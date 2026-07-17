'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Radio,
  ExternalLink,
  History,
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
  day?: string;
  duration?: string;
  date?: string;
  views?: string;
};

type StreamConfig = {
  youtubeChannel: string;
  liveTitle: string;
  liveDesc: string;
  s1MainVideoId: string;
  videos: StreamVideo[];
};

function channelUrl(channel: string) {
  return `https://www.youtube.com/@${channel}/videos`;
}

function liveEmbedUrl(channel: string) {
  return `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(channel)}`;
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
  const [activeTab, setActiveTab] = useState<'live' | 'replay' | 's1'>('live');
  const [config, setConfig] = useState<StreamConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<StreamVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<StreamVideo | null>(null);
  const [loadingViews, setLoadingViews] = useState(false);
  const [liveError, setLiveError] = useState(false);

  // Load the admin-managed configuration (channel + Season 1 videos).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = (await api.stream.config()) as StreamConfig;
        if (cancelled) return;
        setConfig(data);
        setVideos(data.videos || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Enrich the Season 1 videos with real view counts when that tab is opened.
  useEffect(() => {
    if (activeTab !== 's1' || videos.length === 0) return;
    let cancelled = false;
    setLoadingViews(true);
    (async () => {
      try {
        const ids = videos.map((v) => v.id).join(',');
        const res = await fetch(`/api/youtube/views?videoIds=${encodeURIComponent(ids)}`);
        const data = (await res.json()) as { views?: Record<string, string> };
        if (cancelled) return;
        setVideos((prev) =>
          prev.map((v) => ({
            ...v,
            views: data.views?.[v.id] ? formatViews(data.views[v.id]) : v.views,
          })),
        );
      } catch {
        /* keep the videos as-is on failure */
      } finally {
        if (!cancelled) setLoadingViews(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, videos.length]);

  if (loading) {
    return <LoadingSpinner size="lg" className="py-32" />;
  }

  const channel = config?.youtubeChannel || 'eternumesports';
  const mainVideoId = config?.s1MainVideoId || videos[0]?.id || '';
  const s1Src = selectedVideo ? videoEmbedUrl(selectedVideo.id) : videoEmbedUrl(mainVideoId);

  return (
    <div className="relative min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-gaming-darker via-gaming-dark to-gaming-darker" />
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-20 h-[300px] w-[400px] rounded-full bg-neon-purple/15 blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 shadow-neon">
              <Radio size={36} className="text-red-500" />
            </div>
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
            <Tabs
              tabs={[
                { id: 'live', label: t('stream.tabLive'), icon: Radio },
                { id: 'replay', label: t('stream.tabReplay'), icon: History },
                { id: 's1', label: t('stream.tabS1'), icon: Play },
              ]}
              active={activeTab}
              onChange={(id: string) => setActiveTab(id as 'live' | 'replay' | 's1')}
            />
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
                    {liveError ? (
                      <div className="flex aspect-video w-full items-center justify-center bg-gaming-darker">
                        <div className="text-center">
                          <WifiOff size={48} className="mx-auto mb-4 text-gray-500" />
                          <p className="text-lg font-semibold text-gray-300">{t('stream.noLive')}</p>
                          <p className="mt-2 text-sm text-gray-400">{t('stream.noLiveDesc')}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-video w-full overflow-hidden bg-black">
                        <iframe
                          src={liveEmbedUrl(channel)}
                          title={config?.liveTitle || t('stream.liveTitle')}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="h-full w-full"
                          onError={() => setLiveError(true)}
                        />
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
                        <p className="mt-2 text-gray-300">
                          {config?.liveDesc || t('stream.liveDesc')}
                        </p>
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

              {/* REPLAY */}
              {activeTab === 'replay' && (
                <motion.div
                  key="replay"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card className="overflow-hidden !p-0 shadow-2xl">
                    <div className="flex aspect-video w-full items-center justify-center bg-gaming-darker">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-blue/10">
                          <History size={32} className="text-neon-blue" />
                        </div>
                        <p className="text-lg font-semibold text-white">{t('stream.replayAvailable')}</p>
                        <p className="mt-2 text-sm text-gray-400">{t('stream.replayHint')}</p>
                        <a href={channelUrl(channel)} target="_blank" rel="noreferrer" className="mt-4 inline-block">
                          <Button variant="primary" size="sm" className="shadow-neon">
                            <Youtube size={16} />
                            {t('stream.watchOnYoutube')}
                          </Button>
                        </a>
                      </div>
                    </div>
                  </Card>

                  <Card className="border border-white/10 bg-white/5 backdrop-blur-xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="neon" size="sm">
                        <History size={14} />
                        {t('stream.replayTitle')}
                      </Badge>
                      <h3 className="text-xl font-bold text-white">{t('stream.replayTitle')}</h3>
                    </div>
                    <p className="mt-2 text-gray-300">{t('stream.replayDesc')}</p>
                  </Card>
                </motion.div>
              )}

              {/* SEASON 1 */}
              {activeTab === 's1' && (
                <motion.div
                  key="s1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card className="overflow-hidden !p-0 shadow-2xl">
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      {mainVideoId ? (
                        <iframe
                          src={s1Src}
                          title={selectedVideo ? selectedVideo.title : t('stream.s1LiveTitle')}
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
                      {selectedVideo && (
                        <div className="absolute bottom-4 left-4">
                          <Badge variant="default" size="sm" className="bg-black/60 backdrop-blur-sm">
                            <Play size={12} className="mr-1" />
                            {selectedVideo.title}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="border border-white/10 bg-white/5 backdrop-blur-xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="gold" size="sm">
                        <Flame size={14} />
                        {t('stream.s1Title')}
                      </Badge>
                      <h3 className="text-xl font-bold text-white">{t('stream.s1LiveTitle')}</h3>
                    </div>
                    <p className="mt-2 text-gray-300">{t('stream.s1LiveDesc')}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Eye size={16} />
                        {selectedVideo
                          ? t('stream.viewsCount', { count: selectedVideo.views || '—' })
                          : loadingViews
                            ? t('stream.loadingViews')
                            : t('stream.selectVideo')}
                      </span>
                      {selectedVideo?.date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={16} />
                          {selectedVideo.date}
                        </span>
                      )}
                      {selectedVideo?.duration && (
                        <span className="flex items-center gap-1.5">
                          <Clock size={16} />
                          {selectedVideo.duration}
                        </span>
                      )}
                    </div>
                    {selectedVideo && (
                      <div className="mt-4">
                        <a href={watchUrl(selectedVideo.id)} target="_blank" rel="noreferrer">
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

          {/* Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <Card className="border border-white/10 bg-white/5 backdrop-blur-xl !p-0">
                <div className="flex items-center gap-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20">
                    <Flame size={20} className="text-neon-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {activeTab === 's1' ? t('stream.s1Title') : t('stream.title')}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {activeTab === 's1'
                        ? t('stream.videosCount', { count: videos.length })
                        : t('stream.live')}
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/10" />
                <div className="p-3">
                  {activeTab === 's1' && videos.length > 0 ? (
                    <div className="space-y-2">
                      {videos.map((video) => {
                        const isActive = selectedVideo?.id === video.id;
                        return (
                          <button
                            key={video.id}
                            type="button"
                            onClick={() => setSelectedVideo(video)}
                            className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-300 ${
                              isActive
                                ? 'bg-neon-blue/10 text-neon-blue'
                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                              <Play size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{video.title}</p>
                              <p className="text-xs text-gray-500">
                                {video.day}
                                {video.views ? ` • ${t('stream.viewsCount', { count: video.views })}` : ''}
                              </p>
                            </div>
                            {isActive && <div className="h-2 w-2 rounded-full bg-neon-blue shadow-neon" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-500">
                      <Radio size={32} className="mx-auto mb-2 opacity-50" />
                      {activeTab === 'live' ? t('stream.liveOngoing') : t('stream.replayAvailable')}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
