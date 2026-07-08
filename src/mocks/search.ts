import type { SearchResult, Player, Squad, Hero, Tournament, Match, Award, Stream, CalendarEvent } from './types';

export const searchResult: SearchResult = {
  players: [
    { id: 'p1', displayName: 'Neymar Jr', username: 'neymar_jr', country: 'BR', gameRank: 'Mythic', gameLevel: 45, winRate: 62, matches: 1240, mvp: 89, status: 'online', squad: { id: 's1', name: 'FURIA' } },
    { id: 'p2', displayName: 'Kane', username: 'kane_mlbb', country: 'ID', gameRank: 'Mythical Glory', gameLevel: 52, winRate: 71, matches: 2100, mvp: 156, status: 'ingame', squad: { id: 's2', name: 'ONIC' } },
    { id: 'p3', displayName: 'Lucky', username: 'lucky_pro', country: 'PH', gameRank: 'Mythic', gameLevel: 48, winRate: 58, matches: 980, mvp: 45, status: 'offline' },
  ] as Player[],
  squads: [
    { id: 's1', name: 'FURIA', logo: '', coach: 'CoachFuria', region: 'BR', wins: 120, losses: 34, winRate: 78 },
    { id: 's2', name: 'ONIC', logo: '', coach: 'CoachOnic', region: 'ID', wins: 145, losses: 28, winRate: 84 },
  ] as Squad[],
  heroes: [
    { id: 'h1', name: 'Lancelot', pickRate: 18.2, banRate: 24.5, winRate: 51.3, role: 'Assassin' },
    { id: 'h2', name: 'Gusion', pickRate: 15.7, banRate: 22.1, winRate: 49.8, role: 'Assassin' },
    { id: 'h3', name: 'Tigreal', pickRate: 12.4, banRate: 8.3, winRate: 52.1, role: 'Tank' },
  ] as Hero[],
  tournaments: [
    { id: 't1', name: 'MPL Indonesia Season 14', status: 'ongoing', prizePool: '$100,000' },
    { id: 't2', name: 'MPL Philippines Season 14', status: 'upcoming', prizePool: '$120,000' },
  ] as Tournament[],
  matches: [
    { id: 'm1', teamA: { id: 's1', name: 'FURIA' }, teamB: { id: 's2', name: 'ONIC' }, scoreA: 2, scoreB: 1, status: 'live', type: 'official', scheduledAt: new Date().toISOString() },
    { id: 'm2', teamA: { id: 's3', name: 'RRQ' }, teamB: { id: 's4', name: 'EVOS' }, scoreA: 0, scoreB: 0, status: 'upcoming', type: 'official', scheduledAt: new Date(Date.now() + 86400000).toISOString() },
  ] as Match[],
  awards: [
    { id: 'a1', category: 'MVP', name: 'Season 14 MVP', season: 'S14', description: 'Best overall player of the season' },
    { id: 'a2', category: 'Best Tank', name: 'Best Tank Player', season: 'S14', description: 'Outstanding tank performance' },
  ] as Award[],
  news: [
    { id: 'n1', title: 'MPL Indonesia Season 14 Finals Recap', excerpt: 'ONIC Esports lifts the trophy...' },
    { id: 'n2', title: 'New Hero Release: Lunox Arcane Skin', excerpt: 'Available now in the event shop...' },
  ],
  streams: [
    { id: 'st1', title: 'MPL ID S14 - Grand Finals', tournament: 'MPL Indonesia', teams: ['ONIC', 'RRQ'], duration: '2:34:15', date: '2026-07-01', type: 'replay' },
    { id: 'st2', title: 'Ranked Grind to Mythic', tournament: '', teams: [], duration: '1:12:40', date: '2026-07-06', type: 'highlight' },
  ] as Stream[],
  calendar: [
    { id: 'c1', title: 'MPL PH S14 - Week 1', type: 'tournament', start: '2026-07-10T18:00:00Z', end: '2026-07-12T23:00:00Z' },
    { id: 'c2', title: 'Draft Phase - Group A', type: 'draft', start: '2026-07-11T14:00:00Z' },
  ] as CalendarEvent[],
};

export const recentSearches = [
  'ONIC Esports',
  'Lancelot',
  'MPL Indonesia',
  'FURIA',
];

export const trendingSearches = [
  'MPL Philippines',
  'New Hero Release',
  'World Championship',
  'Transfer News',
];
