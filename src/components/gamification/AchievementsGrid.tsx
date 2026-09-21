'use client';

import { Lock } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { GamificationIcon } from './icons';

export interface AchievementItem {
  id: string;
  icon: string;
  reward: number;
  secret: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
}

export default function AchievementsGrid({ items }: { items: AchievementItem[] }) {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {items.map((a) => {
        const hidden = a.secret && !a.unlocked;
        return (
          <div
            key={a.id}
            className={`relative flex items-start gap-3 overflow-hidden rounded-lg border p-3.5 transition-colors ${
              a.unlocked
                ? 'border-accent-gold/40 bg-accent-gold/5'
                : 'border-line-subtle bg-surface-1 opacity-60 grayscale'
            }`}
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded cut-corners-sm ${
                a.unlocked ? 'tier-gold' : 'bg-surface-3 text-ink-3'
              }`}
            >
              {hidden ? <Lock size={18} /> : <GamificationIcon name={a.icon} size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-ink-1">
                  {hidden ? t('progress.secret') : t(`achievement.${a.id}`)}
                </p>
                <span className="shrink-0 num text-xs font-semibold text-accent-gold">
                  {t('progress.reward', { xp: a.reward })}
                </span>
              </div>
              <p className="text-xs text-ink-2">
                {hidden ? t('progress.secretDesc') : t(`achievement.${a.id}.desc`)}
              </p>
              <p className="mt-1 text-[11px] text-ink-3 num">
                {a.unlocked && a.unlockedAt
                  ? t('progress.unlockedAt', { date: fmt(a.unlockedAt) })
                  : t('progress.locked')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
