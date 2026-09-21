import type { ComponentType } from 'react';

/**
 * Centralized design tokens (ShortHub-style, adapted to the dark/gaming
 * identity of MLBB Togo). The brand accent is the neon blue -> purple
 * gradient specific to the Mobile Legends universe.
 *
 * Most components consume the Tailwind classes directly (`gaming-*`,
 * `neon-*`, `primary-*` tokens), but this file acts as the single
 * reference for semantic values and gradients.
 */

export interface AppTheme {
  primary: string;
  primaryPurple: string;
  gradient: string; // tailwind classes for the brand gradient
  bgPrimary: string;
  textPrimary: string;
  borderPrimary: string;
  ringPrimary: string;
}

export const theme: AppTheme = {
  primary: '#00d4ff', // neon-blue
  primaryPurple: '#a855f7', // neon-purple
  gradient: 'from-neon-blue to-neon-purple',
  bgPrimary: 'bg-neon-blue',
  textPrimary: 'text-neon-blue',
  borderPrimary: 'border-neon-blue',
  ringPrimary: 'ring-neon-blue',
};

/** Semantic colors (hex) for icons and occasional accents. */
export const colors = {
  primary: '#00d4ff',
  purple: '#a855f7',
  pink: '#ec4899',
  gold: '#f59e0b',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#00d4ff',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
};

export const radius = { sm: '4px', md: '8px', lg: '10px', xl: '14px', full: '9999px' };
export const shadows = { sm: 'shadow-elev-1', md: 'shadow-elev-2', lg: 'shadow-elev-3', xl: 'shadow-elev-3' };

/**
 * Esport design system tokens (issue #61). The values live as CSS variables in
 * globals.css (theme-aware); this map documents them and exposes the Tailwind
 * class names so components share one vocabulary.
 */
export const ds = {
  surface: { 0: 'bg-surface-0', 1: 'bg-surface-1', 2: 'bg-surface-2', 3: 'bg-surface-3' },
  line: { subtle: 'border-line-subtle', strong: 'border-line-strong' },
  ink: { 1: 'text-ink-1', 2: 'text-ink-2', 3: 'text-ink-3' },
  accent: {
    cyan: 'text-accent-cyan',
    violet: 'text-accent-violet',
    gold: 'text-accent-gold',
    red: 'text-accent-red',
    green: 'text-accent-green',
  },
  glow: { cyan: 'shadow-glow-cyan', violet: 'shadow-glow-violet', gold: 'shadow-glow-gold' },
  motion: {
    fast: 150,
    base: 220,
    slow: 320,
    easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
    easeInOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  },
} as const;

/** Rank tier used by badges and avatar frames. */
export type RankTier = 'gold' | 'silver' | 'bronze' | 'mythic' | 'none';

/** Map an in-game rank label to a tier (drives RankFrame / Badge tier styles). */
export function rankTier(rank?: string | null): RankTier {
  const r = (rank || '').toLowerCase();
  if (!r) return 'none';
  if (r.includes('immortal') || r.includes('glory')) return 'mythic';
  if (r.includes('mythic') || r.includes('legend')) return 'gold';
  if (r.includes('epic') || r.includes('grandmaster') || r.includes('master')) return 'silver';
  return 'bronze';
}

/**
 * Page header banner gradients. Chosen to keep good contrast with white
 * text while staying within the neon universe.
 */
export const banners = {
  default: 'from-primary-600 via-primary-700 to-neon-purple',
  blue: 'from-primary-600 to-primary-700',
  purple: 'from-purple-600 to-primary-700',
  cyan: 'from-cyan-600 to-primary-700',
  gold: 'from-amber-600 to-orange-600',
  danger: 'from-red-600 to-rose-700',
  green: 'from-emerald-600 to-teal-700',
} as const;

export type BannerVariant = keyof typeof banners;

export const sidebarStyles = {
  width: '256px',
  widthCollapsed: '64px',
  iconSize: 18,
  itemPadding: 'px-3 py-2.5',
  activeIndicatorWidth: '3px',
};

/** Structure of a declarative menu item. */
export interface MenuItemConfig {
  href: string;
  labelKey: string; // i18n key
  icon: ComponentType<{ size?: number | string; className?: string }>;
  descKey?: string; // i18n key of the description (optional)
}

export interface MenuGroupConfig {
  id: string;
  titleKey?: string; // i18n key of the section title (optional)
  collapsible?: boolean;
  defaultOpen?: boolean;
  items: MenuItemConfig[];
}
