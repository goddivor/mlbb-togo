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
} from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, Button, PageHeader, LoadingSpinner } from '@/components/ui';
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

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-stroke bg-gray-2 text-black placeholder-bodydark2 focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white';
const labelCls = 'mb-1.5 block text-sm font-medium text-black dark:text-white';

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

  // Video selection
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [meta, setMeta] = useState<Record<string, VideoMeta>>({});
  const [savingSel, setSavingSel] = useState(false);

  const connected = !!status?.connected;

  const loadAll = useCallback(async () => {
    const [st, cfg, panel] = await Promise.all([
      api.stream.youtube.status(),
      api.stream.config(),
      api.stream.livePanel().catch(() => ({ active: false })),
    ]);
    setStatus(st);
    setLivePanel(panel);
    // Pre-select the videos already saved as Season 1.
    const savedSel = new Set<string>();
    const savedMeta: Record<string, VideoMeta> = {};
    for (const v of cfg.videos || []) {
      savedSel.add(v.id);
      savedMeta[v.id] = {
        title: v.title,
        thumbnail: v.thumbnail,
        duration: v.duration,
        date: v.date,
      };
    }
    setSelected(savedSel);
    setMeta(savedMeta);
  }, []);

  useEffect(() => {
    (async () => {
      await loadAll();
      setLoading(false);
    })();
  }, [loadAll]);

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
      await api.stream.updateConfig({
        videos: payloadVideos,
        s1MainVideoId: order[0] || '',
      });
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

  if (loading) return <LoadingSpinner size="lg" className="py-24" />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Radio size={28} />}
        title={t('admin.stream.title')}
        subtitle={t('admin.stream.subtitle')}
        action={
          <a href="/stream" target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm">
              <ExternalLink size={16} /> {t('admin.stream.preview')}
            </Button>
          </a>
        }
      />

      {/* 1. YouTube connection */}
      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
          <Youtube size={20} className="text-danger" /> {t('admin.stream.connectSection')}
        </h3>

        {connected ? (
          <div>
            <div className="overflow-hidden rounded-xl border border-stroke dark:border-strokedark">
              <div className="relative h-28 w-full bg-gray-2 dark:bg-meta-4">
                {status.channelBanner && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={status.channelBanner} alt="" className="h-full w-full object-cover" />
                )}
                {status.channelThumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={status.channelThumbnail}
                    alt={status.channelTitle}
                    className="absolute left-1/2 top-full h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white object-cover shadow-lg dark:border-boxdark"
                  />
                )}
              </div>
              <p className="mt-10 pb-3 text-center text-sm font-semibold text-black dark:text-white">
                {status.channelTitle}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm text-success">
                <Check size={16} /> {t('admin.stream.connectedLabel')}
              </span>
              <Button variant="ghost" size="sm" onClick={disconnect} className="text-danger hover:bg-danger/10">
                <Unlink size={16} /> {t('admin.stream.disconnect')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-sm text-body dark:text-bodydark">
              {t('admin.stream.connectHelp')}
            </p>
            <Button onClick={connect}>
              <Link2 size={16} /> {t('admin.stream.connectBtn')}
            </Button>
          </div>
        )}
      </Card>

      {connected && (
        <>
          {/* 2. Go live */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
              <Zap size={20} className="text-primary" /> {t('admin.stream.liveSection')}
            </h3>

            {livePanel.active ? (
              <div className="space-y-4">
                <p className="text-sm text-body dark:text-bodydark">{t('admin.stream.liveInstructions')}</p>
                <div>
                  <label className={labelCls}>{t('admin.stream.rtmpUrl')}</label>
                  <div className="flex gap-2">
                    <input className={inputCls} readOnly value={livePanel.rtmpUrl || ''} />
                    <Button variant="secondary" size="sm" onClick={() => copy(livePanel.rtmpUrl || '')}>
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('admin.stream.streamKey')}</label>
                  <div className="flex gap-2">
                    <input
                      className={inputCls}
                      readOnly
                      type={showKey ? 'text' : 'password'}
                      value={livePanel.streamKey || ''}
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
                  <Button
                    size="sm"
                    onClick={stopLive}
                    disabled={stopping}
                    className="bg-danger text-white hover:bg-danger/90"
                  >
                    <Square size={16} /> {t('admin.stream.stopLive')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
                <div className="md:col-span-2">
                  <label className={labelCls}>{t('admin.stream.liveTitleLabel')}</label>
                  <input
                    className={inputCls}
                    value={liveTitle}
                    onChange={(e) => setLiveTitle(e.target.value)}
                    placeholder="MLBB Togo — Live"
                  />
                </div>
                <div>
                  <label className={labelCls}>{t('admin.stream.privacy')}</label>
                  <select className={inputCls} value={privacy} onChange={(e) => setPrivacy(e.target.value)}>
                    <option value="public">{t('admin.stream.privacyPublic')}</option>
                    <option value="unlisted">{t('admin.stream.privacyUnlisted')}</option>
                    <option value="private">{t('admin.stream.privacyPrivate')}</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <Button onClick={startLive} disabled={starting}>
                    <Zap size={16} /> {t('admin.stream.startLive')}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* 3. Season 1 video selection */}
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
                <Play size={20} className="text-primary" /> {t('admin.stream.videosSection')}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-bodydark2">
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
            </div>

            {videos.length === 0 ? (
              <p className="py-8 text-center text-sm text-bodydark2">{t('admin.stream.loadHint')}</p>
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
                        className={`flex items-center gap-3 rounded-lg border p-2 text-left transition ${
                          isSel
                            ? 'border-primary bg-primary/5'
                            : 'border-stroke hover:border-primary/50 dark:border-strokedark'
                        }`}
                      >
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-gray-2 dark:bg-meta-4">
                          {v.thumbnail && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                          )}
                          {isSel && (
                            <span className="absolute inset-0 flex items-center justify-center bg-primary/60">
                              <Check size={18} className="text-white" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-black dark:text-white">{v.title}</p>
                          <p className="text-xs text-bodydark2">
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
