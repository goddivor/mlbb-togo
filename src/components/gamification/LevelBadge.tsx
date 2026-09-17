'use client';

import { Sparkles } from 'lucide-react';
import { useT } from '@/lib/i18n';

/** Small level pill shown next to a username (null level renders nothing). */
export default function LevelBadge({
  level,
  size = 'sm',
  className = '',
}: {
  level?: number | null;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const t = useT();
  if (!level) return null;
  const sizes = {
    xs: 'px-1.5 py-0 text-[10px] gap-0.5',
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1',
  };
  const icon = size === 'xs' ? 10 : size === 'sm' ? 12 : 14;
  return (
    <span
      title={`${t('progress.level')} ${level}`}
      className={`inline-flex items-center rounded-full font-semibold bg-gradient-to-r from-primary to-meta-5 text-white shadow-sm ${sizes[size]} ${className}`}
    >
      <Sparkles size={icon} />
      {t('progress.levelShort')} {level}
    </span>
  );
}
