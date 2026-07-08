import type { HallOfFameSeason, Award } from './types';
import { awards as allAwards } from './awards';

export const hallOfFame: HallOfFameSeason[] = [
  {
    id: 'hof1',
    season: 'Season 14',
    champion: { name: 'ONIC Esports', logo: '' },
    runnerUp: { name: 'FURIA', logo: '' },
    third: { name: 'Buriram United', logo: '' },
    awards: allAwards.filter((a) => a.season === 'S14'),
  },
  {
    id: 'hof2',
    season: 'Season 13',
    champion: { name: 'RRQ', logo: '' },
    runnerUp: { name: 'EVOS Esports', logo: '' },
    third: { name: 'Blacklist International', logo: '' },
    awards: allAwards.map((a) => ({ ...a, season: 'S13', id: `${a.id}-s13` })),
  },
  {
    id: 'hof3',
    season: 'Season 12',
    champion: { name: 'Blacklist International', logo: '' },
    runnerUp: { name: 'ONIC Esports', logo: '' },
    third: { name: 'ECHO', logo: '' },
    awards: allAwards.map((a) => ({ ...a, season: 'S12', id: `${a.id}-s12` })),
  },
];
