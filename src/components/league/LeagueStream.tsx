'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Radio, WifiOff, Youtube, PlayCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Button } from '@/components/ui';
import type { TFn } from '@/components/matches/shared';

type LiveState = { live: boolean; videoId: string | null; title?: string | null };
type Video = { id: string; title: string; thumbnail?: string };

const embed = (id: string) => `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
const watch = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/**
 * Stream block: the live when the channel is on air, otherwise the latest
 * video of the current season (or the featured video of the config).
 */
export default function LeagueStream({ seasonId, t }: { seasonId: string | null; t: TFn }) {
  const [live, setLive] = useState<LiveState | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [latest, setLatest] = useState<Video | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.stream.live().then((d: any) => !cancelled && setLive(d)).catch(() => !cancelled && setLive({ live: false, videoId: null }));
    api.stream.config().then((c: any) => !cancelled && setConfig(c)).catch(() => {});
    api.stream
      .seasons()
      .then((list: any) => {
        if (cancelled || !Array.isArray(list)) return;
        const season = (seasonId && list.find((s: any) => s.seasonId === seasonId)) || list[0];
        const v = season?.videos?.[0];
        if (v?.id) setLatest({ id: v.id, title: v.title, thumbnail: v.thumbnail });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [seasonId]);

  const featuredId = live?.live && live.videoId ? live.videoId : latest?.id || config?.s1MainVideoId || null;
  const title = live?.live ? config?.liveTitle || live.title || t('stream.liveTitle') : latest?.title || config?.liveTitle || '';
  const channel = config?.youtubeChannel || 'eternumesports';

  return (
    <div className="card-gaming overflow-hidden !p-0">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gaming-border">
        <div className="flex items-center gap-2 min-w-0">
          {live?.live ? (
            <Badge variant="red" size="sm" className="animate-pulse">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500" /> {t('stream.live')}
            </Badge>
          ) : (
            <Badge variant="default" size="sm">
              <Radio size={12} /> {t('league.stream.offline')}
            </Badge>
          )}
          <span className="truncate text-sm font-semibold text-white">{title}</span>
        </div>
        <a
          href={featuredId ? watch(featuredId) : `https://www.youtube.com/@${channel}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0"
        >
          <Button variant="primary" size="sm">
            <Youtube size={14} /> <span className="hidden sm:inline">{t('stream.watchOnYoutube')}</span>
          </Button>
        </a>
      </div>
      {featuredId ? (
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={embed(featuredId)}
            title={title || 'MLBB Togo'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center bg-gaming-darker text-center px-6">
          <WifiOff size={40} className="mb-3 text-gray-500" />
          <p className="font-semibold text-gray-300">{t('stream.noLive')}</p>
          <p className="mt-1 text-sm text-gray-500">{t('stream.noLiveDesc')}</p>
        </div>
      )}
      <div className="px-4 py-3 text-sm">
        <Link href="/stream" className="inline-flex items-center gap-1.5 text-neon-blue hover:underline">
          <PlayCircle size={14} /> {t('league.stream.all')}
        </Link>
      </div>
    </div>
  );
}
