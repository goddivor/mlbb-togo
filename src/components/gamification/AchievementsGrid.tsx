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
            className={`flex items-start gap-3 rounded-sm border p-3 transition-colors ${
              a.unlocked
                ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
                : 'border-stroke bg-white opacity-60 grayscale dark:border-strokedark dark:bg-boxdark'
            }`}
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                a.unlocked
                  ? 'bg-gradient-to-br from-primary to-meta-5 text-white shadow-md'
                  : 'bg-gray text-body dark:bg-meta-4 dark:text-bodydark'
              }`}
            >
              {hidden ? <Lock size={18} /> : <GamificationIcon name={a.icon} size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-black dark:text-white truncate">
                  {hidden ? t('progress.secret') : t(`achievement.${a.id}`)}
                </p>
                <span className="shrink-0 text-xs font-semibold text-warning">
                  {t('progress.reward', { xp: a.reward })}
                </span>
              </div>
              <p className="text-xs text-body dark:text-bodydark">
                {hidden ? t('progress.secretDesc') : t(`achievement.${a.id}.desc`)}
              </p>
              <p className="mt-1 text-[11px] text-bodydark2">
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
