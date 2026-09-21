'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronUp, ChevronsUpDown, Minus } from 'lucide-react';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { type BannerVariant } from '@/config/theme';

/* ------------------------------------------------------------------ */
/* Shared accent vocabulary                                            */
/* ------------------------------------------------------------------ */

export type Accent = 'cyan' | 'violet' | 'gold' | 'red' | 'green';

const ACCENT_TEXT: Record<Accent, string> = {
  cyan: 'text-accent-cyan',
  violet: 'text-accent-violet',
  gold: 'text-accent-gold',
  red: 'text-accent-red',
  green: 'text-accent-green',
};

const ACCENT_BG: Record<Accent, string> = {
  cyan: 'bg-accent-cyan',
  violet: 'bg-accent-violet',
  gold: 'bg-accent-gold',
  red: 'bg-accent-red',
  green: 'bg-accent-green',
};

const ACCENT_SOFT: Record<Accent, string> = {
  cyan: 'bg-accent-cyan/10 text-accent-cyan',
  violet: 'bg-accent-violet/10 text-accent-violet',
  gold: 'bg-accent-gold/15 text-accent-gold',
  red: 'bg-accent-red/10 text-accent-red',
  green: 'bg-accent-green/10 text-accent-green',
};

const ACCENT_EDGE: Record<Accent, string> = {
  cyan: 'border-l-accent-cyan',
  violet: 'border-l-accent-violet',
  gold: 'border-l-accent-gold',
  red: 'border-l-accent-red',
  green: 'border-l-accent-green',
};

/** Legacy banner variants map onto the accent vocabulary. */
const BANNER_ACCENT: Record<BannerVariant, Accent> = {
  default: 'cyan',
  blue: 'cyan',
  cyan: 'cyan',
  purple: 'violet',
  gold: 'gold',
  danger: 'red',
  green: 'green',
};

/** Hex/rgb value of an accent for inline SVG usage. */
export function accentColor(accent: Accent = 'cyan'): string {
  return `rgb(var(--accent-${accent}))`;
}

/* ------------------------------------------------------------------ */
/* Loader                                                              */
/* ------------------------------------------------------------------ */

