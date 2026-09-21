/**
 * Level titles (catalogue §4), mirrored from the backend
 * (`src/rewards/frames.catalog.ts`, `TITLES`). A title is unlocked once the
 * player reaches its level; `User.equippedTitle` stores its id (null = none).
 * Kept apart from the frames library so pages that only show a title do not
 * pull the frames catalogue.
 */
export interface TitleInfo {
  id: string;
  level: number;
  name: { fr: string; en: string };
}

export const TITLES: TitleInfo[] = [
  { id: 'aspirant', level: 5, name: { fr: 'Aspirant', en: 'Aspirant' } },
  { id: 'eclaireur', level: 15, name: { fr: 'Éclaireur', en: 'Scout' } },
  { id: 'sentinelle', level: 25, name: { fr: 'Sentinelle', en: 'Sentinel' } },
  { id: 'lame_affutee', level: 35, name: { fr: 'Lame affûtée', en: 'Honed Blade' } },
  { id: 'gardien_fort', level: 45, name: { fr: 'Gardien du fort', en: 'Keep Warden' } },
  { id: 'capitaine_escouade', level: 55, name: { fr: 'Capitaine d’escouade', en: 'Squad Captain' } },
  { id: 'tacticien', level: 65, name: { fr: 'Tacticien', en: 'Tactician' } },
  { id: 'chef_guerre', level: 75, name: { fr: 'Chef de guerre', en: 'Warlord' } },
  { id: 'briseur_tours', level: 85, name: { fr: 'Briseur de tours', en: 'Tower Breaker' } },
  { id: 'maitre_armes', level: 95, name: { fr: 'Maître d’armes', en: 'Weapon Master' } },
  { id: 'heraut', level: 110, name: { fr: 'Héraut', en: 'Herald' } },
  { id: 'seigneur_voies', level: 120, name: { fr: 'Seigneur des voies', en: 'Lord of the Lanes' } },
  { id: 'archonte', level: 140, name: { fr: 'Archonte', en: 'Archon' } },
  { id: 'parangon', level: 160, name: { fr: 'Parangon', en: 'Paragon' } },
  { id: 'titan', level: 180, name: { fr: 'Titan', en: 'Titan' } },
  { id: 'eternel', level: 190, name: { fr: 'Éternel', en: 'Eternal' } },
  { id: 'souverain_aube', level: 200, name: { fr: 'Souverain de l’aube', en: 'Dawn Sovereign' } },
];

const BY_ID = new Map(TITLES.map((t) => [t.id, t]));

export function getTitle(id: string | null | undefined): TitleInfo | null {
  return (id && BY_ID.get(id)) || null;
}

/** Localized title label, or null when the id is empty or unknown. */
export function titleLabel(id: string | null | undefined, lang: string): string | null {
  const title = getTitle(id);
  return title ? (lang === 'en' ? title.name.en : title.name.fr) : null;
}
