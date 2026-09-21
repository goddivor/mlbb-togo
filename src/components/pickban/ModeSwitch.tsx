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
      className="inline-flex rounded-md border border-line-subtle bg-surface-2/70 p-1"
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
            'rounded font-semibold transition-colors duration-fast disabled:cursor-not-allowed',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-1.5 text-sm',
            value === m ? 'bg-primary text-on-primary' : 'text-ink-2 hover:text-ink-1',
          )}
        >
          {t(`pickban.${m}`)}
        </button>
      ))}
    </div>
  );
}
