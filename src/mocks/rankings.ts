import type { Player, Squad, Hero } from './types';

export const playersRankings: Player[] = [
  { id: 'p1', displayName: 'Kane', username: 'kane_mlbb', country: 'ID', gameRank: 'Mythical Glory', gameLevel: 52, winRate: 71, matches: 2100, mvp: 156, squad: { id: 's2', name: 'ONIC' } },
  { id: 'p2', displayName: 'Neymar Jr', username: 'neymar_jr', country: 'BR', gameRank: 'Mythic', gameLevel: 45, winRate: 62, matches: 1240, mvp: 89, squad: { id: 's1', name: 'FURIA' } },
  { id: 'p3', displayName: 'Lucky', username: 'lucky_pro', country: 'PH', gameRank: 'Mythic', gameLevel: 48, winRate: 58, matches: 980, mvp: 45 },
  { id: 'p4', displayName: 'Sanz', username: 'sanz_gg', country: 'TH', gameRank: 'Mythic', gameLevel: 50, winRate: 67, matches: 1560, mvp: 112, squad: { id: 's3', name: 'Buriram' } },
  { id: 'p5', displayName: 'Rasyid', username: 'rasyid_x', country: 'ID', gameRank: 'Legend', gameLevel: 42, winRate: 55, matches: 890, mvp: 34 },
];

export const squadsRankings: Squad[] = [
  { id: 's2', name: 'ONIC', coach: 'CoachOnic', region: 'ID', wins: 145, losses: 28, winRate: 84 },
  { id: 's1', name: 'FURIA', coach: 'CoachFuria', region: 'BR', wins: 120, losses: 34, winRate: 78 },
  { id: 's3', name: 'Buriram', coach: 'CoachBuriram', region: 'TH', wins: 110, losses: 40, winRate: 73 },
  { id: 's4', name: 'EVOS', coach: 'CoachEvos', region: 'ID', wins: 98, losses: 45, winRate: 68 },
  { id: 's5', name: 'RRQ', coach: 'CoachRRQ', region: 'ID', wins: 95, losses: 50, winRate: 65 },
];

export const heroesRankings: Hero[] = [
  { id: 'h1', name: 'Lancelot', pickRate: 18.2, banRate: 24.5, winRate: 51.3, role: 'Assassin' },
  { id: 'h2', name: 'Gusion', pickRate: 15.7, banRate: 22.1, winRate: 49.8, role: 'Assassin' },
  { id: 'h3', name: 'Tigreal', pickRate: 12.4, banRate: 8.3, winRate: 52.1, role: 'Tank' },
  { id: 'h4', name: 'Lunox', pickRate: 14.1, banRate: 18.6, winRate: 50.5, role: 'Mage' },
  { id: 'h5', name: 'Beatrix', pickRate: 11.8, banRate: 12.4, winRate: 51.9, role: 'Marksman' },
];
