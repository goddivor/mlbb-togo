'use client';

import { useMemo } from 'react';
import { HelpCircle, Lock, Users2 } from 'lucide-react';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { GamificationIcon } from './icons';
import FrameThumb from './rewards/FrameThumb';
import { familyOrder, formatPercent, rarityStyle } from './achievements';

export interface AchievementItem {
  id: string;
  icon: string;
  reward: number;
  secret: boolean;
  /** Secret and not unlocked yet: no name nor description. */
  hidden?: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  family?: string | null;
  rarity?: string | null;
  frameId?: string | null;
  /** Share of members who unlocked it (0..100). */
  percent?: number | null;
}

/** Achievements grouped by family, with rarity, frame and share of members. */
export default function AchievementsGrid({ items, grouped = true }: { items: AchievementItem[]; grouped?: boolean }) {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const sections = useMemo(() => {
    if (!grouped) return [{ family: null as string | null, items }];
    const map = new Map<string, AchievementItem[]>();
    for (const a of items) {
      const key = a.family ?? 'other';
      map.set(key, [...(map.get(key) ?? []), a]);
    }
    return [...map.entries()]
      .sort((a, b) => familyOrder(a[0]) - familyOrder(b[0]))
      .map(([family, list]) => ({ family: family as string | null, items: list }));
  }, [items, grouped]);

  const card = (a: AchievementItem) => {
    const hidden = a.hidden ?? (a.secret && !a.unlocked);
    const rarity = rarityStyle(a.rarity);
    return (
      <div
        key={a.id}
        className={cn(
          'relative flex items-start gap-3 overflow-hidden rounded-lg border p-3.5 transition-colors',
          a.unlocked ? cn(rarity.border, 'bg-surface-1') : 'border-line-subtle bg-surface-1',
        )}
      >
        {a.unlocked && <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', rarityBar(a.rarity))} />}
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded cut-corners-sm',
            a.unlocked ? 'tier-gold' : 'bg-surface-3 text-ink-3',
          )}
        >
          {hidden ? <HelpCircle size={20} /> : <GamificationIcon name={a.icon} size={20} />}
        </div>
        <div className={cn('min-w-0 flex-1', !a.unlocked && 'opacity-70')}>
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-semibold text-ink-1">
              {hidden ? t('progress.secret') : t(`achievement.${a.id}`)}
            </p>
            <span className="shrink-0 num text-xs font-semibold text-accent-gold">{t('progress.reward', { xp: a.reward })}</span>
          </div>
          <p className="text-xs text-ink-2">{hidden ? t('progress.secretDesc') : t(`achievement.${a.id}.desc`)}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-ink-3">
            {a.rarity && !hidden && (
              <span className={cn('font-semibold uppercase tracking-eyebrow', rarity.text)}>
                {t(`achievement.rarity.${a.rarity}`)}
              </span>
            )}
            {a.percent !== undefined && a.percent !== null && (
              <span className="inline-flex items-center gap-1 num" title={t('achievement.percentHint')}>
                <Users2 size={11} aria-hidden="true" />
                {t('achievement.percent', { value: formatPercent(a.percent, lang) })}
              </span>
            )}
            <span className="inline-flex items-center gap-1 num">
              {!a.unlocked && <Lock size={10} aria-hidden="true" />}
              {a.unlocked && a.unlockedAt ? t('progress.unlockedAt', { date: fmt(a.unlockedAt) }) : t('progress.locked')}
            </span>
          </div>
        </div>
        {a.frameId && !hidden && (
          <FrameThumb
            frame={a.frameId}
            size={36}
            label={t('achievement.unlocksFrame')}
            className={cn('self-center', !a.unlocked && 'opacity-50 grayscale')}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {sections.map((s) => {
        const done = s.items.filter((a) => a.unlocked).length;
        return (
          <section key={s.family ?? 'all'}>
            {s.family && (
              <div className="mb-3 flex items-baseline justify-between gap-2 border-b border-line-subtle pb-2">
                <h3 className="font-display text-sm font-bold uppercase tracking-eyebrow text-ink-1">
                  {t(`achievement.family.${s.family}`)}
                </h3>
                <span className="num text-xs font-semibold text-ink-3">
                  {done}/{s.items.length}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{s.items.map(card)}</div>
          </section>
        );
      })}
    </div>
  );
}

function rarityBar(rarity?: string | null) {
  switch (rarity) {
    case 'rare':
      return 'bg-accent-cyan';
    case 'epic':
      return 'bg-accent-violet';
    case 'legendary':
      return 'bg-accent-gold';
    case 'mythic':
      return 'bg-accent-red';
    default:
      return 'bg-ink-3';
  }
}
