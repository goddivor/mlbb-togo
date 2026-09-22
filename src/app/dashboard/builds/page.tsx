'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Hammer, Plus } from 'lucide-react';
import { api, type CommunityBuild } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button, EmptyState, PageHeader, SectionCard, Select, Skeleton, Tabs } from '@/components/ui';
import CommunityBuildCard from '@/components/builds/CommunityBuildCard';
import BuildEditor from '@/components/builds/BuildEditor';
import { useBuildInteractions } from '@/components/builds/useBuildInteractions';
import { BUILD_LANES } from '@/components/builds/shared';

const PAGE_SIZE = 12;

type Sort = 'likes' | 'recent';

const readHeroParam = () =>
  typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('hero') ?? '';

/** Public community builds: filters by hero and lane, sort by likes or date. */
export default function CommunityBuildsPage() {
  const t = useT();
  const [heroes, setHeroes] = useState<{ id: string; name: string; heroId?: number | null }[]>([]);
  const [hero, setHero] = useState('');
  const [lane, setLane] = useState('');
  const [sort, setSort] = useState<Sort>('likes');
  const [builds, setBuilds] = useState<CommunityBuild[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const patch = useCallback((id: string, p: Partial<CommunityBuild>) => {
    setBuilds((list) => list.map((b) => (b.id === id ? { ...b, ...p } : b)));
  }, []);
  const { toggleLike, openReport, likeBusy, reportModal } = useBuildInteractions(patch);

  useEffect(() => {
    setHero(readHeroParam());
    api.heroes
      .list()
      .then((list: any[]) => setHeroes([...(Array.isArray(list) ? list : [])].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setHeroes([]));
  }, []);

  const load = useCallback(
    async (nextPage: number) => {
      if (nextPage === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const res = await api.communityBuilds.list({
          hero: hero || undefined,
          lane: lane || undefined,
          sort,
          page: nextPage,
          limit: PAGE_SIZE,
        });
        setBuilds((list) => (nextPage === 1 ? res.items : [...list, ...res.items]));
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(nextPage);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [hero, lane, sort],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const changeHero = (value: string) => {
    setHero(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('hero', value);
    else url.searchParams.delete('hero');
    window.history.replaceState(null, '', url.toString());
  };

  const heroOptions = useMemo(
    () => [
      { value: '', label: t('communityBuilds.filters.allHeroes') },
      ...heroes.map((h) => ({ value: String(h.heroId ?? h.id), label: h.name })),
    ],
    [heroes, t],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.section.catalog')}
        icon={<Hammer size={20} />}
        title={t('communityBuilds.title')}
        subtitle={t('communityBuilds.subtitle')}
        action={
          <Button size="sm" onClick={() => setEditorOpen(true)}>
            <Plus size={16} /> {t('communityBuilds.create')}
          </Button>
        }
      />

      <SectionCard className="!p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full sm:max-w-xs">
            <Select
              label={t('communityBuilds.filters.hero')}
              options={heroOptions}
              value={hero}
              onChange={(e: any) => changeHero(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="no-scrollbar overflow-x-auto">
              <Tabs
                size="sm"
                tabs={[
                  { id: '', label: t('communityBuilds.filters.allLanes') },
                  ...BUILD_LANES.map((l) => ({ id: l, label: t(`heroMeta.lane.${l}`) })),
                ]}
                active={lane}
                onChange={setLane}
              />
            </div>
            <Tabs
              size="sm"
              tabs={[
                { id: 'likes', label: t('communityBuilds.sort.likes') },
                { id: 'recent', label: t('communityBuilds.sort.recent') },
              ]}
              active={sort}
              onChange={(id: Sort) => setSort(id)}
            />
          </div>
        </div>
      </SectionCard>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-line-subtle bg-surface-1 p-4">
              <Skeleton lines={4} />
            </div>
          ))}
        </div>
      ) : builds.length === 0 ? (
        <EmptyState
          className="!min-h-0"
          icon={<Hammer size={28} />}
          title={t('communityBuilds.empty.title')}
          description={t('communityBuilds.empty.description')}
          action={
            <Button size="sm" onClick={() => setEditorOpen(true)}>
              <Plus size={16} /> {t('communityBuilds.create')}
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-sm text-ink-3">{t('communityBuilds.count', { n: total })}</p>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {builds.map((b) => (
              <CommunityBuildCard
                key={b.id}
                build={b}
                onToggleLike={toggleLike}
                onReport={openReport}
                likeBusy={likeBusy === b.id}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" loading={loadingMore} onClick={() => load(page + 1)}>
                {t('communityBuilds.loadMore')}
              </Button>
            </div>
          )}
        </>
      )}

      <BuildEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        defaultHero={hero || null}
        onSaved={() => {
          setEditorOpen(false);
          load(1);
        }}
      />
      {reportModal}
    </div>
  );
}
