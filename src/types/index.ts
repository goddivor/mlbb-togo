// Types partagés (souples) pour les entités de la plateforme MLBB Togo.

export interface Player {
  id: string;
  username: string;
  email?: string;
  avatar?: string | null;
  rank: string;
  role: string;
  favoriteHeroes: string[];
  wins: number;
  losses: number;
  winRate?: number;
  mvpCount: number;
  streak: number;
  country?: string;
  city?: string;
  bio?: string;
  badges: string[];
  joinedAt?: string;
  lastActive?: string;
  isOnline?: boolean;
  isBanned?: boolean;
  teamId?: string | null;
  role_user?: string;
  roleUser?: string;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  logo?: string | null;
  description?: string;
  captainId?: string;
  members: string[] | Player[];
  maxMembers: number;
  wins: number;
  losses: number;
  winRate?: number;
  rank: number;
  foundedAt?: string;
  region?: string;
  achievements: string[];
  isRecruiting: boolean;
  lookingFor: string[];
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorRank?: string;
  category: string;
  title: string;
  content: string;
  likes: number;
  views: number;
  isPinned: boolean;
  createdAt: string;
  comments: Comment[];
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  organizer?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  prizePool?: string;
  maxTeams: number;
  registeredTeams: string[];
  format?: string;
  rules?: string;
  banner?: string | null;
  brackets: any[];
  streamUrl?: string | null;
}

export interface GameEvent {
  id: string;
  title: string;
  type: string;
  description?: string;
  date?: string;
  time?: string;
  duration?: string;
  participants: string[];
  organizer?: string;
  isPublic: boolean;
}

export interface Match {
  id: string;
  team1: { id: string; name: string; score: number };
  team2: { id: string; name: string; score: number };
  tournament?: string;
  date?: string;
  status: string;
  mvp?: string | null;
  duration?: string | null;
  format?: string;
  games: { number: number; winner: string; duration: string; mvp: string }[];
}

export interface Hero {
  id: string;
  name: string;
  role: string;
  image?: string | null;
  description?: string;
}

export interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  status: string;
  createdAt: string;
  responses?: number;
}
