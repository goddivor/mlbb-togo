'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Eye, EyeOff, ShieldAlert, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, type CommunityBuild } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, Button, EmptyState, Input, PageHeader, Skeleton, Tabs } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import CommunityBuildCard from '@/components/builds/CommunityBuildCard';
import { buildErrorMessage } from '@/components/builds/shared';

type Filter = 'reported' | 'hidden' | 'all';
const PAGE_SIZE = 20;

/** Moderation of the community builds (`builds.moderate`). */
export default function AdminBuildsModerationPage() {
  const t = useT();
  const [filter, setFilter] = useState<Filter>('reported');
  const [builds, setBuilds] = useState<CommunityBuild[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [hiding, setHiding] = useState<CommunityBuild | null>(null);
  const [reason, setReason] = useState('');
  const [toDelete, setToDelete] = useState<CommunityBuild | null>(null);

  const load = useCallback(
    async (nextPage = 1) => {
      setLoading(nextPage === 1);
      try {
        const res = await api.communityBuilds.moderation({ filter, page: nextPage, limit: PAGE_SIZE });
        setBuilds((list) => (nextPage === 1 ? res.items : [...list, ...res.items]));
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(nextPage);
      } catch (err) {
        toast.error(buildErrorMessage(t, err));
      } finally {
        setLoading(false);
      }
    },
    [filter, t],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const act = async (build: CommunityBuild, fn: () => Promise<unknown>, done: string) => {
    setBusy(build.id);
    try {
      await fn();
      toast.success(done);
      await load(1);
    } catch (err) {
      toast.error(buildErrorMessage(t, err));
    } finally {
      setBusy(null);
    }
  };

  const confirmHide = async () => {
    if (!hiding) return;
    const target = hiding;
    setHiding(null);
    await act(target, () => api.communityBuilds.hide(target.id, reason.trim() || undefined), t('communityBuilds.moderation.hidden'));
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const target = toDelete;
    await act(target, () => api.communityBuilds.moderatorDelete(target.id), t('communityBuilds.toast.deleted'));
    setToDelete(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.section.community')}
        icon={<ShieldAlert size={20} />}
        title={t('communityBuilds.moderation.title')}
        subtitle={t('communityBuilds.moderation.subtitle')}
      />

      <div className="no-scrollbar overflow-x-auto">
        <Tabs
          size="sm"
          tabs={[
            { id: 'reported', label: t('communityBuilds.moderation.reported') },
            { id: 'hidden', label: t('communityBuilds.moderation.hiddenTab') },
            { id: 'all', label: t('communityBuilds.moderation.all') },
          ]}
          active={filter}
          onChange={(id: Filter) => setFilter(id)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-lg border border-line-subtle bg-surface-1 p-4">
              <Skeleton lines={4} />
            </div>
          ))}
        </div>
      ) : builds.length === 0 ? (
        <EmptyState
          className="!min-h-0"
          icon={<ShieldAlert size={28} />}
          title={filter === 'reported' ? t('communityBuilds.moderation.emptyReported') : t('communityBuilds.moderation.empty')}
        />
      ) : (
        <>
          <p className="text-sm text-ink-3">{t('communityBuilds.count', { n: total })}</p>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {builds.map((b) => (
              <CommunityBuildCard
                key={b.id}
                build={b}
                showStatus
                actions={
                  <>
                    {b.status === 'hidden' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={busy === b.id}
                        onClick={() => act(b, () => api.communityBuilds.unhide(b.id), t('communityBuilds.moderation.unhidden'))}
                      >
                        <Eye size={14} /> {t('communityBuilds.moderation.unhide')}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={busy === b.id}
                        onClick={() => {
                          setReason('');
                          setHiding(b);
                        }}
                      >
                        <EyeOff size={14} /> {t('communityBuilds.moderation.hide')}
                      </Button>
                    )}
                    {(b.reportsCount ?? 0) > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === b.id}
                        onClick={() => act(b, () => api.communityBuilds.dismissReports(b.id), t('communityBuilds.moderation.dismissed'))}
                      >
                        <Check size={14} /> {t('communityBuilds.moderation.dismiss')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      aria-label={t('communityBuilds.actions.delete')}
                      onClick={() => setToDelete(b)}
                    >
                      <Trash2 size={14} className="text-accent-red" />
                    </Button>
                  </>
                }
              >
                {(b.reports?.length ?? 0) > 0 && (
                  <div className="mt-3 space-y-2 rounded border border-accent-gold/30 bg-accent-gold/5 p-3">
                    <p className="text-xs font-semibold text-accent-gold">
                      {t('communityBuilds.moderation.reportsCount', { n: b.reportsCount ?? b.reports!.length })}
                    </p>
                    <ul className="space-y-1.5">
                      {b.reports!.map((r) => (
                        <li key={r.id} className="text-xs text-ink-2">
                          <Badge size="sm" variant="gold">
                            {t(`communityBuilds.report.reason.${r.reason}`)}
                          </Badge>{' '}
                          <span className="font-semibold text-ink-1">
                            {r.reporter?.displayName || r.reporter?.username || '?'}
                          </span>
                          {r.details && <span className="text-ink-2"> : {r.details}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CommunityBuildCard>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={() => load(page + 1)}>
                {t('communityBuilds.loadMore')}
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        open={!!hiding}
        onClose={() => setHiding(null)}
        closeLabel={t('common.close')}
        size="sm"
        icon={<EyeOff size={20} />}
        title={t('communityBuilds.moderation.hideTitle')}
        subtitle={hiding?.title}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirmHide();
          }}
          className="space-y-3"
        >
          <Input
            label={t('communityBuilds.moderation.hideReason')}
            value={reason}
            maxLength={300}
            onChange={(e: any) => setReason(e.target.value)}
          />
          <p className="text-xs text-ink-3">{t('communityBuilds.moderation.hideHelp')}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setHiding(null)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" variant="danger">
              {t('communityBuilds.moderation.hide')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        variant="danger"
        loading={busy === toDelete?.id}
        title={t('communityBuilds.delete.title')}
        message={t('communityBuilds.moderation.deleteMessage')}
        confirmLabel={t('communityBuilds.actions.delete')}
        cancelLabel={t('common.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}