export function SpinLoader({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin h-4 w-4', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function LoadingSpinner({ size = 'md', className }: any) {
  const sizes: Record<string, string> = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'rounded-full border-2 border-line-strong border-t-primary animate-spin',
          sizes[size]
        )}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading = false,
  type = 'button',
  ...props
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'relative inline-flex items-center justify-center gap-2 font-semibold select-none transition-[background-color,color,border-color,box-shadow,transform,filter] duration-base ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none active:translate-y-px';

  // Primary/danger carry the chamfered corner: the design system's signature cut.
  const variants: Record<ButtonVariant, string> = {
    primary:
      'btn-cut [--btn-bg:rgb(var(--primary))] text-on-primary hover:shadow-glow-cyan hover:brightness-110',
    danger: 'btn-cut [--btn-bg:rgb(var(--accent-red))] text-white hover:brightness-110',
    secondary:
      'rounded border border-primary/60 bg-primary/5 text-primary hover:bg-primary/15 hover:border-primary',
    outline:
      'rounded border border-line-strong text-ink-2 hover:border-primary hover:text-primary',
    ghost: 'rounded text-ink-2 hover:bg-surface-2 hover:text-ink-1',
    // Darker green than accent-green so white copy stays readable (>= 4.3:1).
    success: 'rounded bg-success text-white hover:brightness-110',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <SpinLoader />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Card / SectionCard                                                  */
/* ------------------------------------------------------------------ */

const cardBase =
  'rounded-lg border border-line-subtle bg-surface-1 shadow-elev-1 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1';

export function Card({
  children,
  className,
  hover = false,
  glow = false,
  accent,
  ...props
}: {
  children?: ReactNode;
  className?: string;
  /** Lift + stronger border on hover. */
  hover?: boolean;
  /** Static accent glow border (primary elements only). */
  glow?: boolean;
  /** Coloured left edge (e.g. team colour, status). */
  accent?: Accent;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>) {
  return (
    <div
      className={cn(
        cardBase,
        'p-6',
        hover &&
          'transition-[transform,box-shadow,border-color] duration-base ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-elev-2',
        glow && 'border-primary/40 shadow-glow-cyan',
        accent && cn('border-l-2', ACCENT_EDGE[accent]),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Neutral section card (filters, content blocks). */
export function SectionCard({ children, className, ...props }: any) {
  return (
    <div className={cn(cardBase, 'p-6.5', className)} {...props}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SectionTitle                                                        */
/* ------------------------------------------------------------------ */

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
  className,
  size = 'md',
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const titleSize: Record<string, string> = {
    sm: 'text-base',
    md: 'text-lg md:text-xl',
    lg: 'text-2xl md:text-3xl',
  };
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h3 className={cn('font-display font-bold tracking-tight2 text-ink-1', titleSize[size])}>{title}</h3>
        {description && <p className="mt-1 text-sm text-ink-2">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot = false,
  pulse = false,
  ...props
}: {
  children?: ReactNode;
  variant?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Leading status dot. */
  dot?: boolean;
  /** Animated (live) dot; implies `dot`. */
  pulse?: boolean;
} & Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>) {
  const variants: Record<string, string> = {
    default: 'bg-surface-3 text-ink-2',
    outline: 'border border-line-strong text-ink-2',
    neon: 'bg-accent-cyan/10 text-accent-cyan ring-1 ring-inset ring-accent-cyan/25',
    blue: 'bg-accent-cyan/10 text-accent-cyan ring-1 ring-inset ring-accent-cyan/25',
    green: 'bg-accent-green/10 text-accent-green ring-1 ring-inset ring-accent-green/25',
    red: 'bg-accent-red/10 text-accent-red ring-1 ring-inset ring-accent-red/25',
    gold: 'bg-accent-gold/15 text-accent-gold ring-1 ring-inset ring-accent-gold/30',
    purple: 'bg-accent-violet/10 text-accent-violet ring-1 ring-inset ring-accent-violet/25',
    pink: 'bg-neon-pink/10 text-neon-pink ring-1 ring-inset ring-neon-pink/25',
    live: 'bg-accent-red/10 text-accent-red ring-1 ring-inset ring-accent-red/30',
    'tier-gold': 'tier-gold',
    'tier-silver': 'tier-silver',
    'tier-bronze': 'tier-bronze',
  };
  const sizes: Record<string, string> = {
    sm: 'px-2 py-1 text-[11px]',
    md: 'px-2.5 py-1.5 text-xs',
    lg: 'px-3 py-2 text-sm',
  };
  const isLive = variant === 'live' || pulse;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded font-semibold leading-none num',
        variants[variant] ?? variants.default,
        sizes[size],
        className
      )}
      {...props}
    >
      {isLive ? (
        <span className="live-dot" aria-hidden="true" />
      ) : (
        dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Form fields                                                        */
/* ------------------------------------------------------------------ */

const fieldBase =
  'w-full rounded border bg-surface-1 py-3 px-5 text-ink-1 placeholder:text-ink-3 outline-none transition-[border-color,box-shadow,background-color] duration-base ease-out focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-default disabled:opacity-60 dark:bg-surface-0/60';
const labelClass = 'mb-2.5 block text-sm font-medium text-ink-1';

export function Input({ label, error, className, ...props }: any) {
  return (
    <div className="w-full">
      {label && <label className={labelClass}>{label}</label>}
      <input
        className={cn(fieldBase, error ? 'border-accent-red' : 'border-line-strong', className)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-accent-red">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, ...props }: any) {
  return (
    <div className="w-full">
      {label && <label className={labelClass}>{label}</label>}
      <textarea
        className={cn(
          fieldBase,
          'min-h-[90px] resize-y',
          error ? 'border-accent-red' : 'border-line-strong',
          className
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-accent-red">{error}</p>}
    </div>
  );
}

export function Select({ label, options, error, className, children, ...props }: any) {
  return (
    <div className="w-full">
      {label && <label className={labelClass}>{label}</label>}
      <select
        className={cn(fieldBase, error ? 'border-accent-red' : 'border-line-strong', className)}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {options
          ? options.map((opt: any) => (
              <option key={opt.value} value={opt.value} className="text-ink-2">
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="mt-1.5 text-sm text-accent-red">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar / ProgressBar                                                */
/* ------------------------------------------------------------------ */

export function Avatar({ name, src, size = 'md', online, className, square = false, ring = false }: any) {
  const sizes: Record<string, string> = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-28 h-28 text-3xl',
  };
  const initials = name
    ? name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '?';
  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-accent-cyan to-accent-violet font-display font-bold text-on-primary',
          square ? 'rounded-md' : 'rounded-full',
          ring && 'ring-2 ring-primary/60 ring-offset-2 ring-offset-surface-1',
          sizes[size]
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-1',
            online ? 'bg-accent-green' : 'bg-ink-3'
          )}
        />
      )}
    </div>
  );
}

export function ProgressBar({ value, max = 100, className, accent, label }: any) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn('h-2 rounded-full bg-surface-3 overflow-hidden', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-slow ease-out',
          accent ? ACCENT_BG[accent as Accent] : 'bg-gradient-to-r from-primary to-accent-violet'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline / StatRing (inline SVG, no dependency)                    */
/* ------------------------------------------------------------------ */

export function Sparkline({
  data,
  width = 96,
  height = 28,
  accent = 'cyan',
  strokeWidth = 1.5,
  fill = true,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  accent?: Accent;
  strokeWidth?: number;
  fill?: boolean;
  className?: string;
}) {
  const id = useId();
  const path = useMemo(() => {
    if (!data || data.length < 2) return { line: '', area: '' };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const pad = strokeWidth;
    const stepX = (width - pad * 2) / (data.length - 1);
    const pts = data.map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (1 - (v - min) / span) * (height - pad * 2);
      return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${height} L${pts[0][0].toFixed(1)} ${height} Z`;
    return { line, area };
  }, [data, width, height, strokeWidth]);

  if (!path.line) return null;
  const color = accentColor(accent);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('block overflow-visible', className)}
      aria-hidden="true"
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={`sp-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.35" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={path.area} fill={`url(#sp-${id})`} />
        </>
      )}
      <path d={path.line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function StatRing({
  value,
  max = 100,
  size = 64,
  stroke = 6,
  accent = 'cyan',
  label,
  children,
  className,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  accent?: Accent;
  /** Accessible label. */
  label?: string;
  /** Centre content (defaults to the percentage). */
  children?: ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  const color = accentColor(accent);
  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(pct * 100)}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line-subtle) / 0.2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-slow ease-out"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-display font-bold num text-ink-1" style={{ fontSize: size * 0.24 }}>
        {children ?? `${Math.round(pct * 100)}%`}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatCard / StatTile                                                 */
/* ------------------------------------------------------------------ */

function DeltaArrow({ delta, suffix = '%' }: { delta: number; suffix?: string }) {
  const up = delta > 0;
  const flat = delta === 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold num',
        flat ? 'bg-surface-3 text-ink-2' : up ? ACCENT_SOFT.green : ACCENT_SOFT.red
      )}
    >
      <Icon size={12} strokeWidth={2.5} />
      {up ? '+' : ''}
      {delta}
      {suffix}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  delta,
  deltaSuffix,
  sparkline,
  hint,
  accent = 'cyan',
  translucent: _translucent = false,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  /** Legacy: percentage trend (kept, same as `delta`). */
  trend?: number | null;
  /** Signed delta shown with an arrow. */
  delta?: number | null;
  deltaSuffix?: string;
  /** Series for the sparkline slot, or a custom node. */
  sparkline?: number[] | ReactNode;
  /** Small caption under the label (e.g. "last 30 days"). */
  hint?: ReactNode;
  accent?: Accent;
  translucent?: boolean;
  className?: string;
}) {
  const d = delta ?? trend;
  const spark = Array.isArray(sparkline) ? <Sparkline data={sparkline} accent={accent} width={120} height={32} /> : sparkline;
  return (
    <div className={cn(cardBase, 'relative overflow-hidden px-6 py-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-ink-3">{hint}</p>}
        </div>
        {icon && (
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded cut-corners-sm', ACCENT_SOFT[accent])}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="whitespace-nowrap font-display text-3xl font-bold leading-none tracking-tight2 num text-ink-1">{value}</span>
          {d !== undefined && d !== null && <DeltaArrow delta={d} suffix={deltaSuffix} />}
        </div>
        {spark && <div className="shrink-0 text-ink-3">{spark}</div>}
      </div>
    </div>
  );
}

/** Compact inline metric (label on top, number below) for dense rows. */
export function StatTile({
  label,
  value,
  delta,
  accent,
  className,
  align = 'left',
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: number | null;
  accent?: Accent;
  className?: string;
  align?: 'left' | 'center' | 'right';
}) {
  const alignCls = { left: 'items-start text-left', center: 'items-center text-center', right: 'items-end text-right' }[align];
  return (
    <div className={cn('flex flex-col gap-0.5', alignCls, className)}>
      <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{label}</span>
      <span className={cn('font-display text-lg font-bold leading-none num', accent ? ACCENT_TEXT[accent] : 'text-ink-1')}>
        {value}
      </span>
      {delta !== undefined && delta !== null && <DeltaArrow delta={delta} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PageHeader                                                          */
/* ------------------------------------------------------------------ */

export function PageHeader({
  icon,
  title,
  subtitle,
  eyebrow,
  action,
  children,
  breadcrumb,
  banner,
  variant = 'default',
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Uppercase label above the title (section, season, stage). */
  eyebrow?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode; // optional grid of cards below the heading
  breadcrumb?: React.ReactNode; // current-page label (defaults to `title`)
  /** Background art URL: renders the angled art banner with a gradient overlay. */
  banner?: string;
  /** Accent colour of the header (legacy banner variants map to accents). */
  variant?: BannerVariant;
  className?: string;
}) {
  const t = useT();
  const accent = BANNER_ACCENT[variant] ?? 'cyan';

  const crumbs = (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 whitespace-nowrap text-sm">
        <li>
          <Link className="font-medium text-ink-2 transition-colors hover:text-ink-1" href="/dashboard">
            {t('header.dashboard')} /
          </Link>
        </li>
        <li className="font-medium text-primary">{breadcrumb ?? title}</li>
      </ol>
    </nav>
  );

  const heading = (light: boolean) => (
    <div className="min-w-0">
      {eyebrow && <p className={cn('eyebrow mb-2', light && '!text-white/80')}>{eyebrow}</p>}
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn('h-7 w-1 shrink-0 -skew-x-12 rounded-sm', light ? 'bg-white' : ACCENT_BG[accent])}
        />
        {icon && !banner && (
          <span className={cn('hidden sm:inline-flex h-9 w-9 items-center justify-center rounded cut-corners-sm', ACCENT_SOFT[accent])}>
            {icon}
          </span>
        )}
        <h2
          className={cn(
            'font-display text-2xl font-bold tracking-tight2 md:text-3xl',
            light ? 'text-white' : 'text-ink-1'
          )}
        >
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className={cn('mt-1.5 pl-4 text-sm', light ? 'text-white/80' : 'text-ink-2')}>{subtitle}</p>
      )}
    </div>
  );

  return (
    <div className={className}>
      {banner ? (
        <div className="relative mb-6 overflow-hidden rounded-lg cut-banner border border-line-subtle bg-[#0a0e19] min-h-[176px] md:min-h-[208px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              // Always dark so the white heading reads in both themes.
              background: `linear-gradient(90deg, rgb(10 14 25 / 0.92) 0%, rgb(10 14 25 / 0.6) 55%, rgb(var(--accent-${accent}) / 0.3) 100%)`,
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0e19]/85 to-transparent" />
          <div className="relative flex h-full min-h-[176px] flex-col justify-end gap-4 p-6 md:min-h-[208px] md:flex-row md:items-end md:justify-between">
            {heading(true)}
            <div className="flex shrink-0 items-center gap-4">
              {action}
              <div className="hidden md:block [&_a]:text-white/70 [&_a:hover]:text-white [&_li:last-child]:text-white">{crumbs}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          {heading(false)}
          <div className="flex shrink-0 flex-wrap items-center gap-4">
            {action}
            {crumbs}
          </div>
        </div>
      )}
      {children && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyState                                                          */
/* ------------------------------------------------------------------ */

export function EmptyState({ icon, title, description, action, className }: any) {
  return (
    <div
      className={cn(
        'flex min-h-[60vh] w-full flex-col items-center justify-center py-16 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded cut-corners bg-surface-2 text-ink-3 ring-1 ring-inset ring-line-subtle">
          {icon}
        </div>
      )}
      <h3 className="mb-1.5 font-display text-lg font-bold tracking-tight2 text-ink-1">{title}</h3>
      {description && <p className="mb-6 max-w-md text-sm text-ink-2">{description}</p>}
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

export function Skeleton({
  className,
  lines = 1,
  circle = false,
}: {
  className?: string;
  /** Renders N stacked lines (last one shorter). */
  lines?: number;
  circle?: boolean;
}) {
  const base = 'animate-pulse bg-surface-3';
  if (lines <= 1) {
    return <div className={cn(base, circle ? 'rounded-full' : 'rounded', !className && 'h-4 w-full', className)} aria-hidden="true" />;
  }
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn(base, 'h-3.5 rounded', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tooltip (CSS only)                                                  */
/* ------------------------------------------------------------------ */

export function Tooltip({
  content,
  children,
  side = 'top',
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  const id = useId();
  const pos: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };
  return (
    <span className={cn('group/tip relative inline-flex', className)} aria-describedby={id}>
      {children}
      <span
        role="tooltip"
        id={id}
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded border border-line-strong bg-surface-1 px-2.5 py-1.5 text-xs font-medium text-ink-1 shadow-elev-2 opacity-0 transition-opacity duration-fast group-hover/tip:opacity-100 group-focus-within/tip:opacity-100',
          pos[side]
        )}
      >
        {content}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

// framer-motion is loaded on demand (own chunk) so pages that only use a
// Button or an Input do not pay for it. Until the chunk mounts, a static
// marker keeps the active tab highlighted.
let motionReady = false;
const motionListeners = new Set<() => void>();
const TabIndicator = dynamic(
  () =>
    import('./TabIndicator').then((m) => {
      motionReady = true;
      motionListeners.forEach((l) => l());
      return m;
    }),
  { ssr: false, loading: () => null }
);

function useMotionReady() {
  const [ready, setReady] = useState(motionReady);
  useEffect(() => {
    if (motionReady) {
      setReady(true);
      return;
    }
    const l = () => setReady(true);
    motionListeners.add(l);
    return () => {
      motionListeners.delete(l);
    };
  }, []);
  return ready;
}

function ActiveMarker({ layoutId, className }: { layoutId: string; className: string }) {
  const ready = useMotionReady();
  return (
    <>
      <TabIndicator layoutId={layoutId} className={className} />
      {!ready && <span aria-hidden="true" className={className} />}
    </>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
  variant = 'segment',
  size = 'md',
}: {
  tabs: Array<{ id: string; label: ReactNode; icon?: any; count?: number }>;
  active: string;
  onChange: (id: any) => void;
  className?: string;
  /** `segment`: sliding filled pill (drop-in). `underline`: animated underline. */
  variant?: 'segment' | 'underline';
  size?: 'sm' | 'md';
}) {
  const layoutId = useId();
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        className={cn('no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto border-b border-line-subtle', className)}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative -mb-px flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold transition-colors duration-fast',
                pad,
                isActive ? 'text-ink-1' : 'text-ink-3 hover:text-ink-2'
              )}
            >
              {tab.icon && <tab.icon size={16} />}
              {tab.label}
              {tab.count !== undefined && (
                <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] num text-ink-2">{tab.count}</span>
              )}
              {isActive && (
                <ActiveMarker
                  layoutId={`tabs-underline-${layoutId}`}
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-primary shadow-glow-cyan"
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={cn('no-scrollbar inline-flex max-w-full overflow-x-auto rounded-md border border-line-subtle bg-surface-2/70 p-1', className)}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded font-semibold transition-colors duration-fast',
              pad,
              isActive ? 'text-on-primary' : 'text-ink-2 hover:text-ink-1'
            )}
          >
            {isActive && (
              <ActiveMarker layoutId={`tabs-segment-${layoutId}`} className="absolute inset-0 rounded bg-primary" />
            )}
            <span className="relative flex items-center gap-2">
              {tab.icon && <tab.icon size={16} />}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] num',
                    isActive ? 'bg-black/15' : 'bg-surface-3 text-ink-2'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table primitives / DataTable                                        */
/* ------------------------------------------------------------------ */

export function Table({ children, className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn('w-full border-collapse text-sm num', className)} {...props}>
      {children}
    </table>
  );
}

export function Th({
  children,
  className,
  align = 'left',
  sortable,
  sorted,
  onSort,
  ...props
}: {
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  /** Current sort direction when this column is the sort key. */
  sorted?: 'asc' | 'desc' | null;
  onSort?: () => void;
} & React.ThHTMLAttributes<HTMLTableCellElement>) {
  const alignCls = { left: 'text-left', center: 'text-center', right: 'text-right' }[align];
  const SortIcon = sorted === 'asc' ? ChevronUp : sorted === 'desc' ? ChevronDown : ChevronsUpDown;
  return (
    <th
      scope="col"
      aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined}
      className={cn(
        'px-3 py-2.5 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-3 whitespace-nowrap',
        alignCls,
        sortable && 'cursor-pointer select-none hover:text-ink-1',
        sorted && 'text-primary',
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <span className={cn('inline-flex items-center gap-1', align === 'right' && 'flex-row-reverse')}>
        {children}
        {sortable && <SortIcon size={12} className={cn(!sorted && 'opacity-50')} />}
      </span>
    </th>
  );
}

export function Td({
  children,
  className,
  align = 'left',
  ...props
}: { align?: 'left' | 'center' | 'right' } & React.TdHTMLAttributes<HTMLTableCellElement>) {
  const alignCls = { left: 'text-left', center: 'text-center', right: 'text-right' }[align];
  return (
    <td className={cn('px-3 py-3 align-middle text-ink-1', alignCls, className)} {...props}>
      {children}
    </td>
  );
}

export type DataColumn<T> = {
  key: string;
  header: ReactNode;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  width?: string;
  className?: string;
  /** Hide on small screens. */
  hideBelow?: 'sm' | 'md' | 'lg';
  render?: (row: T, index: number) => ReactNode;
};

const HIDE_CLS: Record<string, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  stickyHeader = true,
  zebra = true,
  dense = false,
  loading = false,
  emptyMessage,
  rowClassName,
  className,
  maxHeight,
}: {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  sortKey?: string | null;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
  zebra?: boolean;
  dense?: boolean;
  loading?: boolean;
  emptyMessage?: ReactNode;
  rowClassName?: (row: T, index: number) => string | undefined;
  className?: string;
  /** Scroll container height (enables sticky header). */
  maxHeight?: string;
}) {
  const cell = (row: T, col: DataColumn<T>, i: number) =>
    col.render ? col.render(row, i) : ((row as any)[col.key] as ReactNode);

  return (
    <div
      className={cn('overflow-auto rounded-lg border border-line-subtle bg-surface-1', className)}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <Table>
        <thead className={cn('bg-surface-2', stickyHeader && 'sticky top-0 z-10')}>
          <tr className="border-b border-line-subtle">
            {columns.map((c) => (
              <Th
                key={c.key}
                align={c.align}
                sortable={c.sortable}
                sorted={sortKey === c.key ? sortDir ?? 'asc' : null}
                onSort={() => onSort?.(c.key)}
                className={cn(c.width, c.hideBelow && HIDE_CLS[c.hideBelow], dense && 'py-2')}
              >
                {c.header}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-line-subtle last:border-b-0">
                  {columns.map((c) => (
                    <Td key={c.key} className={cn(c.hideBelow && HIDE_CLS[c.hideBelow], dense && 'py-2')}>
                      <Skeleton className="h-3.5 w-3/4" />
                    </Td>
                  ))}
                </tr>
              ))
            : rows.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-line-subtle last:border-b-0 transition-colors duration-fast',
                    zebra && i % 2 === 1 && 'bg-surface-2/40',
                    onRowClick && 'cursor-pointer hover:bg-primary/5',
                    !onRowClick && 'hover:bg-surface-2/60',
                    rowClassName?.(row, i)
                  )}
                >
                  {columns.map((c) => (
                    <Td
                      key={c.key}
                      align={c.align}
                      className={cn(c.className, c.hideBelow && HIDE_CLS[c.hideBelow], dense && 'py-2')}
                    >
                      {cell(row, c, i)}
                    </Td>
                  ))}
                </tr>
              ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-ink-3">
                {emptyMessage ?? '—'}
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
