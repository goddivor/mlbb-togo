'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/helpers';

export function Button({ children, variant = 'primary', size = 'md', className, disabled, ...props }: any) {
  const base = 'relative inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-neon-blue/50 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants: Record<string, string> = {
    primary: 'text-white shadow-lg hover:shadow-neon hover:scale-105',
    secondary: 'border border-neon-blue/30 text-neon-blue hover:border-neon-blue/60 hover:shadow-neon hover:scale-105',
    ghost: 'text-gray-300 hover:text-white hover:bg-white/10',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:scale-105',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 hover:scale-105',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };

  const gradientBg = variant === 'primary' ? {
    background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)',
  } : {};

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(base, variants[variant], sizes[size], className)}
      style={gradientBg}
      disabled={disabled}
      {...props}
    >
      {variant === 'primary' && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(135deg, #a855f7 0%, #00d4ff 100%)' }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

export function Card({ children, className, hover = true, glow = false, ...props }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : {}}
      className={cn(
        'rounded-xl border p-6 transition-all duration-300',
        'bg-gradient-to-br from-[rgba(18,18,42,0.8)] to-[rgba(26,26,62,0.6)]',
        'border-gaming-border backdrop-blur-sm',
        hover && 'hover:border-neon-blue/30 hover:shadow-neon',
        glow && 'shadow-neon',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Badge({ children, variant = 'default', size = 'md', className }: any) {
  const variants: Record<string, string> = {
    default: 'bg-gaming-surface text-gray-300 border-gaming-border',
    neon: 'bg-neon-blue/20 text-neon-blue border-neon-blue/30',
    purple: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30',
    gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    pink: 'bg-neon-pink/20 text-neon-pink border-neon-pink/30',
  };

  const sizes: Record<string, string> = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full border font-semibold', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}

export function Input({ label, error, className, ...props }: any) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      <input
        className={cn(
          'w-full px-4 py-3 rounded-lg border bg-gaming-card text-white placeholder-gray-500',
          'transition-all duration-300 focus:outline-none',
          'focus:border-neon-blue/50 focus:shadow-neon',
          error ? 'border-red-500/50' : 'border-gaming-border',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Select({ label, options, error, className, ...props }: any) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      <select
        className={cn(
          'w-full px-4 py-3 rounded-lg border bg-gaming-card text-white',
          'transition-all duration-300 focus:outline-none',
          'focus:border-neon-blue/50 focus:shadow-neon',
          error ? 'border-red-500/50' : 'border-gaming-border',
          className
        )}
        {...props}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Avatar({ name, src, size = 'md', online, className }: any) {
  const sizes: Record<string, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const initials = name
    ? name.split(' ').map((w: string) => w[0]).join('').toUpperCase().substring(0, 2)
    : '?';

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center font-bold text-white',
          sizes[size]
        )}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full rounded-xl object-cover" />
        ) : (
          initials
        )}
      </div>
      {online !== undefined && (
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gaming-dark',
            online ? 'bg-green-500' : 'bg-gray-500'
          )}
        />
      )}
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = 'neon-blue', className }: any) {
  const colors: Record<string, string> = {
    'neon-blue': 'bg-neon-blue',
    'neon-purple': 'bg-neon-purple',
    'green': 'bg-green-500',
    'yellow': 'bg-yellow-500',
    'red': 'bg-red-500',
  };

  return (
    <div className={cn('h-2 rounded-full bg-gaming-surface overflow-hidden', className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={cn('h-full rounded-full', colors[color])}
      />
    </div>
  );
}

export function StatCard({ label, value, icon, trend, className }: any) {
  return (
    <div className={cn(
      'rounded-xl border border-gaming-border p-4 bg-gradient-to-br from-[rgba(18,18,42,0.8)] to-[rgba(26,26,62,0.6)]',
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-xs font-medium">{label}</span>
        {icon && <span className="text-neon-blue">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {trend && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gaming-surface flex items-center justify-center mb-4 text-3xl">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-md mb-6">{description}</p>
      {action}
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: any) {
  const sizes: Record<string, string> = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center">
      <div className={cn(
        'rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin',
        sizes[size]
      )} />
    </div>
  );
}

export function Tabs({ tabs, active, onChange, className }: any) {
  return (
    <div className={cn('flex gap-1 p-1 rounded-lg bg-gaming-card border border-gaming-border', className)}>
      {tabs.map((tab: any) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            active === tab.id
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {active === tab.id && (
            <motion.div
              layoutId="tab-active"
              className="absolute inset-0 bg-neon-blue/20 border border-neon-blue/30 rounded-md"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon && <tab.icon size={16} />}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
