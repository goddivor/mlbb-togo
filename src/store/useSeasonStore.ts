'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { api } from '@/lib/api';

/**
 * Global season selector shared by every page that filters by season
 * (leaderboard, stream, team history, and later standings / matches / stats).
 *
 * `selection` is persisted in localStorage:
 *  - 'current' -> whatever the API considers the current season
 *  - 'all'     -> no season filter
 *  - <id>      -> a specific season
 */

export type SeasonStatus = 'upcoming' | 'active' | 'playoffs' | 'closed';

export type Season = {
  id: string;
  name: string;
  slug: string | null;
  number: number | null;
  theme: string | null;
  slogan: string | null;
  description: string | null;
  status: SeasonStatus;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  playoffsStartDate: string | null;
  closedAt: string | null;
  banner: string | null;
  color: string | null;
  summary: SeasonSummary | null;
};

export type SeasonSummary = {
  version: number;
  frozenAt: string;
  matches: { total: number; completed: number };
  standings: {
    rank: number;
    teamId: string;
    team: { id: string; name: string; image?: string | null };
    played: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    scoreFor: number;
    scoreAgainst: number;
    scoreDiff: number;
  }[];
  podium: { placement: 1 | 2 | 3; teamId: string; team: { id: string; name: string; image?: string | null } }[];
  champion: { teamId: string; team: { id: string; name: string; image?: string | null } } | null;
  awards: any[];
  players: any[];
};

export type SeasonSelection = 'current' | 'all' | string;

const STORAGE_KEY = 'mlbb-season';

export const isLiveSeason = (s?: Season | null) => !!s && (s.status === 'active' || s.status === 'playoffs');

type SeasonState = {
  selection: SeasonSelection;
  hydrated: boolean;
  seasons: Season[];
  current: Season | null;
  loaded: boolean;
  loading: boolean;
  setSelection: (selection: SeasonSelection) => void;
  hydrate: () => void;
  load: (force?: boolean) => Promise<void>;
};

let inFlight: Promise<void> | null = null;

export const useSeasonStore = create<SeasonState>((set, get) => ({
  selection: 'current',
  hydrated: false,
  seasons: [],
  current: null,
  loaded: false,
  loading: false,

  setSelection: (selection) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, selection);
      } catch {
        /* storage may be unavailable (private mode) */
      }
    }
    set({ selection });
  },

  // Read the persisted choice after mount (avoids an SSR hydration mismatch).
  hydrate: () => {
    if (get().hydrated || typeof window === 'undefined') return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }
    set({ hydrated: true, selection: saved || 'current' });
  },

  load: async (force = false) => {
    if (get().loaded && !force) return;
    if (inFlight && !force) return inFlight;
    set({ loading: true });
    inFlight = (async () => {
      try {
        const list = (await api.esport.seasons()) as Season[];
        const seasons = Array.isArray(list) ? list : [];
        const live = seasons.find(isLiveSeason) ?? null;
        let current: Season | null = live;
        if (!current) {
          try {
            current = (await api.esport.currentSeason()) as Season | null;
          } catch {
            current = null;
          }
        }
        set({ seasons, current, loaded: true, loading: false });
      } catch {
        set({ loaded: true, loading: false });
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  },
}));

/**
 * Resolved season for the pages: loads the list once, hydrates the persisted
 * selection and returns the effective season (`null` when "all" is selected
 * or nothing exists) plus the id to send to the API.
 */
export function useSelectedSeason() {
  const selection = useSeasonStore((s) => s.selection);
  const seasons = useSeasonStore((s) => s.seasons);
  const current = useSeasonStore((s) => s.current);
  const loaded = useSeasonStore((s) => s.loaded);
  const hydrated = useSeasonStore((s) => s.hydrated);
  const hydrate = useSeasonStore((s) => s.hydrate);
  const load = useSeasonStore((s) => s.load);
  const setSelection = useSeasonStore((s) => s.setSelection);

  useEffect(() => {
    hydrate();
    void load();
  }, [hydrate, load]);

  let season: Season | null = null;
  if (selection === 'current') season = current;
  else if (selection !== 'all') season = seasons.find((s) => s.id === selection) ?? null;

  return {
    selection,
    setSelection,
    season,
    // `all` (or an unknown id) means no filter.
    seasonId: season?.id ?? null,
    seasons,
    current,
    ready: loaded && hydrated,
  };
}
