'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Radio,
  ExternalLink,
  History,
  Youtube,
  Heart,
  Share2,
  Eye,
  Calendar,
  Clock,
  Flame,
  ChevronRight,
  WifiOff,
} from 'lucide-react';
import { Button, PageHeader, SectionCard, Badge, Tabs, Card } from '@/components/ui';
import { useT } from '@/lib/i18n';

const YOUTUBE_CHANNEL = 'eternumesports';
const YOUTUBE_EMBED_URL = `https://www.youtube.com/embed/live_stream?channel=${YOUTUBE_CHANNEL}`;
const YOUTUBE_CHANNEL_URL = `https://www.youtube.com/@${YOUTUBE_CHANNEL}/videos`;

const S1_EMBED_URL = 'https://www.youtube.com/embed/gmQZwF1e440?si=xKLoXkeDWeBn38Ia';

type S1Video = {
  id: string;
  title: string;
  url: string;
  day?: string;
  duration?: string;
  views?: string;
  date?: string;
};

const S1_VIDEOS_BASE: S1Video[] = [
  { id: 'gmQZwF1e440', title: 'Game 1', url: 'https://www.youtube.com/watch?v=gmQZwF1e440', day: 'Game 1', duration: '12:34', date: '15 Jan 2025' },
  { id: 'ig4rgd_XpsI', title: 'GAME 1', url: 'https://www.youtube.com/watch?v=ig4rgd_XpsI&t=6s', day: 'GAME 1', duration: '10:45', date: '16 Jan 2025' },
  { id: 'RrlV4gdaT-c', title: 'Game 2', url: 'https://www.youtube.com/watch?v=RrlV4gdaT-c', day: 'Game 2', duration: '14:20', date: '18 Jan 2025' },
  { id: 'XUxJ5RDPn50', title: 'Day 7', url: 'https://www.youtube.com/watch?v=XUxJ5RDPn50', day: 'DAY 7', duration: '18:05', date: '22 Jan 2025' },
  { id: '0fHem_8aV-c', title: 'Day 9', url: 'https://www.youtube.com/watch?v=0fHem_8aV-c', day: 'DAY 9', duration: '15:30', date: '24 Jan 2025' },
  { id: 'rk1x2zOxN5c', title: 'Day 10', url: 'https://www.youtube.com/watch?v=rk1x2zOxN5c', day: 'DAY 10', duration: '16:45', date: '25 Jan 2025' },
  { id: 'CpMvI_7n83I', title: 'Day 12', url: 'https://www.youtube.com/watch?v=CpMvI_7n83I', day: 'DAY 12', duration: '20:10', date: '27 Jan 2025' },
  { id: '5SjS6tOz0Ck', title: '3RD game', url: 'https://www.youtube.com/watch?v=5SjS6tOz0Ck', day: '3RD game', duration: '13:55', date: '29 Jan 2025' },
  { id: 'yEZqiM5uYoM', title: 'Final', url: 'https://www.youtube.com/watch?v=yEZqiM5uYoM&t=', day: 'Final', duration: '25:30', date: '01 Feb 2025' },
];

function getEmbedSrc(video: S1Video) {
  if (video.url.includes('/embed/')) return video.url;
  return `https://www.youtube.com/embed/${video.id}`;
}

