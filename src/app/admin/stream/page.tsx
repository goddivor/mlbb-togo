'use client';

import { useEffect, useState } from 'react';
import { Radio, Plus, Trash2, Save, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, Button, PageHeader, LoadingSpinner } from '@/components/ui';
import toast from 'react-hot-toast';

type VideoRow = {
  id: string;
  title: string;
  day: string;
  duration: string;
  date: string;
};

const emptyRow: VideoRow = { id: '', title: '', day: '', duration: '', date: '' };

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-stroke bg-gray-2 text-black placeholder-bodydark2 focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white';
const labelCls = 'mb-1.5 block text-sm font-medium text-black dark:text-white';

export default function AdminStreamPage() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [channel, setChannel] = useState('');
  const [liveTitle, setLiveTitle] = useState('');
  const [liveDesc, setLiveDesc] = useState('');
  const [s1MainVideoId, setS1MainVideoId] = useState('');
  const [videos, setVideos] = useState<VideoRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.stream.config();
        setChannel(data.youtubeChannel || '');
        setLiveTitle(data.liveTitle || '');
        setLiveDesc(data.liveDesc || '');
        setS1MainVideoId(data.s1MainVideoId || '');
        setVideos(
          (data.videos || []).map((v: any) => ({
            id: v.id || '',
            title: v.title || '',
            day: v.day || '',
            duration: v.duration || '',
            date: v.date || '',
          })),
        );
      } catch {
        /* fallback config already applied by the api layer */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateRow = (index: number, field: keyof VideoRow, value: string) => {
    setVideos((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addRow = () => setVideos((prev) => [...prev, { ...emptyRow }]);
  const removeRow = (index: number) => setVideos((prev) => prev.filter((_, i) => i !== index));

  const save = async () => {
    setSaving(true);
    try {
      await api.stream.updateConfig({
        youtubeChannel: channel.trim(),
        liveTitle: liveTitle.trim(),
        liveDesc: liveDesc.trim(),
        s1MainVideoId: s1MainVideoId.trim(),
        videos: videos.filter((v) => v.id.trim()),
      });
      toast.success(t('admin.stream.saved'));
    } catch (e: any) {
      toast.error(e?.message || t('admin.stream.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="py-24" />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Radio size={28} />}
        title={t('admin.stream.title')}
        subtitle={t('admin.stream.subtitle')}
        action={
          <div className="flex items-center gap-3">
            <a href="/stream" target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink size={16} /> {t('admin.stream.preview')}
              </Button>
            </a>
            <Button size="sm" onClick={save} disabled={saving}>
              <Save size={16} /> {t('admin.stream.save')}
            </Button>
          </div>
        }
      />

      {/* Channel + live */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
          {t('admin.stream.channelSection')}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelCls}>{t('admin.stream.channelLabel')}</label>
            <input
              className={inputCls}
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="eternumesports"
            />
            <p className="mt-1 text-xs text-bodydark2">{t('admin.stream.channelHelp')}</p>
          </div>
          <div>
            <label className={labelCls}>{t('admin.stream.liveTitleLabel')}</label>
            <input
              className={inputCls}
              value={liveTitle}
              onChange={(e) => setLiveTitle(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>{t('admin.stream.s1MainLabel')}</label>
            <input
              className={inputCls}
              value={s1MainVideoId}
              onChange={(e) => setS1MainVideoId(e.target.value)}
              placeholder="gmQZwF1e440"
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>{t('admin.stream.liveDescLabel')}</label>
            <input
              className={inputCls}
              value={liveDesc}
              onChange={(e) => setLiveDesc(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Season 1 videos */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black dark:text-white">
            {t('admin.stream.videosSection')}
          </h3>
          <Button variant="secondary" size="sm" onClick={addRow}>
            <Plus size={16} /> {t('admin.stream.addVideo')}
          </Button>
        </div>

        {videos.length === 0 ? (
          <p className="py-8 text-center text-sm text-bodydark2">{t('admin.stream.noVideos')}</p>
        ) : (
          <div className="space-y-3">
            {videos.map((v, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-2 rounded-lg border border-stroke p-3 dark:border-strokedark sm:grid-cols-12 sm:items-end"
              >
                <div className="sm:col-span-3">
                  <label className={labelCls}>{t('admin.stream.videoId')}</label>
                  <input
                    className={inputCls}
                    value={v.id}
                    onChange={(e) => updateRow(i, 'id', e.target.value)}
                    placeholder="gmQZwF1e440"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className={labelCls}>{t('admin.stream.videoTitle')}</label>
                  <input
                    className={inputCls}
                    value={v.title}
                    onChange={(e) => updateRow(i, 'title', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>{t('admin.stream.videoDay')}</label>
                  <input
                    className={inputCls}
                    value={v.day}
                    onChange={(e) => updateRow(i, 'day', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>{t('admin.stream.videoDuration')}</label>
                  <input
                    className={inputCls}
                    value={v.duration}
                    onChange={(e) => updateRow(i, 'duration', e.target.value)}
                    placeholder="12:34"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className={labelCls}>{t('admin.stream.videoDate')}</label>
                  <input
                    className={inputCls}
                    value={v.date}
                    onChange={(e) => updateRow(i, 'date', e.target.value)}
                    placeholder="2025-01-15"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(i)}
                    className="text-danger hover:bg-danger/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
