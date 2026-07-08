import type { Award } from './types';

export const awards: Award[] = [
  { id: 'a1', category: 'MVP', name: 'Season 14 MVP', season: 'S14', description: 'Best overall player of the season', stats: { kda: 4.2, winRate: 78 } },
  { id: 'a2', category: 'Best Tank', name: 'Best Tank Player', season: 'S14', description: 'Outstanding tank performance', stats: { winRate: 72 } },
  { id: 'a3', category: 'Best Jungler', name: 'Best Jungler', season: 'S14', description: 'Best jungle control and ganks', stats: { gpm: 420 } },
  { id: 'a4', category: 'Best Mid', name: 'Best Mid Laner', season: 'S14', description: 'Dominant mid lane presence', stats: { cs: 85 } },
  { id: 'a5', category: 'Best Gold', name: 'Best Gold Laner', season: 'S14', description: 'Exceptional gold lane farming', stats: { farm: 92 } },
  { id: 'a6', category: 'Best EXP', name: 'Best EXP Laner', season: 'S14', description: 'Top EXP lane performance', stats: { dmg: 88 } },
  { id: 'a7', category: 'Best Roamer', name: 'Best Roamer', season: 'S14', description: 'Best map rotation and support', stats: { assists: 65 } },
  { id: 'a8', category: 'Best Coach', name: 'Best Coach', season: 'S14', description: 'Outstanding strategic leadership', stats: { winRate: 81 } },
  { id: 'a9', category: 'Best Squad', name: 'Best Squad', season: 'S14', description: 'Best team performance', stats: { wins: 18 } },
  { id: 'a10', category: 'Rookie', name: 'Rookie of the Year', season: 'S14', description: 'Most promising new player', stats: { impact: 9.5 } },
];

export const awardCategories = Array.from(new Set(awards.map((a) => a.category)));
