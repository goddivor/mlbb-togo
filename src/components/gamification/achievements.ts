// Achievement families and rarities (rewards #125), shared by the Progression
// grid and the admin "Achievements" tab.

export const ACHIEVEMENT_FAMILIES = [
  'competition',
  'league',
  'tournaments',
  'draft',
  'social',
  'community',
  'progression',
  'loyalty',
  'exploration',
  'events',
  'secrets',
] as const;

export type AchievementFamily = (typeof ACHIEVEMENT_FAMILIES)[number];

export const ACHIEVEMENT_RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic'] as const;

export type AchievementRarity = (typeof ACHIEVEMENT_RARITIES)[number];

/** Border / text / badge styles per rarity. */
export const RARITY_STYLE: Record<string, { border: string; text: string; badge: string }> = {
  common: { border: 'border-line-strong', text: 'text-ink-2', badge: 'default' },
  rare: { border: 'border-accent-cyan/60', text: 'text-accent-cyan', badge: 'blue' },
  epic: { border: 'border-accent-violet/60', text: 'text-accent-violet', badge: 'purple' },
  legendary: { border: 'border-accent-gold/70', text: 'text-accent-gold', badge: 'gold' },
  mythic: { border: 'border-accent-red/70', text: 'text-accent-red', badge: 'red' },
};

export function rarityStyle(rarity?: string | null) {
  return RARITY_STYLE[rarity ?? ''] ?? RARITY_STYLE.common;
}

/** Families in display order, unknown families last. */
export function familyOrder(family?: string | null): number {
  const i = ACHIEVEMENT_FAMILIES.indexOf((family ?? '') as AchievementFamily);
  return i < 0 ? ACHIEVEMENT_FAMILIES.length : i;
}

/** `12,5 %` (fr) / `12.5%` (en); one decimal under 10 %. */
export function formatPercent(value: unknown, lang: string): string {
  const raw = Number(value);
  const n = Number.isFinite(raw) && raw > 0 ? raw : 0;
  const digits = n > 0 && n < 10 ? 1 : 0;
  const num = n.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return lang === 'en' ? `${num}%` : `${num} %`;
}
