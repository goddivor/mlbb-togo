'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { EyeOff, Pencil, Plus, Send, Trash2, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, type CommunityBuild } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button, EmptyState, PageHeader, Skeleton, Tabs } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import CommunityBuildCard from '@/components/builds/CommunityBuildCard';
import BuildEditor from '@/components/builds/BuildEditor';
import { buildErrorMessage } from '@/components/builds/shared';

type Filter = 'all' | CommunityBuild['status'];

/** The signed-in player's builds: drafts, published and hidden ones. */
export default function MyBuildsPage() {
  const t = useT();
  const [builds, setBuilds] = useState<CommunityBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [editor, setEditor] = useState<{ build: CommunityBuild | null; hero: string | null } | null>(null);
  const [toDelete, setToDelete] = useState<CommunityBuild | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setBuilds(await api.communityBuilds.mine());
    } catch (err) {
      toast.error(buildErrorMessage(t, err));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
    // Deep link from the hero modal: /my-builds?create=1&hero=<id>
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === '1') {
      setEditor({ build: null, hero: params.get('hero') });
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [load]);

  const counts = useMemo(() => {
    const c = { all: builds.length, draft: 0, published: 0, hidden: 0 };
    for (const b of builds) c[b.status]++;
    return c;
  }, [builds]);

  const shown = filter === 'all' ? builds : builds.filter((b) => b.status === filter);

  const replace = (build: CommunityBuild) =>
    setBuilds((list) => {
      const rest = list.filter((b) => b.id !== build.id);
      return [build, ...rest];
    });

  const run = async (build: CommunityBuild, action: 'publish' | 'unpublish') => {
    setBusy(build.id);
    try {
      const updated = await api.communityBuilds[action](build.id);
      replace(updated);
      toast.success(action === 'publish' ? t('communityBuilds.toast.published') : t('communityBuilds.toast.unpublished'));
    } catch (err) {
      toast.error(buildErrorMessage(t, err));
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(toDelete.id);
    try {
      await api.communityBuilds.remove(toDelete.id);
      setBuilds((list) => list.filter((b) => b.id !== toDelete.id));
      toast.success(t('communityBuilds.toast.deleted'));
      setToDelete(null);
    } catch (err) {
      toast.error(buildErrorMessage(t, err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('communityBuilds.title')}
        icon={<Wrench size={20} />}
        title={t('communityBuilds.mine.title')}
        subtitle={t('communityBuilds.mine.subtitle')}
        action={
          <Button size="sm" onClick={() => setEditor({ build: null, hero: null })}>
            <Plus size={16} /> {t('communityBuilds.create')}
          </Button>
        }
      />

      <div className="no-scrollbar overflow-x-auto">
        <Tabs
          size="sm"
          tabs={(['all', 'draft', 'published', 'hidden'] as Filter[]).map((f) => ({
            id: f,
            label: f === 'all' ? t('communityBuilds.mine.all') : t(`communityBuilds.status.${f}`),
            count: counts[f],
          }))}
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
      ) : shown.length === 0 ? (
        <EmptyState
          className="!min-h-0"
          icon={<Wrench size={28} />}
          title={t('communityBuilds.mine.empty')}
          description={t('communityBuilds.mine.emptyDescription')}
          action={
            <Button size="sm" onClick={() => setEditor({ build: null, hero: null })}>
              <Plus size={16} /> {t('communityBuilds.create')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {shown.map((b) => (
            <CommunityBuildCard
              key={b.id}
              build={b}
              showStatus
              actions={
                <>
                  <Button size="sm" variant="ghost" onClick={() => setEditor({ build: b, hero: null })}>
                    <Pencil size={14} /> {t('communityBuilds.actions.edit')}
                  </Button>
                  {b.status === 'draft' && (
                    <Button size="sm" variant="secondary" loading={busy === b.id} onClick={() => run(b, 'publish')}>
                      <Send size={14} /> {t('communityBuilds.editor.publish')}
                    </Button>
                  )}
                  {b.status === 'published' && (
                    <Button size="sm" variant="outline" loading={busy === b.id} onClick={() => run(b, 'unpublish')}>
                      <EyeOff size={14} /> {t('communityBuilds.actions.unpublish')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => setToDelete(b)}
                    aria-label={t('communityBuilds.actions.delete')}
                  >
                    <Trash2 size={14} className="text-accent-red" />
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}

      <BuildEditor
        open={!!editor}
        build={editor?.build ?? null}
        defaultHero={editor?.hero ?? null}
        onClose={() => setEditor(null)}
        onSaved={(saved) => {
          replace(saved);
          setEditor(null);
        }}
      />

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        variant="danger"
        loading={busy === toDelete?.id}
        title={t('communityBuilds.delete.title')}
        message={t('communityBuilds.delete.message')}
        confirmLabel={t('communityBuilds.actions.delete')}
        cancelLabel={t('common.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}
