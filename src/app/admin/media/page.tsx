'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Images,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, type MediaAsset, type MediaLibraryPage, type MediaPurpose, type MediaStatus } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Badge, Button, Card, EmptyState, LoadingSpinner, PageHeader, Tabs, Textarea } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';

const PURPOSES: MediaPurpose[] = ['avatar', 'team', 'team-staff', 'sponsor', 'tournament', 'season', 'award', 'match'];
const STATUS_VARIANT: Record<MediaStatus, string> = { pending: 'gold', approved: 'green', rejected: 'red' };
const LIMIT = 24;

const selectCls =
  'rounded border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink-1 outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60';

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Admin media library (#131): every tracked upload, approval of pending images. */
export default function AdminMediaPage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const [status, setStatus] = useState<'all' | MediaStatus>('pending');
  const [purpose, setPurpose] = useState('');
  const [uploaderInput, setUploaderInput] = useState('');
  const [uploader, setUploader] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MediaLibraryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [toReject, setToReject] = useState<MediaAsset | null>(null);
  const [reason, setReason] = useState('');
  const [toDelete, setToDelete] = useState<MediaAsset | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.admin.media
      .list({ status: status === 'all' ? undefined : status, purpose: purpose || undefined, uploader: uploader || undefined, page, limit: LIMIT })
      .then(setData)
      .catch((e: any) => toast.error(e?.message || t('common.error')))
      .finally(() => setLoading(false));
  }, [status, purpose, uploader, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced uploader search.
  useEffect(() => {
    const id = setTimeout(() => {
      setUploader(uploaderInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [uploaderInput]);

  const act = async (asset: MediaAsset, fn: () => Promise<unknown>, done: string) => {
    setBusyId(asset.id);
    try {
      await fn();
      toast.success(t(done));
      setPreview(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const approve = (a: MediaAsset) => act(a, () => api.admin.media.approve(a.id), 'admin.media.approved');
  const runReject = async () => {
    if (!toReject) return;
    await act(toReject, () => api.admin.media.reject(toReject.id, reason.trim() || undefined), 'admin.media.rejected');
    setToReject(null);
    setReason('');
  };
  const runDelete = async () => {
    if (!toDelete) return;
    await act(toDelete, () => api.admin.media.remove(toDelete.id), 'admin.media.deleted');
    setToDelete(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

  const counts = data?.counts;
  const tabs = [
    { id: 'pending', label: t('admin.media.status.pending'), count: counts?.pending },
    { id: 'approved', label: t('admin.media.status.approved'), count: counts?.approved },
    { id: 'rejected', label: t('admin.media.status.rejected'), count: counts?.rejected },
    { id: 'all', label: t('admin.media.all') },
  ];

  const actions = (a: MediaAsset, full = false) => (
    <div className="flex flex-wrap items-center gap-2">
      {a.status === 'pending' && (
        <>
          <Button size="sm" variant="success" onClick={() => approve(a)} loading={busyId === a.id} disabled={!!busyId}>
            <Check size={14} /> {t('admin.media.approve')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setToReject(a)} disabled={!!busyId}>
            <X size={14} /> {t('admin.media.reject')}
          </Button>
        </>
      )}
      <Button size="sm" variant="ghost" onClick={() => setToDelete(a)} disabled={!!busyId} aria-label={t('admin.media.delete')}>
        <Trash2 size={14} className="text-accent-red" />
        {full && <span className="text-accent-red">{t('admin.media.delete')}</span>}
      </Button>
    </div>
  );

  const meta = (a: MediaAsset) => (
    <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-xs">
      <dt className="text-ink-3">{t('admin.media.target')}</dt>
      <dd className="truncate text-ink-1">{a.targetLabel ?? (a.targetId ? a.targetId : t('admin.media.noTarget'))}</dd>
      <dt className="text-ink-3">{t('admin.media.uploader')}</dt>
      <dd className="truncate text-ink-1">{a.uploader ?? '?'}</dd>
      <dt className="text-ink-3">{t('admin.media.date')}</dt>
      <dd className="text-ink-1">{formatDate(a.createdAt)}</dd>
      <dt className="text-ink-3">{t('admin.media.size')}</dt>
      <dd className="text-ink-1 num">
        {a.width}×{a.height} · {formatBytes(a.bytes)} · {a.format.toUpperCase()}
      </dd>
      {a.reviewer && (
        <>
          <dt className="text-ink-3">{t('admin.media.reviewer')}</dt>
          <dd className="truncate text-ink-1">{a.reviewer}</dd>
        </>
      )}
      {a.rejectReason && (
        <>
          <dt className="text-ink-3">{t('admin.media.reason')}</dt>
          <dd className="text-ink-1">{a.rejectReason}</dd>
        </>
      )}
    </dl>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Images size={28} />}
        eyebrow={t('nav.section.system')}
        title={t('admin.media.title')}
        subtitle={t('admin.media.subtitle')}
        variant="purple"
      />

      <div className="space-y-4">
        <div className="overflow-x-auto">
          <Tabs
            variant="underline"
            tabs={tabs}
            active={status}
            onChange={(id: any) => {
              setStatus(id);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            className={selectCls}
            value={purpose}
            aria-label={t('admin.media.purpose')}
            onChange={(e) => {
              setPurpose(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('admin.media.allPurposes')}</option>
            {PURPOSES.map((p) => (
              <option key={p} value={p}>
                {t(`admin.media.purpose.${p}`)}
              </option>
            ))}
          </select>
          <label className="relative block sm:w-72">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              className={`${selectCls} w-full pl-9`}
              placeholder={t('admin.media.searchUploader')}
              value={uploaderInput}
              onChange={(e) => setUploaderInput(e.target.value)}
            />
          </label>
          {data && <span className="text-xs text-ink-3 sm:ml-auto">{t('admin.media.total', { n: data.total })}</span>}
        </div>
      </div>

      {loading && !data ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={<Images size={28} />} title={t('admin.media.empty')} description={t('admin.media.emptyHint')} />
      ) : (
        <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ${loading ? 'opacity-60' : ''}`}>
          {data.items.map((a) => (
            <Card key={a.id} className="flex flex-col gap-3 !p-3">
              <button
                type="button"
                onClick={() => setPreview(a)}
                className="relative flex aspect-video items-center justify-center overflow-hidden rounded bg-surface-2"
                aria-label={t('admin.media.preview')}
              >
                {a.destroyed ? (
                  <span className="text-xs text-ink-3">{t('admin.media.destroyed')}</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt="" loading="lazy" className="h-full w-full object-contain" />
                )}
              </button>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" size="sm">
                  {t(`admin.media.purpose.${a.purpose}`)}
                </Badge>
                <Badge variant={STATUS_VARIANT[a.status]} size="sm" dot>
                  {t(`admin.media.status.${a.status}`)}
                </Badge>
                {a.status === 'approved' && (
                  <Badge variant={a.inUse ? 'blue' : 'default'} size="sm">
                    {t(a.inUse ? 'admin.media.inUse' : 'admin.media.unused')}
                  </Badge>
                )}
              </div>
              {meta(a)}
              <div className="mt-auto border-t border-line-subtle pt-3">{actions(a)}</div>
            </Card>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => p - 1)} disabled={page <= 1 || loading}>
            <ChevronLeft size={14} /> {t('admin.media.prev')}
          </Button>
          <span className="text-sm text-ink-2 num">
            {data.page} / {data.pages}
          </span>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page >= data.pages || loading}>
            {t('admin.media.next')} <ChevronRight size={14} />
          </Button>
        </div>
      )}

      <p className="text-xs text-ink-3">{t('admin.media.footnote')}</p>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ? t(`admin.media.purpose.${preview.purpose}`) : ''}
        subtitle={preview?.targetLabel ?? undefined}
        icon={<Images size={20} />}
        size="xl"
      >
        {preview && (
          <div className="space-y-4">
            <div className="flex max-h-[60vh] items-center justify-center overflow-hidden rounded bg-surface-2">
              {preview.destroyed ? (
                <span className="py-16 text-sm text-ink-3">{t('admin.media.destroyed')}</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt="" className="max-h-[60vh] w-auto object-contain" />
              )}
            </div>
            {meta(preview)}
            <p className="break-all text-[11px] text-ink-3">{preview.publicId}</p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {actions(preview, true)}
              {!preview.destroyed && (
                <a href={preview.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <ExternalLink size={14} /> {t('admin.media.open')}
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!toReject}
        onClose={() => setToReject(null)}
        title={t('admin.media.rejectTitle')}
        icon={<X size={20} />}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-2">{t('admin.media.rejectWarn')}</p>
          <Textarea
            label={t('admin.media.reason')}
            value={reason}
            maxLength={300}
            onChange={(e: any) => setReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setToReject(null)}>
              {t('common.cancel')}
            </Button>
            <Button size="sm" variant="danger" onClick={runReject} loading={!!toReject && busyId === toReject.id}>
              {t('admin.media.reject')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={runDelete}
        loading={!!toDelete && busyId === toDelete.id}
        variant="danger"
        title={t('admin.media.deleteTitle')}
        message={toDelete?.inUse ? t('admin.media.deleteInUse') : t('admin.media.deleteWarn')}
        confirmLabel={t('admin.media.delete')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
