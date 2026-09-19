'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MessagesSquare, Plus, Clock, TrendingUp, Pin } from 'lucide-react';
import { Button, PageHeader, EmptyState, LoadingSpinner } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useAuthStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';
import PostCard, { type FeedPost } from '@/components/forum/PostCard';
import PostComposerModal from '@/components/forum/PostComposerModal';
import PostDetailModal from '@/components/forum/PostDetailModal';
import SponsorPickerModal from '@/components/forum/SponsorPickerModal';
import {
  FEED_CATEGORIES,
  FEED_SORTS,
  CATEGORY_META,
  isStaffRole,
  normalizeCategory,
  type FeedSort,
} from '@/components/forum/constants';

const PAGE_SIZE = 10;
const SORT_ICONS: Record<FeedSort, any> = { pinned: Pin, latest: Clock, popular: TrendingUp };

export default function CommunicationFeed() {
  const t = useT();
  const user = useAuthStore((s: any) => s.user);
  const isLoggedIn = !!user;
  const isStaff = isStaffRole(user?.roleUser);

  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<FeedSort>('pinned');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const likedIds = useRef<Set<string>>(new Set());

  const [showComposer, setShowComposer] = useState(false);
  const [selected, setSelected] = useState<FeedPost | null>(null);
  const [sponsorTarget, setSponsorTarget] = useState<FeedPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeedPost | null>(null);
  const [busy, setBusy] = useState(false);

  const decorate = useCallback(
    (list: FeedPost[]) => list.map((p) => ({ ...p, likedByMe: likedIds.current.has(p.id) })),
    [],
  );

  const patchPost = (id: string, patch: Partial<FeedPost> | ((p: FeedPost) => Partial<FeedPost>)) => {
    const apply = (p: FeedPost) => (p.id === id ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p);
    setPosts((l) => l.map(apply));
    setSelected((s) => (s && s.id === id ? apply(s) : s));
  };

  const refreshCounts = useCallback(() => {
    api.posts.categories().then((r: any) => setCounts(r?.counts ?? {}));
  }, []);

  const load = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res: any = await api.posts.feed({ category, sort, page: nextPage, limit: PAGE_SIZE });
        const items = decorate(Array.isArray(res?.items) ? res.items : []);
        setPosts((prev) => (append ? [...prev, ...items] : items));
        setPage(res?.page ?? nextPage);
        setHasMore(!!res?.hasMore);
        setTotal(res?.total ?? items.length);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, sort, decorate],
  );

  // Liked post ids for the current user, then the feed.
  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      if (isLoggedIn) {
        const ids: any = await api.posts.liked().catch(() => []);
        if (cancelled) return;
        likedIds.current = new Set(Array.isArray(ids) ? ids : []);
      } else {
        likedIds.current = new Set();
      }
      setPosts((l) => decorate(l));
    };
    boot();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, decorate]);

  useEffect(() => {
    load(1, false);
    refreshCounts();
  }, [load, refreshCounts]);

  const handleLike = async (post: FeedPost) => {
    if (!isLoggedIn) {
      toast.error(t('comm.loginToLike'));
      return;
    }
    const wasLiked = !!post.likedByMe;
    // Optimistic toggle.
    patchPost(post.id, (p) => ({ likedByMe: !wasLiked, likes: Math.max(0, p.likes + (wasLiked ? -1 : 1)) }));
    if (wasLiked) likedIds.current.delete(post.id);
    else likedIds.current.add(post.id);
    try {
      const res: any = await api.posts.like(post.id);
      if (res && typeof res.likes === 'number') {
        patchPost(post.id, { likedByMe: !!res.liked, likes: res.likes });
        if (res.liked) likedIds.current.add(post.id);
        else likedIds.current.delete(post.id);
      }
    } catch (e: any) {
      patchPost(post.id, (p) => ({ likedByMe: wasLiked, likes: Math.max(0, p.likes + (wasLiked ? 1 : -1)) }));
      if (wasLiked) likedIds.current.add(post.id);
      else likedIds.current.delete(post.id);
      toast.error(e?.message || t('common.error'));
    }
  };

  const handleShare = async (post: FeedPost) => {
    const url = `${window.location.origin}/forum?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t('comm.shareCopied'));
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      toast.error(t('comm.shareFailed'));
      return;
    }
    patchPost(post.id, (p) => ({ shares: (p.shares ?? 0) + 1 }));
    api.posts.share(post.id).then((r: any) => {
      if (r && typeof r.shares === 'number') patchPost(post.id, { shares: r.shares });
    }).catch(() => {});
  };

  const handleTogglePin = async (post: FeedPost) => {
    try {
      const updated = await api.posts.update(post.id, { isPinned: !post.isPinned });
      patchPost(post.id, { isPinned: !!updated?.isPinned });
      toast.success(t('comm.admin.pinSaved'));
      if (sort === 'pinned') load(1, false);
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    }
  };

  const handleSponsorSave = async (patch: { isSponsored: boolean; sponsorId: string | null }) => {
    if (!sponsorTarget) return;
    setBusy(true);
    try {
      const updated = await api.posts.update(sponsorTarget.id, patch);
      patchPost(sponsorTarget.id, {
        isSponsored: !!updated?.isSponsored,
        sponsorId: updated?.sponsorId ?? null,
        sponsor: updated?.sponsor ?? null,
      });
      toast.success(t('comm.admin.sponsorSaved'));
      setSponsorTarget(null);
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await api.posts.remove(deleteTarget.id);
      setPosts((l) => l.filter((p) => p.id !== deleteTarget.id));
      setTotal((n) => Math.max(0, n - 1));
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      toast.success(t('comm.admin.deleted'));
      refreshCounts();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const handleCreated = (post: FeedPost) => {
    const cat = normalizeCategory(post.category);
    if (category === 'all' || category === cat) {
      setPosts((l) => [{ ...post, likedByMe: false }, ...l]);
      setTotal((n) => n + 1);
    } else {
      setCategory(cat);
    }
    refreshCounts();
  };

  // Deep link: /forum?post=<id> opens the detail modal.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('post');
    if (!id) return;
    api.posts.get(id).then((p: any) => {
      if (p) setSelected({ ...p, likedByMe: likedIds.current.has(p.id) });
    });
  }, []);

  const tabs = ['all', ...FEED_CATEGORIES] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<MessagesSquare size={28} />}
        title={t('comm.title')}
        subtitle={t('comm.subtitle')}
        variant="danger"
        action={
          isLoggedIn ? (
            <Button onClick={() => setShowComposer(true)}>
              <Plus size={16} />
              {t('comm.newPost')}
            </Button>
          ) : undefined
        }
      />

      {/* Category tabs with counters */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2">
          {tabs.map((id) => {
            const meta = CATEGORY_META[id];
            const Icon = meta.icon;
            const active = category === id;
            const count = counts[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary text-white'
                    : 'border-stroke bg-white text-body hover:border-primary hover:text-primary dark:border-strokedark dark:bg-boxdark dark:text-bodydark',
                )}
              >
                <Icon size={15} />
                {t(`comm.cat.${id}`)}
                {typeof count === 'number' && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-xs',
                      active ? 'bg-white/20 text-white' : 'bg-gray-2 text-bodydark2 dark:bg-meta-4',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort control */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-bodydark2">{t('comm.postCount', { count: total })}</span>
        <div className="ml-auto inline-flex rounded-md border border-stroke bg-white p-1 dark:border-strokedark dark:bg-boxdark">
          {FEED_SORTS.map((id) => {
            const Icon = SORT_ICONS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSort(id)}
                className={cn(
                  'flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors',
                  sort === id ? 'bg-primary/10 text-primary' : 'text-body hover:bg-gray-2 dark:text-bodydark dark:hover:bg-meta-4',
                )}
              >
                <Icon size={13} />
                {t(`comm.sort.${id}`)}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare size={28} />}
          title={t('comm.empty')}
          description={t('comm.emptyHint')}
          action={
            isLoggedIn ? (
              <Button onClick={() => setShowComposer(true)}>
                <Plus size={16} />
                {t('comm.newPost')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 8) * 0.04 }}
            >
              <PostCard
                post={post}
                isStaff={isStaff}
                canDelete={isStaff || post.authorId === user?.id}
                onOpen={setSelected}
                onLike={handleLike}
                onShare={handleShare}
                onTogglePin={handleTogglePin}
                onSponsor={setSponsorTarget}
                onDelete={setDeleteTarget}
              />
            </motion.div>
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" loading={loadingMore} onClick={() => load(page + 1, true)}>
                {t('comm.loadMore')}
              </Button>
            </div>
          )}
        </div>
      )}

      <PostComposerModal
        open={showComposer}
        onClose={() => setShowComposer(false)}
        onCreated={handleCreated}
        isStaff={isStaff}
        defaultCategory={category}
      />

      <PostDetailModal
        post={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        isLoggedIn={isLoggedIn}
        onLike={handleLike}
        onShare={handleShare}
        onUpdated={(full) =>
          patchPost(full.id, {
            views: full.views,
            comments: full.comments,
            commentCount: full.commentCount ?? full.comments?.length ?? 0,
          })
        }
      />

      <SponsorPickerModal
        post={sponsorTarget}
        open={!!sponsorTarget}
        onClose={() => setSponsorTarget(null)}
        onSave={handleSponsorSave}
        saving={busy}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="danger"
        loading={busy}
        title={t('comm.admin.deleteTitle')}
        message={t('comm.admin.deleteMessage')}
        confirmLabel={t('comm.admin.delete')}
        cancelLabel={t('comm.composer.cancel')}
      />
    </div>
  );
}
