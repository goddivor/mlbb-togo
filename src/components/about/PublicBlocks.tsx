'use client';

import { cn } from '@/lib/helpers';
import { type Accent } from '@/components/ui';
import CountUp from '@/components/about/CountUp';

export const ACCENT_TEXT: Record<Accent, string> = {
  cyan: 'text-accent-cyan',
  violet: 'text-accent-violet',
  gold: 'text-accent-gold',
  red: 'text-accent-red',
  green: 'text-accent-green',
};
export const ACCENT_SOFT: Record<Accent, string> = {
  cyan: 'bg-accent-cyan/10',
  violet: 'bg-accent-violet/10',
  gold: 'bg-accent-gold/15',
  red: 'bg-accent-red/10',
  green: 'bg-accent-green/10',
};

/** Centred heading of a public-page section. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: 'center' | 'left';
  className?: string;
}) {
  return (
    <div className={cn('mb-10', align === 'center' ? 'text-center' : 'text-left', className)}>
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="font-display text-3xl font-bold uppercase tracking-tight2 text-ink-1 sm:text-4xl">{title}</h2>
      {subtitle && (
        <p className={cn('mt-3 max-w-2xl text-ink-2', align === 'center' && 'mx-auto')}>{subtitle}</p>
      )}
    </div>
  );
}

/** Icon + title + description card (values, activations, reasons). */
export function IconCard({
  icon: Icon,
  accent,
  title,
  desc,
  horizontal = false,
}: {
  icon: any;
  accent: Accent;
  title: string;
  desc: string;
  horizontal?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-line-subtle bg-surface-1 p-6 shadow-elev-1 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1',
        horizontal ? 'flex gap-5' : 'flex flex-col'
      )}
    >
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center cut-corners-sm', ACCENT_SOFT[accent], ACCENT_TEXT[accent], !horizontal && 'mb-5')}>
        <Icon size={22} />
      </div>
      <div>
        <h3 className="font-display text-lg font-bold uppercase tracking-tight2 text-ink-1">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{desc}</p>
      </div>
    </div>
  );
}

export type FigureKey = 'streamAudience' | 'socialReach' | 'teams' | 'offlineEvents';
export type Figures = Record<FigureKey, number>;

const FIGURE_ACCENT: Record<FigureKey, Accent> = {
  streamAudience: 'red',
  socialReach: 'cyan',
  teams: 'violet',
  offlineEvents: 'gold',
};

/** Target figures as one chamfered plate of four counters. */
export function FigureGrid({
  figures,
  items,
  locale,
}: {
  figures: Figures;
  items: { key: FigureKey; label: string; hint: string }[];
  locale: string;
}) {
  return (
    <dl className="cut-corners grid grid-cols-2 border border-line-subtle bg-surface-1 shadow-elev-1 lg:grid-cols-4">
      {items.map((f, i) => (
        <div
          key={f.key}
          className={cn(
            'flex flex-col px-6 py-7 sm:px-8',
            i % 2 === 1 && 'border-l border-line-subtle',
            i >= 2 && 'border-t border-line-subtle lg:border-t-0',
            i >= 1 && 'lg:border-l lg:border-line-subtle'
          )}
        >
          <dd className="num order-1 font-display text-3xl font-bold leading-none text-ink-1 sm:text-4xl">
            <CountUp value={figures[f.key] ?? 0} locale={locale} />
            <span className={ACCENT_TEXT[FIGURE_ACCENT[f.key]]}>+</span>
          </dd>
          <dt className="order-2 mt-3 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-1">{f.label}</dt>
          <dd className="order-3 mt-1 text-xs text-ink-3">{f.hint}</dd>
        </div>
      ))}
    </dl>
  );
}
