'use client';

import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Eye, Pin, Share2, Send } from 'lucide-react';
import { Badge, Avatar, Button, LoadingSpinner } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { timeAgo, getRankName, cn } from '@/lib/helpers';
import toast from 'react-hot-toast';
import MarkdownContent from './MarkdownContent';
import PostImages from './PostImages';
import { SponsorBadge, type FeedPost } from './PostCard';
import { CATEGORY_META, normalizeCategory } from './constants';

export default function PostDetailModal({
  post,
  open,
  onClose,
  isLoggedIn,
  onLike,
  onShare,
  onUpdated,
}: {
  post: FeedPost | null;
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onLike: (post: FeedPost) => void;
  onShare: (post: FeedPost) => void;
  /** Called with the fresh post (views, comments) so the feed stays in sync. */
  onUpdated: (post: FeedPost) => void;
}) {
  const t = useT();
  const [detail, setDetail] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !post?.id) return;
    let cancelled = false;
    setLoading(true);
    api.posts
      .get(post.id)
      .then((full: any) => {
        if (cancelled || !full) return;
        setDetail(full);
        onUpdated(full);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post?.id]);

  // Keep counters (likes, shares) in sync with the optimistic feed state.
  const merged: FeedPost | null = post
    ? { ...(detail ?? post), likes: post.likes, likedByMe: post.likedByMe, shares: post.shares, isPinned: post.isPinned, isSponsored: post.isSponsored, sponsor: post.sponsor }
    : null;

  const sendComment = async () => {
    const content = comment.trim();
    if (!content || !merged) return;
    setSending(true);
    try {
      const updated = await api.posts.comment(merged.id, { content });
      setComment('');
      if (updated) {
        setDetail(updated);
        onUpdated(updated);
      }
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setSending(false);
    }
  };

  if (!merged) return null;
  const category = normalizeCategory(merged.category);
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  const comments = merged.comments ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      closeLabel={t('common.close')}
      icon={<Icon size={20} />}
      title={merged.title}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={meta.badge} size="sm">
            <Icon size={12} />
            {t(`comm.cat.${category}`)}
          </Badge>
          {merged.isPinned && (
            <Badge variant="gold" size="sm"><Pin size={12} />{t('comm.pinned')}</Badge>
          )}
          {merged.isSponsored && <SponsorBadge sponsor={merged.sponsor} t={t} />}
          <span className="ml-auto text-xs text-ink-3" title={new Date(merged.createdAt).toLocaleString()}>
            {timeAgo(merged.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Avatar name={merged.authorName} size="sm" />
          <span className="font-medium text-ink-1">{merged.authorName}</span>
          {merged.authorRank && <Badge variant="neon" size="sm">{getRankName(merged.authorRank)}</Badge>}
        </div>

        {merged.isSponsored && merged.sponsor?.logo && (
          <a
            href={merged.sponsor.url ?? undefined}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex items-center gap-3 rounded-lg border border-accent-gold/30 bg-accent-gold/5 p-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={merged.sponsor.logo} alt={merged.sponsor.name ?? ''} className="h-10 max-w-[8rem] object-contain" />
            <span className="text-xs text-ink-2">
              {merged.sponsor.name ? t('comm.sponsoredBy', { name: merged.sponsor.name }) : t('comm.sponsored')}
            </span>
          </a>
        )}

        <MarkdownContent content={merged.content} format={merged.contentFormat} />
        {merged.images && merged.images.length > 0 && <PostImages images={merged.images} />}

        <div className="flex flex-wrap items-center gap-2 border-y border-line-subtle py-3 text-sm text-ink-2">
          <button
            type="button"
            onClick={() => onLike(merged)}
            aria-pressed={!!merged.likedByMe}
            className={cn(
              'flex items-center gap-1.5 rounded px-3 py-1.5 num transition-colors duration-fast hover:bg-surface-2',
              merged.likedByMe ? 'text-accent-red' : 'hover:text-accent-red',
            )}
          >
            <Heart size={16} className={merged.likedByMe ? 'fill-current' : ''} />
            {merged.likes} · {merged.likedByMe ? t('comm.unlike') : t('comm.like')}
          </button>
          <button
            type="button"
            onClick={() => onShare(merged)}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 num transition-colors duration-fast hover:bg-surface-2 hover:text-primary"
          >
            <Share2 size={16} />
            {merged.shares ?? 0} · {t('comm.share')}
          </button>
          <span className="ml-auto flex items-center gap-1.5 text-xs">
            <Eye size={14} />
            {t('comm.detail.views', { count: merged.views })}
          </span>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-ink-1">
            <MessageCircle size={16} />
            {t('comm.comments')} ({comments.length})
          </h3>
          {loading && comments.length === 0 ? (
            <LoadingSpinner size="sm" />
          ) : comments.length === 0 ? (
            <p className="text-sm text-ink-3">{t('comm.detail.noComments')}</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={c.authorName} size="sm" />
                  <div className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink-1">{c.authorName}</span>
                      <span className="text-xs text-ink-3">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink-2">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isLoggedIn ? (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder={t('forum.addComment')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendComment();
                  }
                }}
                className="flex-1 rounded border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink-1 outline-none placeholder:text-ink-3 transition-[border-color,box-shadow] duration-base focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
              />
              <Button size="sm" loading={sending} disabled={!comment.trim()} onClick={sendComment}>
                <Send size={14} />
                {t('forum.send')}
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-xs text-ink-3">{t('comm.detail.loginToComment')}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
