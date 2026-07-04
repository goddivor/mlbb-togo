'use client';

import { cn } from '@/lib/helpers';
import { banners, type BannerVariant } from '@/config/theme';

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
          'rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin',
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
    'relative inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0';

  const variants: Record<ButtonVariant, string> = {
    primary:
      'text-white shadow-lg bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-neon hover:-translate-y-0.5',
    secondary:
      'text-neon-blue border border-neon-blue/40 hover:border-neon-blue hover:bg-neon-blue/10 hover:-translate-y-0.5',
    outline:
      'text-gray-200 border border-gaming-border hover:border-neon-blue hover:bg-gaming-surface',
    ghost: 'text-gray-300 hover:text-white hover:bg-gaming-surface',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:-translate-y-0.5',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:-translate-y-0.5',
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
  // hover/glow sont consommés ici pour ne pas fuir en attributs DOM.
  return (
    <div
      className={cn(
        'rounded-xl border border-gaming-border bg-gaming-card shadow-gaming p-6',
        hover && 'transition-colors hover:border-neon-blue/30',
        glow && 'shadow-neon',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Carte de section neutre (filtres, blocs de contenu). */
export function SectionCard({ children, className, ...props }: any) {
  return (
    <div
      className={cn('rounded-xl border border-gaming-border bg-gaming-card/60 p-5', className)}
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
  const variants: Record<string, string> = {
    default: 'bg-gaming-surface text-gray-300 border-gaming-border',
    neon: 'bg-neon-blue/15 text-neon-blue border-neon-blue/30',
    purple: 'bg-neon-purple/15 text-neon-purple border-neon-purple/30',
    gold: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
    pink: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };
  const sizes: Record<string, string> = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
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
/* Champs de formulaire                                                */
/* ------------------------------------------------------------------ */

const fieldBase =
  'w-full px-3 py-2.5 rounded-lg border bg-gaming-surface text-gray-100 placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue';

export function Input({ label, error, className, ...props }: any) {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <input
        className={cn(fieldBase, error ? 'border-red-500/60' : 'border-gaming-border', className)}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, ...props }: any) {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <textarea
        className={cn(
          fieldBase,
          'min-h-[90px] resize-y',
          error ? 'border-red-500/60' : 'border-gaming-border',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Select({ label, options, error, className, children, ...props }: any) {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <select
        className={cn(fieldBase, error ? 'border-red-500/60' : 'border-gaming-border', className)}
        {...props}
      >
        {options
          ? options.map((opt: any) => (
              <option key={opt.value} value={opt.value} className="bg-gaming-card">
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
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
          'rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center font-bold text-white overflow-hidden',
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
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gaming-dark',
            online ? 'bg-emerald-500' : 'bg-gray-500'
          )}
        />
      )}
    </div>
  );
}

export function ProgressBar({ value, max = 100, className }: any) {
  return (
    <div className={cn('h-2 rounded-full bg-gaming-surface overflow-hidden', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-purple transition-all duration-500"
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatCard — dans les bannières (fond translucide) ou en grille       */
/* ------------------------------------------------------------------ */

export function StatCard({ label, value, icon, trend, translucent = false, className }: any) {
  return (
    <div
      className={cn(
        'rounded-xl p-4',
        translucent
          ? 'bg-white/10 backdrop-blur-sm border border-white/10'
          : 'border border-gaming-border bg-gaming-card',
        className
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn('text-xs font-medium', translucent ? 'text-white/80' : 'text-gray-400')}>
          {label}
        </span>
        {icon && <span className={translucent ? 'text-white/90' : 'text-neon-blue'}>{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {trend !== undefined && trend !== null && (
          <span
            className={cn('text-xs font-medium', trend > 0 ? 'text-emerald-400' : 'text-red-400')}
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
/* PageHeader — bannière dégradée signature                            */
/* ------------------------------------------------------------------ */

export function PageHeader({
  icon,
  title,
  subtitle,
  action,
  children,
  variant = 'default',
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode; // grille de StatCard translucides
  variant?: BannerVariant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6 sm:p-8 text-white shadow-xl bg-gradient-to-r',
        banners[variant],
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {icon && (
            <div className="shrink-0 bg-white/15 rounded-xl p-3 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{title}</h1>
            {subtitle && <p className="text-white/80 text-sm mt-1">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyState                                                          */
/* ------------------------------------------------------------------ */

export function EmptyState({ icon, title, description, action, className }: any) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-gaming-surface flex items-center justify-center mb-4 text-gray-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-1.5">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-md mb-6">{description}</p>}
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
        'inline-flex gap-1 p-1 rounded-lg bg-gaming-card border border-gaming-border',
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
              'px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2',
              isActive
                ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                : 'text-gray-400 hover:text-white border border-transparent'
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
