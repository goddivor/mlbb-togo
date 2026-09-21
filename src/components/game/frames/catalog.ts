import { RAW, type RawFrame } from './raw';

/**
 * Typed catalogue of the 64 avatar frames. Ids, shapes, tiers, levels and
 * temporary durations are those of the validated reference
 * (tools/rewards-proposal/frames-preview.html) and are shared with the
 * backend (`src/rewards/frames.catalog.ts`).
 */

export type FrameTier =
  | 'bronze'
  | 'argent'
  | 'or'
  | 'platine'
  | 'diamant'
  | 'epique'
  | 'legende'
  | 'mythe'
  | 'champion'
  | 'mvp'
  | 'classement'
  | 'role'
  | 'fondateur'
  | 'event';

export type FrameShape = 'circle' | 'square';
export type FrameAnimation = 'none' | 'subtle' | 'strong';
export type FrameCategory = 'level' | 'achievement' | 'special';

export interface FrameInfo {
  id: string;
  name: { fr: string; en: string };
  tier: FrameTier;
  shape: FrameShape;
  /** Level that unlocks the frame (level frames only). */
  level: number | null;
  category: FrameCategory;
  animation: FrameAnimation;
  /** Temporary frame: duration in days, `null` days = until the next season champion. */
  temporary: { days: number | null; label: string } | null;
  /** Unlock condition as written in the catalogue (French, informative). */
  unlockHint: string;
  /** Awarded once per season: accepts a `S<n>` variant (`id:S<n>`). */
  seasonVariant: boolean;
  /** Raw renderers (internal). */
  raw: RawFrame;
}

/** Display order of the tiers (reference order). */
export const FRAME_TIERS: FrameTier[] = [
  'bronze',
  'argent',
  'or',
  'platine',
  'diamant',
  'epique',
  'legende',
  'mythe',
  'champion',
  'mvp',
  'classement',
  'role',
  'fondateur',
  'event',
];

export const FRAME_TIER_COLORS: Record<FrameTier, string> = {
  bronze: '#d98a4e',
  argent: '#c3cbd8',
  or: '#f2b544',
  platine: '#8fc7dc',
  diamant: '#5ee6ff',
  epique: '#a855f7',
  legende: '#f59e0b',
  mythe: '#ff4655',
  champion: '#f6c453',
  mvp: '#c084fc',
  classement: '#38bdf8',
  role: '#22d3ee',
  fondateur: '#14b8a6',
  event: '#22c55e',
};

const SPECIAL_IDS = new Set([
  'champion_saison',
  'dynastie',
  'mvp_saison',
  'voie_gold',
  'voie_mid',
  'voie_jungle',
  'voie_roam',
  'voie_exp',
  'fondateur',
  'independance',
  'harmattan',
  'anniversaire',
  'champion_en_titre',
  'mvp_semaine',
  'numero_un',
  'coupe_independance',
  'saison_pluies',
  'lanternes',
]);

const SEASON_VARIANT_IDS = new Set(['champion_saison', 'mvp_saison', 'voie_gold', 'voie_mid', 'voie_jungle', 'voie_roam', 'voie_exp']);

const ANIMATION: Record<RawFrame['a'], FrameAnimation> = { aucune: 'none', subtile: 'subtle', forte: 'strong' };

function tmpDays(tmp: string): number | null {
  const m = /^(\d+) j$/.exec(tmp);
  return m ? Number(m[1]) : null;
}

export const FRAMES: FrameInfo[] = RAW.map((f) => ({
  id: f.id,
  name: { fr: f.fr, en: f.en },
  tier: f.t as FrameTier,
  shape: f.sq ? 'square' : 'circle',
  level: f.lvl ?? null,
  category: f.lvl ? 'level' : SPECIAL_IDS.has(f.id) ? 'special' : 'achievement',
  animation: ANIMATION[f.a],
  temporary: f.tmp ? { days: tmpDays(f.tmp), label: f.tmp } : null,
  unlockHint: f.u,
  seasonVariant: SEASON_VARIANT_IDS.has(f.id),
  raw: f,
}));

const BY_ID = new Map(FRAMES.map((f) => [f.id, f]));

export const FRAME_IDS: string[] = FRAMES.map((f) => f.id);

/** Level frames sorted by level (the level timeline). */
export const LEVEL_FRAMES: FrameInfo[] = FRAMES.filter((f) => f.level != null).sort(
  (a, b) => (a.level as number) - (b.level as number),
);

export function getFrame(id: string | null | undefined): FrameInfo | null {
  return (id && BY_ID.get(id)) || null;
}

export interface FrameRef {
  id: string;
  /** Variant (e.g. `S2`), empty string when none. */
  variant: string;
}

/** Parse a stored frame reference: `id` or `id:variant`. Returns null when empty. */
export function parseFrameRef(ref: string | null | undefined): FrameRef | null {
  if (!ref || typeof ref !== 'string') return null;
  const i = ref.indexOf(':');
  const id = (i < 0 ? ref : ref.slice(0, i)).trim();
  const variant = i < 0 ? '' : ref.slice(i + 1).trim();
  return id ? { id, variant } : null;
}

/** Build a frame reference from an id and an optional variant. */
export function formatFrameRef(id: string, variant?: string | null): string {
  return variant ? `${id}:${variant}` : id;
}

/** Parse and look up a frame reference; null when empty or unknown. */
export function resolveFrame(ref: string | null | undefined): { frame: FrameInfo; variant: string } | null {
  const parsed = parseFrameRef(ref);
  const frame = parsed ? getFrame(parsed.id) : null;
  return frame ? { frame, variant: parsed!.variant } : null;
}

/** Season number of a `S<n>` variant, or null. */
export function seasonOfVariant(variant: string | null | undefined): number | null {
  const m = /^S(\d{1,3})$/.exec(variant || '');
  return m ? Number(m[1]) : null;
}

/** Frames grouped by tier, in display order (empty tiers omitted). */
export function framesByTier(list: FrameInfo[] = FRAMES): { tier: FrameTier; frames: FrameInfo[] }[] {
  return FRAME_TIERS.map((tier) => ({ tier, frames: list.filter((f) => f.tier === tier) })).filter(
    (g) => g.frames.length > 0,
  );
}
