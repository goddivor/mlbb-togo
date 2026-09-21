'use client';

import { createContext, useContext } from 'react';

/**
 * URL prefix of the area a shared page is rendered in: '' for the public site,
 * '/dashboard' inside the member dashboard. Pages shared by both areas (league,
 * awards, hall of fame, seasons) build their internal links with it so a
 * member never leaves the dashboard and a visitor never enters it.
 */
const SectionBaseContext = createContext('');

export function SectionBaseProvider({ base, children }: { base: string; children: React.ReactNode }) {
  return <SectionBaseContext.Provider value={base}>{children}</SectionBaseContext.Provider>;
}

export function useSectionBase() {
  return useContext(SectionBaseContext);
}
