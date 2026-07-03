import type { ComponentType } from 'react';

/**
 * Tokens de design centralisés (façon ShortHub, adaptés à l'identité
 * sombre/gaming de MLBB Togo). L'accent de marque est le dégradé
 * bleu néon -> violet propre à l'univers Mobile Legends.
 *
 * La plupart des composants consomment directement les classes Tailwind
 * (tokens `gaming-*`, `neon-*`, `primary-*`), mais ce fichier fait office
 * de référence unique pour les valeurs sémantiques et les dégradés.
 */

export interface AppTheme {
  primary: string;
  primaryPurple: string;
  gradient: string; // classes tailwind du dégradé de marque
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

/** Couleurs sémantiques (hex) pour icônes et accents ponctuels. */
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

export const radius = { sm: '6px', md: '8px', lg: '12px', xl: '16px', full: '9999px' };
export const shadows = { sm: 'shadow-sm', md: 'shadow-md', lg: 'shadow-lg', xl: 'shadow-xl' };

/**
 * Dégradés de bannière d'en-tête de page. Choisis pour garder un bon
 * contraste avec le texte blanc tout en restant dans l'univers néon.
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

/** Structure d'un item de menu déclaratif. */
export interface MenuItemConfig {
  href: string;
  labelKey: string; // clé i18n
  icon: ComponentType<{ size?: number | string; className?: string }>;
  descKey?: string; // clé i18n de la description (optionnelle)
}

export interface MenuGroupConfig {
  id: string;
  titleKey?: string; // clé i18n du titre de section (optionnelle)
  collapsible?: boolean;
  defaultOpen?: boolean;
  items: MenuItemConfig[];
}
