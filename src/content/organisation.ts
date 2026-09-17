/**
 * Facts about the organisation used by the About page and the legal pages.
 * Every value marked TODO is a placeholder the owner must replace before
 * going live; the legal texts interpolate these constants so a single edit
 * updates every page.
 */
export const ORGANISATION = {
  /** Public brand of the community platform. */
  brand: 'MLBB Togo',
  /** Esport structure operating the competitive teams. */
  esportBrand: 'ETERNUM Esports',
  /** Legal entity publishing the site (TODO: exact registered name). */
  legalName: 'Association MLBB Togo',
  /** Legal form (TODO: association loi 1901 equivalent, SARL, etc.). */
  legalForm: 'Association',
  /** Registration or record number (TODO). */
  registration: 'N° de récépissé : à compléter',
  /** Registered office (TODO). */
  address: 'Lomé, Togo (adresse à compléter)',
  /** Publication director (TODO). */
  publisher: 'Responsable de la publication : à compléter',
  /** Contact e-mail addresses (TODO). */
  contactEmail: 'contact@mlbbtogo.com',
  privacyEmail: 'privacy@mlbbtogo.com',
  securityEmail: 'security@mlbbtogo.com',
  /** Phone (TODO). */
  phone: '+228 00 00 00 00',
  /** Public website. */
  website: 'https://mlbbtogo.com',
  /** Hosting provider (TODO: adjust to the real host). */
  hostName: 'Vercel Inc. (frontend) / Railway Corp. (API et base de données)',
  hostAddress: '440 N Barranca Ave #4133, Covina, CA 91723, USA / 548 Market St, San Francisco, CA 94104, USA',
  /** Last review date of the legal pages (ISO). */
  legalUpdatedAt: '2026-09-17',
  /** Founding year used in the About page (TODO: confirm with the owner). */
  foundedYear: 2023,
} as const;
