'use client';

import { Heart, MessageCircle, Eye, Pin, Share2, Trash2, Handshake, PinOff } from 'lucide-react';
import { Card, Badge, Avatar } from '@/components/ui';
import { timeAgo, getRankName, cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { markdownToText } from '@/lib/markdown';
import { CATEGORY_META, normalizeCategory } from './constants';
import PostImages from './PostImages';

export type FeedPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorRank?: string | null;
  category: string;
  title: string;
  content: string;
  contentFormat?: string;
  images?: string[];
  likes: number;
  views: number;
  shares?: number;
  isPinned: boolean;
  isSponsored?: boolean;
  sponsorId?: string | null;
  sponsor?: { id: string; name: string | null; logo: string; url: string | null } | null;
  comments?: any[];
  commentCount?: number;
  likedByMe?: boolean;
  createdAt: string;
};

export function SponsorBadge({ sponsor, t }: { sponsor?: FeedPost['sponsor']; t: (k: string, p?: any) => string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning"
      title={sponsor?.name ? t('comm.sponsoredBy', { name: sponsor.name }) : t('comm.sponsored')}
    >
      {sponsor?.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sponsor.logo} alt={sponsor.name ?? ''} className="h-4 w-4 rounded-sm object-contain" />
      ) : (
        <Handshake size={12} />
      )}
      {t('comm.sponsored')}
      {sponsor?.name && <span className="font-normal text-body dark:text-bodydark">· {sponsor.name}</span>}
    </span>
  );
}

export default function PostCard({
  post,
  isStaff,
  canDelete,
  onOpen,
  onLike,
  onShare,
  onTogglePin,
  onSponsor,
  onDelete,
}: {
  post: FeedPost;
  isStaff: boolean;
  canDelete: boolean;
  onOpen: (post: FeedPost) => void;
  onLike: (post: FeedPost) => void;
  onShare: (post: FeedPost) => void;
  onTogglePin: (post: FeedPost) => void;
  onSponsor: (post: FeedPost) => void;
  onDelete: (post: FeedPost) => void;
}) {
  const t = useT();
  const category = normalizeCategory(post.category);
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  const commentCount = post.commentCount ?? post.comments?.length ?? 0;
  const excerpt = post.contentFormat === 'markdown' ? markdownToText(post.content) : post.content;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <Card
      className={cn(
        'cursor-pointer transition-shadow hover:shadow-md',
        post.isPinned && 'border-warning/40',
        post.isSponsored && 'bg-warning/[0.03]',
      )}
      onClick={() => onOpen(post)}
    >
      <div className="flex gap-3 sm:gap-4">
        <Avatar name={post.authorName} size="md" className="hidden sm:block" />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge variant={meta.badge} size="sm">
              <Icon size={12} />
              {t(`comm.cat.${category}`)}
            </Badge>
            {post.isPinned && (
              <Badge variant="gold" size="sm">
                <Pin size={12} />
                {t('comm.pinned')}
              </Badge>
            )}
            {post.isSponsored && <SponsorBadge sponsor={post.sponsor} t={t} />}
            <span className="ml-auto text-xs text-bodydark2" title={new Date(post.createdAt).toLocaleString()}>
              {timeAgo(post.createdAt)}
            </span>
          </div>

          <h3 className="mb-1 text-base font-bold text-black dark:text-white">{post.title}</h3>
          {excerpt && (
            <p className="mb-3 line-clamp-3 text-sm text-body dark:text-bodydark">{excerpt}</p>
          )}
          {post.images && post.images.length > 0 && (
            <PostImages images={post.images} compact className="mb-3" />
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-body dark:text-bodydark">
            <div className="flex min-w-0 items-center gap-1.5">
              <Avatar name={post.authorName} size="sm" className="sm:hidden" />
              <span className="truncate font-medium">{post.authorName}</span>
              {post.authorRank && (
                <Badge variant="neon" size="sm">{getRankName(post.authorRank)}</Badge>
              )}
            </div>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => { stop(e); onLike(post); }}
                aria-pressed={!!post.likedByMe}
                title={post.likedByMe ? t('comm.unlike') : t('comm.like')}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-gray-2 dark:hover:bg-meta-4',
                  post.likedByMe ? 'text-danger' : 'hover:text-danger',
                )}
              >
                <Heart size={14} className={post.likedByMe ? 'fill-current' : ''} />
                {post.likes}
              </button>
              <span className="flex items-center gap-1 px-2 py-1" title={t('comm.comments')}>
                <MessageCircle size={14} />
                {commentCount}
              </span>
              <button
                type="button"
                onClick={(e) => { stop(e); onShare(post); }}
                title={t('comm.share')}
                className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-gray-2 hover:text-primary dark:hover:bg-meta-4"
              >
                <Share2 size={14} />
                {post.shares ?? 0}
              </button>
              <span className="hidden items-center gap-1 px-2 py-1 sm:flex">
                <Eye size={14} />
                {post.views}
              </span>

              {(isStaff || canDelete) && (
                <span className="ml-1 flex items-center gap-0.5 border-l border-stroke pl-1 dark:border-strokedark">
                  {isStaff && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { stop(e); onTogglePin(post); }}
                        title={post.isPinned ? t('comm.admin.unpin') : t('comm.admin.pin')}
                        className="rounded-md p-1.5 transition-colors hover:bg-gray-2 hover:text-warning dark:hover:bg-meta-4"
                      >
                        {post.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { stop(e); onSponsor(post); }}
                        title={post.isSponsored ? t('comm.admin.unsponsor') : t('comm.admin.sponsor')}
                        className={cn(
                          'rounded-md p-1.5 transition-colors hover:bg-gray-2 dark:hover:bg-meta-4',
                          post.isSponsored ? 'text-warning' : 'hover:text-warning',
                        )}
                      >
                        <Handshake size={14} />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { stop(e); onDelete(post); }}
                    title={t('comm.admin.delete')}
                    className="rounded-md p-1.5 transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
