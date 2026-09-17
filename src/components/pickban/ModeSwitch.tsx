'use client';

import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import type { PickBanMode } from '@/lib/pickban';

export default function ModeSwitch({
  value,
  onChange,
  disabled = false,
  size = 'md',
}: {
  value: PickBanMode;
  onChange: (mode: PickBanMode) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  const t = useT();
  return (
    <div
      role="radiogroup"
      aria-label={t('pickban.mode')}
      className="inline-flex rounded-sm border border-stroke bg-gray-2 p-0.5 dark:border-strokedark dark:bg-meta-4"
    >
      {(['ranked', 'tournament'] as PickBanMode[]).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={value === m}
          disabled={disabled}
          onClick={() => onChange(m)}
          className={cn(
            'rounded-sm font-medium transition-colors disabled:cursor-not-allowed',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-1.5 text-sm',
            value === m
              ? 'bg-primary text-white'
              : 'text-body hover:text-primary dark:text-bodydark',
          )}
        >
          {t(`pickban.${m}`)}
        </button>
      ))}
    </div>
  );
}
