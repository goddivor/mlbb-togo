'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import type { CommunityBuild } from '@/lib/api';
import { Avatar, Badge } from '@/components/ui';
import { CatalogIcon } from '@/components/catalog/shared';
import { HeroPortrait } from '@/components/game/hero-meta/shared';
import { LikeButton, StatusBadge } from './shared';

/**
 * One community build: hero, title, author, the 6 item slots, emblem with its
 * talents, battle spell and notes. Like / report controls are shown when the
 * matching handler is given; `actions` holds owner or moderator buttons.
 */
export default function CommunityBuildCard({
  build,
  onToggleLike,
  onReport,
  actions,
  showHero = true,
  showStatus = false,
  likeBusy = false,
  children,
}: {
  build: CommunityBuild;
  onToggleLike?: (build: CommunityBuild) => void;
  onReport?: (build: CommunityBuild) => void;
  actions?: React.ReactNode;
  showHero?: boolean;
  showStatus?: boolean;
  likeBusy?: boolean;
  children?: React.ReactNode;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const author = build.author?.displayName || build.author?.username || t('communityBuilds.unknownAuthor');
  const slots = Array.from({ length: 6 }, (_, i) => build.items[i] ?? null);
  const notes = build.notes?.trim() ?? '';
  const longNotes = notes.length > 180;
  const likeLabel = build.isMine
    ? t('communityBuilds.like.own')
    : build.likedByMe
      ? t('communityBuilds.like.remove')
      : t('communityBuilds.like.add');

  return (
    <article className="rounded-lg border border-line-subtle bg-surface-1 p-4 shadow-elev-1 dark:bg-surface-2/40">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {showHero && <HeroPortrait src={build.hero.image} name={build.hero.name} size={44} />}
          <div className="min-w-0">
            <h4 className="truncate font-display text-base font-bold text-ink-1">{build.title}</h4>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
              {showHero && <span className="font-semibold text-ink-2">{build.hero.name}</span>}
              <span className="inline-flex items-center gap-1.5">
                <Avatar name={author} src={build.author?.avatar} size="xs" />
                {author}
              </span>
              {build.lane && (
                <Badge size="sm" variant="blue">
                  {t(`heroMeta.lane.${build.lane}`)}
                </Badge>
              )}
              {showStatus && <StatusBadge status={build.status} t={t} />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LikeButton
            liked={build.likedByMe}
            count={build.likesCount}
            label={likeLabel}
            busy={likeBusy}
            disabled={!onToggleLike || build.isMine || build.status !== 'published'}
            onToggle={onToggleLike ? () => onToggleLike(build) : undefined}
          />
          {onReport && !build.isMine && build.status === 'published' && (
            <button
              type="button"
              onClick={() => onReport(build)}
              disabled={build.reportedByMe}
              title={build.reportedByMe ? t('communityBuilds.report.done') : t('communityBuilds.report.action')}
              aria-label={build.reportedByMe ? t('communityBuilds.report.done') : t('communityBuilds.report.action')}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-ink-3 transition-colors hover:bg-surface-2 hover:text-accent-red disabled:cursor-default disabled:text-accent-red/60 disabled:hover:bg-transparent"
            >
              <Flag size={14} className={build.reportedByMe ? 'fill-current' : ''} />
            </button>
          )}
        </div>
      </header>

      <div className="mt-4 grid grid-cols-6 gap-1.5 sm:gap-2" aria-label={t('heroes.builds.items')}>
        {slots.map((item, i) =>
          item ? (
            <div
              key={`${item.id}-${i}`}
              title={item.name}
              className={cn('flex flex-col items-center gap-1', item.enabled === false && 'opacity-50')}
            >
              <CatalogIcon src={item.icon} alt={item.name} size={40} />
              <span className="line-clamp-1 w-full text-center text-[10px] leading-tight text-ink-3">{item.name}</span>
            </div>
          ) : (
            <div
              key={`empty-${i}`}
              className="h-10 w-10 justify-self-center rounded border border-dashed border-line-strong"
              aria-hidden="true"
            />
          ),
        )}
      </div>

      {(build.emblem || build.talents.length > 0 || build.battleSpell) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {build.emblem && (
            <span
              title={t('heroes.builds.emblem')}
              className="inline-flex items-center gap-1.5 rounded border border-line-subtle bg-surface-2/60 py-1 pl-1 pr-2 text-xs text-ink-1"
            >
              <CatalogIcon src={build.emblem.icon} alt="" size={22} round />
              {build.emblem.name}
            </span>
          )}
          {build.talents.map((talent) => (
            <span
              key={talent.id}
              title={talent.description || talent.name}
              className="inline-flex items-center gap-1.5 rounded border border-line-subtle bg-surface-2/60 py-1 pl-1 pr-2 text-xs text-ink-2"
            >
              <CatalogIcon src={talent.icon} alt="" size={22} round />
              {talent.name}
            </span>
          ))}
          {build.battleSpell && (
            <span
              title={t('heroes.builds.battleSpell')}
              className="inline-flex items-center gap-1.5 rounded border border-accent-violet/30 bg-accent-violet/10 py-1 pl-1 pr-2 text-xs text-ink-1"
            >
              <CatalogIcon src={build.battleSpell.icon} alt="" size={22} round />
              {build.battleSpell.name}
            </span>
          )}
        </div>
      )}

      {notes && (
        <div className="mt-3">
          <p className={cn('whitespace-pre-line text-sm leading-relaxed text-ink-2', !expanded && longNotes && 'line-clamp-3')}>
            {notes}
          </p>
          {longNotes && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs font-semibold text-primary hover:underline"
            >
              {expanded ? t('communityBuilds.notes.less') : t('communityBuilds.notes.more')}
            </button>
          )}
        </div>
      )}

      {build.status === 'hidden' && (
        <p className="mt-3 rounded border border-accent-red/30 bg-accent-red/5 px-3 py-2 text-xs text-accent-red">
          {build.hiddenReason
            ? t('communityBuilds.hiddenWithReason', { reason: build.hiddenReason })
            : t('communityBuilds.hiddenNotice')}
        </p>
      )}

      {children}

      {actions && <footer className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3">{actions}</footer>}
    </article>
  );
}
