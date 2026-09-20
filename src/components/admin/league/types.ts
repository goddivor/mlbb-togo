import type { Season } from '@/store/useSeasonStore';
import type { MatchResult } from '@/components/standings/bits';

/** Payload of GET /admin/league/overview (#56). */
export type LeagueOverview = {
  generatedAt: string;
  season: Season;
  teams: number;
  matches: {
    total: number;
    byStatus: { scheduled: number; completed: number; cancelled: number };
    byStage: { scrim: number; league: number; playoff: number };
    completedThisWeek: number;
    pendingResults: number;
    unscheduled: number;
    overdue: number;
  };
  standings: {
    frozen: boolean;
    top: {
      rank: number;
      teamId: string;
      team: { id: string; name: string; image?: string | null };
      played: number;
      wins: number;
      losses: number;
      points: number;
      scoreDiff: number;
      form: MatchResult[];
      qualified: boolean;
    }[];
  };
  awards: { filled: number; total: number; missing: string[]; custom: number };
  podiums: { regular: boolean; playoffs: boolean; source: { regular: string; playoffs: string } };
  sponsors: {
    total: number;
    tiers: string[];
    byTier: Record<string, { id: string; name: string; logo: string | null }[]>;
    requestsNew: number;
  };
  announcements: { last7Days: number };
  stream: { configured: boolean; connected: boolean; channel: string | null; live: boolean; liveTitle: string | null };
  checklist: { items: ChecklistItem[]; ready: boolean; closable: boolean };
  lastRecompute: { at: string; matches: number; by: string | null } | null;
};

export type ChecklistItem = {
  key: 'matchesResolved' | 'scoresheets' | 'awards' | 'podiums' | 'summary';
  done: boolean;
  remaining: number;
  href: string;
};

export type RecomputeResult = { seasonId: string; players: number; matches: number; at: string; by: string | null };
