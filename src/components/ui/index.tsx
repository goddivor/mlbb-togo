'use client';

import Link from 'next/link';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { type BannerVariant } from '@/config/theme';

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
          'rounded-full border-2 border-stroke border-t-primary animate-spin dark:border-strokedark dark:border-t-primary',
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
    'relative inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed';

  // TailAdmin button variants.
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-opacity-90',
    secondary: 'border border-primary text-primary hover:bg-primary hover:text-white',
    outline:
      'border border-stroke text-body hover:border-primary hover:text-primary dark:border-strokedark dark:text-bodydark',
    ghost: 'text-body hover:bg-gray dark:text-bodydark dark:hover:bg-meta-4',
    danger: 'bg-danger text-white hover:bg-opacity-90',
    success: 'bg-success text-white hover:bg-opacity-90',
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

export function Card({ children, className, hover = false, glow = false, ...props }: any) {
  // hover/glow are consumed here so they don't leak as DOM attributes.
  return (
    <div
      className={cn(
        'rounded-sm border border-stroke bg-white shadow-default p-6 dark:border-strokedark dark:bg-boxdark',
        hover && 'transition-colors hover:border-primary',
        glow && 'shadow-lg',
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
    <div
      className={cn(
        'rounded-sm border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

export function Badge({ children, variant = 'default', size = 'md', className }: any) {
  // TailAdmin pill badges: soft tinted background + matching text color.
  const variants: Record<string, string> = {
    default: 'bg-gray text-body dark:bg-meta-4 dark:text-bodydark',
    neon: 'bg-primary/10 text-primary',
    blue: 'bg-primary/10 text-primary',
    green: 'bg-success/10 text-success',
    red: 'bg-danger/10 text-danger',
    gold: 'bg-warning/10 text-warning',
    purple: 'bg-meta-5/10 text-meta-5',
    pink: 'bg-meta-1/10 text-meta-1',
  };
  const sizes: Record<string, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3.5 py-1.5 text-sm',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Form fields                                                        */
/* ------------------------------------------------------------------ */

// TailAdmin form field base (form-elements.html).
const fieldBase =
  'w-full rounded-lg border bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default dark:bg-form-input dark:text-white dark:focus:border-primary';
const labelClass = 'mb-2.5 block text-black dark:text-white';

export function Input({ label, error, className, ...props }: any) {
  return (
    <div className="w-full">
      {label && <label className={labelClass}>{label}</label>}
      <input
        className={cn(fieldBase, error ? 'border-danger' : 'border-stroke dark:border-form-strokedark', className)}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
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
          error ? 'border-danger' : 'border-stroke dark:border-form-strokedark',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function Select({ label, options, error, className, children, ...props }: any) {
  return (
    <div className="w-full">
      {label && <label className={labelClass}>{label}</label>}
      <select
        className={cn(fieldBase, error ? 'border-danger' : 'border-stroke dark:border-form-strokedark', className)}
        {...props}
      >
        {options
          ? options.map((opt: any) => (
              <option key={opt.value} value={opt.value} className="text-body dark:text-bodydark">
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar / ProgressBar                                                */
/* ------------------------------------------------------------------ */

export function Avatar({ name, src, size = 'md', online, className }: any) {
  const sizes: Record<string, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
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
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'shrink-0 rounded-full bg-primary flex items-center justify-center font-bold text-white overflow-hidden',
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
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-boxdark',
            online ? 'bg-success' : 'bg-body'
          )}
        />
      )}
    </div>
  );
}

export function ProgressBar({ value, max = 100, className }: any) {
  return (
    <div className={cn('h-2 rounded-full bg-stroke overflow-hidden dark:bg-strokedark', className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatCard - TailAdmin white metric card (translucent prop ignored)   */
/* ------------------------------------------------------------------ */

export function StatCard({ label, value, icon, trend, translucent: _translucent = false, className }: any) {
  // `translucent` is accepted for backward-compat but no longer affects rendering.
  return (
    <div
      className={cn(
        'rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark',
        className
      )}
    >
      {icon && (
        <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 text-primary dark:bg-meta-4">
          {icon}
        </div>
      )}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <h4 className="text-title-md font-bold text-black dark:text-white">{value}</h4>
          <span className="mt-1 block text-sm font-medium text-body dark:text-bodydark">{label}</span>
        </div>
        {trend !== undefined && trend !== null && (
          <span
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trend > 0 ? 'text-meta-3' : 'text-meta-1'
            )}
          >
            {trend > 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PageHeader - sober TailAdmin page heading (gradient banner removed)  */
/* ------------------------------------------------------------------ */

export function PageHeader({
  icon: _icon,
  title,
  subtitle,
  action,
  children,
  breadcrumb,
  variant: _variant = 'default',
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode; // optional grid of cards below the heading
  breadcrumb?: React.ReactNode; // current-page label (defaults to `title`)
  variant?: BannerVariant;
  className?: string;
}) {
  const t = useT();
  // `icon` and `variant` are kept for backward-compat but no longer rendered.
  return (
    <div className={className}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-title-md2 font-bold text-black dark:text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-body dark:text-bodydark">{subtitle}</p>}
        </div>
        {/* TailAdmin page header: action (optional) + breadcrumb on the right */}
        <div className="flex items-center gap-4">
          {action}
          <nav>
            <ol className="flex items-center gap-2">
              <li>
                <Link className="font-medium text-body dark:text-bodydark" href="/dashboard">
                  {t('header.dashboard')} /
                </Link>
              </li>
              <li className="font-medium text-primary">{breadcrumb ?? title}</li>
            </ol>
          </nav>
        </div>
      </div>
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
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray text-body dark:bg-meta-4">
          {icon}
        </div>
      )}
      <h3 className="mb-1.5 text-lg font-semibold text-black dark:text-white">{title}</h3>
      {description && (
        <p className="mb-6 max-w-md text-sm text-body dark:text-bodydark">{description}</p>
      )}
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

export function Tabs({ tabs, active, onChange, className }: any) {
  return (
    <div
      className={cn(
        'inline-flex rounded-sm border border-stroke bg-white p-1 dark:border-strokedark dark:bg-boxdark',
        className
      )}
    >
      {tabs.map((tab: any) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-white'
                : 'text-body hover:bg-gray dark:text-bodydark dark:hover:bg-meta-4'
            )}
          >
            {tab.icon && <tab.icon size={16} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