function getWatchUrl(video: S1Video) {
  return video.url.includes('/watch') ? video.url : `https://www.youtube.com/watch?v=${video.id}`;
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
  const [selectedVideo, setSelectedVideo] = useState<S1Video | null>(null);
  const [isHoveringPlayer, setIsHoveringPlayer] = useState(false);
  const [liveError, setLiveError] = useState(false);
  const [s1Videos, setS1Videos] = useState<S1Video[]>(S1_VIDEOS_BASE);
  const [loadingViews, setLoadingViews] = useState(false);

  useEffect(() => {
    if (activeTab !== 's1') return;
    let cancelled = false;
    setLoadingViews(true);

    async function loadViews() {
      try {
        const ids = S1_VIDEOS_BASE.map((v) => v.id).join(',');
        const res = await fetch(`/api/youtube/views?videoIds=${encodeURIComponent(ids)}`);
        if (!res.ok) throw new Error('Failed to fetch views');
        const data = (await res.json()) as { views?: Record<string, string> };
        if (cancelled) return;
        setS1Videos((prev) =>
          prev.map((v) => ({
            ...v,
            views: data.views?.[v.id] ? formatViews(data.views[v.id]) : v.views,
          }))
        );
      } catch {
        if (!cancelled) {
          setS1Videos(S1_VIDEOS_BASE);
        }
      } finally {
        if (!cancelled) setLoadingViews(false);
      }
    }

    loadViews();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const heroSrc = useMemo(() => YOUTUBE_CHANNEL_URL, []);

  return (
    <div className="relative min-h-screen">
      {/* ============================================================
           HERO SECTION
      ============================================================ */}
      <section className="relative overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-gaming-darker via-gaming-dark to-gaming-darker" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20200%20200%22%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22/%3E%3C/filter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url%28%23noise%29%22%20opacity%3D%220.04%22/%3E%3C/svg%3E')] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-gaming-dark via-transparent to-transparent" />

        {/* Light effect */}
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-20 h-[300px] w-[400px] rounded-full bg-neon-purple/15 blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 shadow-neon"
            >
              <Radio size={36} className="text-red-500" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              <span className="bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
                {t('stream.title')}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mx-auto mt-4 max-w-2xl text-lg text-gray-300 sm:text-xl"
            >
              {t('stream.subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              <Badge variant="red" size="lg" className="animate-pulse shadow-neon">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                {t('stream.live')}
              </Badge>
              <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="lg" className="shadow-neon">
                  <ExternalLink size={18} />
                  {t('stream.openChannel')}
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gaming-dark to-transparent" />
      </section>

      {/* ============================================================
           MAIN CONTENT
      ============================================================ */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-8"
        >
          <SectionCard className="!p-1.5">
            <Tabs
              tabs={[
                { id: 'live', label: t('stream.tabLive'), icon: Radio },
                { id: 'replay', label: t('stream.tabReplay'), icon: History },
                { id: 's1', label: t('stream.tabS1'), icon: Play },
              ]}
              active={activeTab}
              onChange={(id) => setActiveTab(id as 'live' | 'replay' | 's1')}
            />
          </SectionCard>
        </motion.div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ============================================================
               LEFT COLUMN - Player + Info
          ============================================================ */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'live' && (
                <motion.div
                  key="live"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Player */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="group relative"
                    onMouseEnter={() => setIsHoveringPlayer(true)}
                    onMouseLeave={() => setIsHoveringPlayer(false)}
                  >
                    <Card className="overflow-hidden !p-0 shadow-2xl transition-all duration-500 group-hover:shadow-neon-lg">
                      {liveError ? (
                        <div className="relative flex aspect-video w-full items-center justify-center bg-gaming-darker">
                          <div className="text-center">
                            <WifiOff size={48} className="mx-auto mb-4 text-gray-500" />
                            <p className="text-lg font-semibold text-gray-300">Aucun live disponible</p>
                            <p className="mt-2 text-sm text-gray-400">Le live démarrera automatiquement quand il sera disponible.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative aspect-video w-full overflow-hidden bg-black">
                          <iframe
                            src={YOUTUBE_EMBED_URL}
                            title="ETERNUM Esports Live Stream"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="h-full w-full"
                            onError={() => setLiveError(true)}
                          />
                          <div className="absolute inset-0 bg-black/30 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none" />
                          <motion.div
                            animate={{ scale: isHoveringPlayer ? 1.05 : 1 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          >
                            {!isHoveringPlayer && (
                              <div className="flex flex-col items-center gap-3">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 backdrop-blur-sm">
                                  <Play size={32} className="text-white ml-1" />
                                </div>
                                <Badge variant="red" size="lg" className="animate-pulse shadow-neon">
                                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                                  {t('stream.live')}
                                </Badge>
                              </div>
                            )}
                          </motion.div>
                        </div>
                      )}
                    </Card>
                  </motion.div>

                  {/* Info Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <Card className="border border-white/10 bg-white/5 backdrop-blur-xl">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="red" size="sm" className="animate-pulse">
                              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                              {t('stream.live')}
                            </Badge>
                            <h3 className="text-xl font-bold text-white">
                              {t('stream.liveTitle')}
                            </h3>
                          </div>
                          <p className="mt-2 text-gray-300">
                            {t('stream.liveDesc')}
                          </p>
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <Eye size={16} />
                              1.2K spectateurs
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar size={16} />
                              {new Date().toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button variant="ghost" size="sm" className="border border-white/10 hover:border-red-500/50 hover:bg-red-500/10">
                            <Heart size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="border border-white/10 hover:border-neon-blue/50 hover:bg-neon-blue/10">
                            <Share2 size={16} />
                          </Button>
                          <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noreferrer">
                            <Button variant="primary" size="sm" className="shadow-neon">
                              <Youtube size={16} />
                              {t('stream.watchOnYoutube')}
                            </Button>
                          </a>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === 'replay' && (
                <motion.div
                  key="replay"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                  >
                    <Card className="overflow-hidden !p-0 shadow-2xl">
                      <div className="relative flex aspect-video w-full items-center justify-center bg-gaming-darker">
                        <div className="text-center">
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-blue/10">
                            <History size={32} className="text-neon-blue" />
                          </div>
                          <p className="text-lg font-semibold text-white">Rediffusions disponibles</p>
                          <p className="mt-2 text-sm text-gray-400">Regardez toutes les vidéos directement sur YouTube</p>
                          <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noreferrer" className="mt-4 inline-block">
                            <Button variant="primary" size="sm" className="shadow-neon">
                              <Youtube size={16} />
                              {t('stream.watchOnYoutube')}
                            </Button>
                          </a>
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <Card className="border border-white/10 bg-white/5 backdrop-blur-xl">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="neon" size="sm">
                              <History size={14} />
                              {t('stream.replayTitle')}
                            </Badge>
                            <h3 className="text-xl font-bold text-white">
                              {t('stream.replayTitle')}
                            </h3>
                          </div>
                          <p className="mt-2 text-gray-300">
                            {t('stream.replayDesc')}
                          </p>
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <Clock size={16} />
                              Rediffusions disponibles
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button variant="ghost" size="sm" className="border border-white/10 hover:border-neon-blue/50 hover:bg-neon-blue/10">
                            <Share2 size={16} />
                          </Button>
                          <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noreferrer">
                            <Button variant="primary" size="sm" className="shadow-neon">
                              <Youtube size={16} />
                              {t('stream.watchOnYoutube')}
                            </Button>
                          </a>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === 's1' && (
                <motion.div
                  key="s1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* S1 Player */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="group relative"
                    onMouseEnter={() => setIsHoveringPlayer(true)}
                    onMouseLeave={() => setIsHoveringPlayer(false)}
                  >
                    <Card className="overflow-hidden !p-0 shadow-2xl transition-all duration-500 group-hover:shadow-neon-lg">
                      <div className="relative aspect-video w-full overflow-hidden bg-black">
                        <iframe
                          src={selectedVideo ? getEmbedSrc(selectedVideo) : S1_EMBED_URL}
                          title={selectedVideo ? selectedVideo.title : 'MLBB Togo Stream Saison 1'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                          className="h-full w-full"
                        />
                        <div className="absolute inset-0 bg-black/30 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none" />
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
                  </motion.div>

                  {/* S1 Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <Card className="border border-white/10 bg-white/5 backdrop-blur-xl">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="gold" size="sm">
                              <Flame size={14} />
                              Saison 1
                            </Badge>
                            <h3 className="text-xl font-bold text-white">
                              {t('stream.s1LiveTitle')}
                            </h3>
                          </div>
                          <p className="mt-2 text-gray-300">
                            {t('stream.s1LiveDesc')}
                          </p>
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <Eye size={16} />
                              {selectedVideo ? `${selectedVideo.views || '—'} vues` : loadingViews ? 'Chargement...' : 'Sélectionnez une vidéo'}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar size={16} />
                              {selectedVideo ? selectedVideo.date : '—'}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={16} />
                              {selectedVideo ? selectedVideo.duration : '—'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button variant="ghost" size="sm" className="border border-white/10 hover:border-red-500/50 hover:bg-red-500/10">
                            <Heart size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="border border-white/10 hover:border-neon-blue/50 hover:bg-neon-blue/10">
                            <Share2 size={16} />
                          </Button>
                          {selectedVideo && (
                            <a href={getWatchUrl(selectedVideo)} target="_blank" rel="noreferrer">
                              <Button variant="primary" size="sm" className="shadow-neon">
                                <Youtube size={16} />
                                {t('stream.watchOnYoutube')}
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ============================================================
               RIGHT COLUMN - Sidebar (Desktop)
          ============================================================ */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="sticky top-6"
            >
              <Card className="border border-white/10 bg-white/5 backdrop-blur-xl">
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20">
                      <Flame size={20} className="text-neon-blue" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {activeTab === 's1' ? 'Saison 1' : 'Stream'}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {activeTab === 's1' ? `${s1Videos.length} vidéos` : 'En direct'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10" />

                <div className="p-3">
                  <div className="space-y-2">
                    {activeTab === 's1' ? (
                      s1Videos.map((video) => {
                        const isActive = selectedVideo?.id === video.id;
                        return (
                          <button
                            key={video.id}
                            type="button"
                            onClick={() => setSelectedVideo(video)}
                            className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all duration-300 ${
                              isActive
                                ? 'bg-neon-blue/10 text-neon-blue'
                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                              <Play size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {video.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {video.day} {video.views ? `• ${video.views} vues` : ''}
                              </p>
                            </div>
                            {isActive && (
                              <div className="h-2 w-2 rounded-full bg-neon-blue shadow-neon" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-sm text-gray-500">
                        <Radio size={32} className="mx-auto mb-2 opacity-50" />
                        {activeTab === 'live'
                          ? 'Live en cours de diffusion...'
                          : 'Rediffusions disponibles'}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
