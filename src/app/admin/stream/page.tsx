'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Youtube,
  Radio,
  Link2,
  Unlink,
  Play,
  Check,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Square,
  ExternalLink,
  RefreshCw,
  CalendarDays,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, Button, PageHeader, LoadingSpinner, Badge, Input, Select, SectionTitle, EmptyState, Skeleton } from '@/components/ui';
import toast from 'react-hot-toast';

type ChannelVideo = {
  videoId: string;
  title: string;
  thumbnail?: string;
  privacyStatus?: string;
  publishedAt?: string;
  viewCount?: number;
  duration?: string;
};

type VideoMeta = { title: string; thumbnail?: string; duration?: string; date?: string };

// ISO-8601 duration (PT1H2M3S) -> "1:02:03" / "2:03".
function iso8601ToClock(d?: string): string {
  if (!d) return '';
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '';
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const s = parseInt(m[3] || '0', 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`;
}

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

const labelCls = 'mb-2.5 block text-sm font-medium text-ink-1';

function AdminStreamInner() {
  const t = useT();
  const params = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>({ connected: false });

  // Live control
  const [livePanel, setLivePanel] = useState<any>({ active: false });
  const [liveTitle, setLiveTitle] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Seasons (admin-created) + per-season video selection
  const [seasons, setSeasons] = useState<any[]>([]);
  const [seasonId, setSeasonId] = useState('');
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [meta, setMeta] = useState<Record<string, VideoMeta>>({});
  const [savingSel, setSavingSel] = useState(false);

  const connected = !!status?.connected;

  const loadAll = useCallback(async () => {
    const [st, panel, seasonList] = await Promise.all([
      api.stream.youtube.status(),
      api.stream.livePanel().catch(() => ({ active: false })),
      api.esport.seasons().catch(() => []),
    ]);
    setStatus(st);
    setLivePanel(panel);
    setSeasons(Array.isArray(seasonList) ? seasonList : []);
  }, []);

  useEffect(() => {
    (async () => {
      await loadAll();
      setLoading(false);
    })();
  }, [loadAll]);

  // When a season is picked, pre-check the videos already attached to it.
  useEffect(() => {
    if (!seasonId) {
      setSelected(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      const assigned = await api.stream.seasonVideos(seasonId).catch(() => []);
      if (cancelled) return;
      const sel = new Set<string>();
      const m: Record<string, VideoMeta> = {};
      for (const v of assigned || []) {
        sel.add(v.id);
        m[v.id] = { title: v.title, thumbnail: v.thumbnail, duration: v.duration, date: v.date };
      }
      setSelected(sel);
      setMeta((prev) => ({ ...prev, ...m }));
    })();
    return () => {
      cancelled = true;
    };
  }, [seasonId]);

  // Toast on OAuth return.
  useEffect(() => {
    const c = params.get('connected');
    if (c === '1') toast.success(t('admin.stream.connected'));
    else if (c === '0') toast.error(t('admin.stream.connectError'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const connect = async () => {
    try {
      const { url } = await api.stream.youtube.connect();
      window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message || t('admin.stream.connectError'));
    }
  };

  const disconnect = async () => {
    try {
      await api.stream.youtube.disconnect();
      toast.success(t('admin.stream.disconnected'));
      setVideos([]);
      await loadAll();
    } catch (e: any) {
      toast.error(e?.message || t('admin.stream.error'));
    }
  };

  const loadVideos = async (append = false) => {
    setLoadingVideos(true);
    try {
      const data = await api.stream.youtube.videos(append ? nextPageToken || undefined : undefined);
      const list: ChannelVideo[] = data.videos || [];
      setVideos((prev) => (append ? [...prev, ...list] : list));
      setNextPageToken(data.nextPageToken || null);
      setMeta((prev) => {
        const next = { ...prev };
        for (const v of list) {
          next[v.videoId] = {
            title: v.title,
            thumbnail: v.thumbnail,
            duration: iso8601ToClock(v.duration),
            date: fmtDate(v.publishedAt),
          };
        }
        return next;
      });
    } catch (e: any) {
      toast.error(e?.message || t('admin.stream.error'));
    } finally {
      setLoadingVideos(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveSelection = async () => {
    if (!seasonId) return;
    setSavingSel(true);
    try {
      // Preserve channel order when available, else keep insertion order.
      const order = videos.length
        ? videos.map((v) => v.videoId).filter((id) => selected.has(id))
        : Array.from(selected);
      const payloadVideos = order.map((id) => {
        const m = meta[id] || { title: id };
        return {
          id,
          title: m.title || id,
          duration: m.duration || '',
          date: m.date || '',
          thumbnail: m.thumbnail || '',
        };
      });
      await api.stream.setSeasonVideos(seasonId, payloadVideos);
      toast.success(t('admin.stream.saved'));
    } catch (e: any) {
      toast.error(e?.message || t('admin.stream.error'));
    } finally {
      setSavingSel(false);
    }
  };

  const startLive = async () => {
    setStarting(true);
    try {
      const data = await api.stream.startLive({ title: liveTitle.trim() || 'Live', privacy });
      setLivePanel({ active: true, ...data });
      setShowKey(false);
      toast.success(t('admin.stream.liveStarted'));
    } catch (e: any) {
      toast.error(e?.message || t('admin.stream.liveError'));
    } finally {
      setStarting(false);
    }
  };

  const stopLive = async () => {
    setStopping(true);
    try {
      await api.stream.stopLive();
      setLivePanel({ active: false });
      toast.success(t('admin.stream.liveStopped'));
    } catch (e: any) {
      toast.error(e?.message || t('admin.stream.error'));
    } finally {
      setStopping(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(t('admin.stream.copied'));
  };

  const selectedCount = useMemo(() => selected.size, [selected]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <Skeleton lines={4} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.section.esport')}
        icon={<Radio size={28} />}
        title={t('admin.stream.title')}
        subtitle={t('admin.stream.subtitle')}
        variant="danger"
        action={
          <div className="flex items-center gap-3">
            {livePanel.active ? (
              <Badge variant="live">{t('stream.live')}</Badge>
            ) : (
              connected && <Badge variant="green" dot>{t('admin.stream.connectedLabel')}</Badge>
            )}
            <a href="/dashboard/stream" target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink size={16} /> {t('admin.stream.preview')}
              </Button>
            </a>
          </div>
        }
      />

      {/* 1. YouTube connection */}
      <Card>
        <SectionTitle
          className="mb-4"
          title={
            <span className="inline-flex items-center gap-2">
              <Youtube size={20} className="text-accent-red" /> {t('admin.stream.connectSection')}
            </span>
          }
        />

        {connected ? (
          <div>
            <div className="overflow-hidden rounded-lg border border-line-subtle">
              <div className="relative h-28 w-full bg-surface-2">
                {status.channelBanner && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={status.channelBanner} alt="" className="h-full w-full object-cover" />
                )}
                {status.channelThumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={status.channelThumbnail}
                    alt={status.channelTitle}
                    className="absolute left-1/2 top-full h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-1 object-cover shadow-elev-2"
                  />
                )}
              </div>
              <p className="mt-10 pb-3 text-center font-display text-sm font-bold text-ink-1">
                {status.channelTitle}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm text-accent-green">
                <Check size={16} /> {t('admin.stream.connectedLabel')}
              </span>
              <Button variant="ghost" size="sm" onClick={disconnect} className="text-accent-red hover:bg-accent-red/10">
                <Unlink size={16} /> {t('admin.stream.disconnect')}
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            className="!min-h-0 py-8"
            icon={<Youtube size={28} />}
            title={t('admin.stream.connectSection')}
            description={t('admin.stream.connectHelp')}
            action={
              <Button onClick={connect}>
                <Link2 size={16} /> {t('admin.stream.connectBtn')}
              </Button>
            }
          />
        )}
      </Card>

      {connected && (
        <>
          {/* 2. Go live */}
          <Card accent={livePanel.active ? 'red' : undefined}>
            <SectionTitle
              className="mb-4"
              title={
                <span className="inline-flex items-center gap-2">
                  <Zap size={20} className="text-primary" /> {t('admin.stream.liveSection')}
                </span>
              }
              action={livePanel.active ? <Badge variant="live">{t('stream.live')}</Badge> : undefined}
            />

            {livePanel.active ? (
              <div className="space-y-4">
                <p className="text-sm text-ink-2">{t('admin.stream.liveInstructions')}</p>
                <div>
                  <label className={labelCls}>{t('admin.stream.rtmpUrl')}</label>
                  <div className="flex gap-2">
                    <Input readOnly value={livePanel.rtmpUrl || ''} className="font-mono text-xs" />
                    <Button variant="secondary" size="sm" onClick={() => copy(livePanel.rtmpUrl || '')} aria-label={t('admin.stream.copied')}>
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('admin.stream.streamKey')}</label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      type={showKey ? 'text' : 'password'}
                      value={livePanel.streamKey || ''}
                      className="font-mono text-xs"
                    />
                    <Button variant="secondary" size="sm" onClick={() => setShowKey((v) => !v)}>
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => copy(livePanel.streamKey || '')}>
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {livePanel.watchUrl && (
                    <a href={livePanel.watchUrl} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm">
                        <ExternalLink size={16} /> {t('admin.stream.watchLive')}
                      </Button>
                    </a>
                  )}
                  <Button size="sm" variant="danger" onClick={stopLive} disabled={stopping}>
                    <Square size={16} /> {t('admin.stream.stopLive')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px_auto] md:items-end">
                <Input
                  label={t('admin.stream.liveTitleLabel')}
                  value={liveTitle}
                  onChange={(e: any) => setLiveTitle(e.target.value)}
                  placeholder="MLBB Togo — Live"
                />
                <Select label={t('admin.stream.privacy')} value={privacy} onChange={(e: any) => setPrivacy(e.target.value)}>
                  <option value="public">{t('admin.stream.privacyPublic')}</option>
                  <option value="unlisted">{t('admin.stream.privacyUnlisted')}</option>
                  <option value="private">{t('admin.stream.privacyPrivate')}</option>
                </Select>
                <div>
                  <Button onClick={startLive} disabled={starting} className="w-full md:w-auto">
                    <Zap size={16} /> {t('admin.stream.startLive')}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* 3. Per-season video selection */}
          <Card>
            <SectionTitle
              className="mb-4"
              title={
                <span className="inline-flex items-center gap-2">
                  <Play size={20} className="text-primary" /> {t('admin.stream.videosSection')}
                </span>
              }
            />

            {seasons.length === 0 ? (
              <EmptyState
                className="!min-h-0 py-8"
                icon={<CalendarDays size={28} />}
                title={t('admin.stream.noSeasons')}
                action={
                  <a href="/admin/seasons" className="inline-block">
                    <Button variant="secondary" size="sm">
                      <CalendarDays size={16} /> {t('admin.stream.goSeasons')}
                    </Button>
                  </a>
                }
              />
            ) : (
              <>
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <Select
                    label={t('admin.stream.seasonLabel')}
                    value={seasonId}
                    onChange={(e: any) => {
                      setSeasonId(e.target.value);
                      setVideos([]);
                      setNextPageToken(null);
                    }}
                  >
                    <option value="">{t('admin.stream.seasonPlaceholder')}</option>
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                  {seasonId && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="whitespace-nowrap text-sm text-ink-3 num">
                        {t('admin.stream.selectedCount', { count: selectedCount })}
                      </span>
                      <Button variant="secondary" size="sm" onClick={() => loadVideos(false)} disabled={loadingVideos}>
                        <RefreshCw size={16} className={loadingVideos ? 'animate-spin' : ''} />
                        {t('admin.stream.loadVideos')}
                      </Button>
                      <Button size="sm" onClick={saveSelection} disabled={savingSel}>
                        <Check size={16} /> {t('admin.stream.saveSelection')}
                      </Button>
                    </div>
                  )}
                </div>

                {!seasonId ? (
                  <EmptyState className="!min-h-0 py-8" title={t('admin.stream.pickSeason')} />
                ) : videos.length === 0 ? (
                  <EmptyState className="!min-h-0 py-8" title={t('admin.stream.loadHint')} />
                ) : (
              <>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {videos.map((v) => {
                    const isSel = selected.has(v.videoId);
                    return (
                      <button
                        key={v.videoId}
                        type="button"
                        onClick={() => toggle(v.videoId)}
                        aria-pressed={isSel}
                        className={`flex items-center gap-3 rounded-lg border p-2 text-left transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                          isSel
                            ? 'border-primary bg-primary/5'
                            : 'border-line-subtle hover:border-primary/50'
                        }`}
                      >
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-surface-2">
                          {v.thumbnail && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                          )}
                          {isSel && (
                            <span className="absolute inset-0 flex items-center justify-center bg-primary/60">
                              <Check size={18} className="text-on-primary" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink-1">{v.title}</p>
                          <p className="text-xs text-ink-3 num">
                            {iso8601ToClock(v.duration)}
                            {v.viewCount != null ? ` • ${v.viewCount} vues` : ''}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {nextPageToken && (
                  <div className="mt-4 text-center">
                    <Button variant="ghost" size="sm" onClick={() => loadVideos(true)} disabled={loadingVideos}>
                      {t('admin.stream.loadMore')}
                    </Button>
                  </div>
                )}
              </>
                )}
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default function AdminStreamPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" className="py-24" />}>
      <AdminStreamInner />
    </Suspense>
  );
}
