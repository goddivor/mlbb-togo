import { LEGAL_FR } from './legal.fr';
import { LEGAL_EN } from './legal.en';

export type LegalSlug = 'mentions-legales' | 'securite' | 'cookies' | 'donnees-personnelles';

export const LEGAL_SLUGS: LegalSlug[] = [
  'mentions-legales',
  'securite',
  'cookies',
  'donnees-personnelles',
];

export interface LegalSection {
  /** Anchor id used by the table of contents. */
  id: string;
  title: string;
  paragraphs: string[];
  /** Optional bullet list rendered after the paragraphs. */
  bullets?: string[];
}

export interface LegalPage {
  slug: LegalSlug;
  /** Short label used in navigation (footer, table of contents). */
  label: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}

export type LegalCatalogue = Record<LegalSlug, LegalPage>;

const CATALOGUES: Record<string, LegalCatalogue> = { fr: LEGAL_FR, en: LEGAL_EN };

/** Localized legal page, French when the language has no catalogue. */
export function getLegalPage(lang: string, slug: LegalSlug): LegalPage {
  return (CATALOGUES[lang] ?? LEGAL_FR)[slug];
}

export function getLegalCatalogue(lang: string): LegalCatalogue {
  return CATALOGUES[lang] ?? LEGAL_FR;
}
