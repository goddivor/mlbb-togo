'use client';

import { Sparkles } from 'lucide-react';
import { useT } from '@/lib/i18n';

export interface XpBarProps {
  level: number;
  xp: number;
  xpIntoLevel: number;
  nextLevelXp: number | null;
  currentLevelXp: number;
  percent: number;
  compact?: boolean;
  className?: string;
}

/** XP progress bar with the current level. Importable by the dashboard. */
export default function XpBar({
  level,
  xp,
  xpIntoLevel,
  nextLevelXp,
  currentLevelXp,
  percent,
  compact = false,
  className = '',
}: XpBarProps) {
  const t = useT();
  const span = nextLevelXp === null ? null : nextLevelXp - currentLevelXp;
  const toNext = nextLevelXp === null ? null : nextLevelXp - xp;
  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center rounded cut-corners-sm bg-gradient-to-br from-accent-cyan to-accent-violet font-display font-bold num text-on-primary ${
              compact ? 'w-10 h-10 text-sm' : 'w-14 h-14 text-xl'
            }`}
          >
            {level}
          </div>
          <div>
            <p className={`font-display font-bold tracking-tight2 text-ink-1 ${compact ? 'text-sm' : 'text-lg'}`}>
              {t('progress.level')} {level}
            </p>
            <p className="text-xs text-ink-2 num">
              {toNext === null
                ? t('progress.maxLevel')
                : t('progress.toNext', { xp: toNext, level: level + 1 })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="inline-flex items-center gap-1 text-sm font-semibold text-primary num">
            <Sparkles size={14} /> {xp.toLocaleString()} {t('progress.xp')}
          </p>
          {span !== null && (
            <p className="text-xs text-ink-3 num">
              {xpIntoLevel.toLocaleString()} / {span.toLocaleString()}
            </p>
          )}
        </div>
      </div>
      <div
        className="h-2.5 rounded-full bg-surface-3 overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent-violet transition-[width] duration-slow ease-out"
          style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}
