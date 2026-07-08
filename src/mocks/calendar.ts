import type { CalendarEvent } from './types';

export const calendarEvents: CalendarEvent[] = [
  { id: 'c1', title: 'MPL PH S14 - Week 1', type: 'tournament', start: '2026-07-10T18:00:00Z', end: '2026-07-12T23:00:00Z', description: 'Opening week of MPL Philippines Season 14.', location: 'Manila, PH' },
  { id: 'c2', title: 'Draft Phase - Group A', type: 'draft', start: '2026-07-11T14:00:00Z', description: 'Draft order reveal for Group A teams.' },
  { id: 'c3', title: 'ONIC vs RRQ', type: 'match', start: '2026-07-12T19:00:00Z', description: 'Regular season matchday 3.' },
  { id: 'c4', title: 'Grand Finals', type: 'final', start: '2026-07-20T17:00:00Z', end: '2026-07-20T22:00:00Z', description: 'MPL Indonesia Season 14 Grand Finals.', location: 'Jakarta, ID' },
  { id: 'c5', title: 'Team Meeting - FURIA', type: 'meeting', start: '2026-07-13T21:00:00Z', description: 'Weekly sync and strategy review.' },
  { id: 'c6', title: 'Live Watch Party', type: 'live', start: '2026-07-14T20:00:00Z', description: 'Community watch party for MPL PH matches.' },
];
