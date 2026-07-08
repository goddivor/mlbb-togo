export interface Player {
  id: string;
  displayName: string;
  username: string;
  avatar?: string;
  country?: string;
  roleUser?: string;
  gameRank?: string;
  gamePeakRank?: string;
  gameLevel?: number;
  winRate?: number;
  matches?: number;
  mvp?: number;
  squad?: { id: string; name: string; logo?: string };
  status?: 'online' | 'offline' | 'ingame';
}

export interface Squad {
  id: string;
  name: string;
  logo?: string;
  coach?: string;
  manager?: string;
  region?: string;
  createdAt?: string;
  wins?: number;
  losses?: number;
  winRate?: number;
}

export interface Hero {
  id: string;
  name: string;
  image?: string;
  pickRate?: number;
  banRate?: number;
  winRate?: number;
  role?: string;
}

export interface Tournament {
  id: string;
  name: string;
  format?: string;
  organizer?: string;
  startDate?: string;
  endDate?: string;
  prizePool?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  registeredTeams?: { id: string; name: string; logo?: string }[];
}

export interface Match {
  id: string;
  teamA?: { id: string; name: string; logo?: string };
  teamB?: { id: string; name: string; logo?: string };
  scoreA?: number;
  scoreB?: number;
  status?: 'upcoming' | 'live' | 'completed';
  type?: 'friendly' | 'official' | 'training';
  scheduledAt?: string;
}

export interface Stream {
  id: string;
  title: string;
  thumbnail?: string;
  tournament?: string;
  teams?: string[];
  duration?: string;
  date?: string;
  type?: 'live' | 'replay' | 'highlight';
  url?: string;
}

export interface Award {
  id: string;
  category: string;
  name: string;
  season: string;
  description?: string;
  image?: string;
  stats?: Record<string, unknown>;
}

export interface HallOfFameSeason {
  id: string;
  season: string;
  champion?: { name?: string; logo?: string };
  runnerUp?: { name?: string; logo?: string };
  third?: { name?: string; logo?: string };
  awards?: Award[];
}

export interface FeedPost {
  id: string;
  author: { name: string; avatar?: string; role?: string };
  date: string;
  type: 'tournament' | 'result' | 'sponsor' | 'recruitment' | 'announcement' | 'highlight' | 'award';
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'match' | 'final' | 'tournament' | 'meeting' | 'draft' | 'live';
  start: string;
  end?: string;
  description?: string;
  location?: string;
}

export interface SearchResult {
  players: Player[];
  squads: Squad[];
  heroes: Hero[];
  tournaments: Tournament[];
  matches: Match[];
  awards: Award[];
  news?: { id: string; title: string; excerpt?: string }[];
  streams: Stream[];
  calendar?: CalendarEvent[];
}
