
import { gql } from './gql';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006/api';

const TOKEN_KEY = 'mlbb-token';

export const mlbbImg = (url?: string | null, width?: number): string =>
  url
    ? `${API_URL}/mlbb/image?url=${encodeURIComponent(url)}${width ? `&w=${width}` : ''}`
    : '';

export const avatarSrc = (url?: string | null, width = 96): string => {
  if (!url) return '';
  return url.includes('youngjoygame.com') ? mlbbImg(url, width) : url;
};

/** Catalog icon (item, emblem, battle spell): Moonton CDN through the proxy, custom URLs as-is. */
export const catalogIconSrc = (url?: string | null, width = 80): string => avatarSrc(url, width);

/** Counts returned by `POST /catalog/sync` for each catalog. */
export interface CatalogSyncCounts {
  total: number;
  created: number;
  updated: number;
  unchanged: number;
  failed: number;
}
export interface CatalogSyncResult {
  items: CatalogSyncCounts;
  emblems: CatalogSyncCounts;
  battleSpells: CatalogSyncCounts;
  syncedAt: string;
}

/** Rank tier (all, epic, legend, mythic, honor, glory) and window in days. */
export type MetaParams = { rank?: string; days?: number; lang?: string };

/** Catalog statistics filters: rank tier, lane (exp, mid, roam, jungle, gold) and list size. */
export type CatalogStatsParams = { rank?: string; lane?: string; limit?: number };

const metaQs = (params: Record<string, unknown>): string => {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
};

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions {
  method?: string;
  body?: any;

  fallback?: any;

  auth?: boolean;
  /** GET only: skip the short read cache (e.g. re-checking permissions). */
  fresh?: boolean;
}

// Lightweight in-memory cache + GET request de-duplication. Avoids repeated or
// concurrent calls (React StrictMode double-invoke in dev, navigations, several
// components reading the same resource). Any write clears the cache to stay fresh.
const GET_TTL = 20_000; // 20s
const getCache = new Map<string, { at: number; data: any }>();
const inFlight = new Map<string, Promise<any>>();

export function clearApiCache() {
  getCache.clear();
  inFlight.clear();
}

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, fallback, auth = true, fresh = false } = options;
  const isGet = method === 'GET';
  const token = getToken();

  // A write may make the read cache stale.
  if (!isGet) getCache.clear();

  const key = `${path}|${auth && token ? 'a' : 'g'}`;

  if (isGet) {
    const cached = getCache.get(key);
    if (cached && !fresh && Date.now() - cached.at < GET_TTL) return cached.data as T;
    const pending = inFlight.get(key);
    if (pending) return pending as Promise<T>;
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  const doFetch = async (): Promise<T> => {
    try {
      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });
      if (!res.ok) {
        let message = `Erreur ${res.status}`;
        let code: string | undefined;
        try {
          const data = await res.json();
          message = data.message || message;
          code = typeof data.code === 'string' ? data.code : undefined;
        } catch {
          //
        }
        throw new ApiError(message, res.status, code);
      }
      const data = res.status === 204 ? (undefined as T) : ((await res.json()) as T);
      if (isGet) getCache.set(key, { at: Date.now(), data });
      return data;
    } catch (err) {
      if (fallback !== undefined) {
        // eslint-disable-next-line no-console
        console.warn(`[api] échec sur ${path}, repli.`);
        return fallback as T;
      }
      throw err;
    }
  };

  if (!isGet) return doFetch();

  // De-duplication: identical in-flight GETs share one promise.
  const p = doFetch().finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

/** Catalog entry as embedded in a community build. */
export interface BuildCatalogEntry {
  id: string;
  name: string;
  icon?: string | null;
  description?: string | null;
  enabled?: boolean | null;
  gameId?: number | null;
}

export interface EmblemTalent extends BuildCatalogEntry {
  tier: number;
}

export interface CommunityBuildReportRow {
  id: string;
  reason: string;
  details?: string | null;
  createdAt: string;
  reporter?: { id: string; username?: string | null; displayName?: string | null; avatar?: string | null } | null;
}

export interface CommunityBuild {
  id: string;
  title: string;
  notes?: string | null;
  lane?: string | null;
  status: 'draft' | 'published' | 'hidden';
  likesCount: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  hero: { id: string; heroId?: number | null; name: string; image?: string | null; roles?: string[] };
  author: { id: string; username?: string | null; displayName?: string | null; avatar?: string | null };
  items: BuildCatalogEntry[];
  emblem?: BuildCatalogEntry | null;
  talents: EmblemTalent[];
  battleSpell?: BuildCatalogEntry | null;
  isMine: boolean;
  likedByMe: boolean;
  reportedByMe: boolean;
  hiddenAt?: string | null;
  hiddenReason?: string | null;
  reportsCount?: number;
  reports?: CommunityBuildReportRow[];
}

export interface CommunityBuildPage {
  items: CommunityBuild[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type CommunityBuildListParams = {
  hero?: string | number;
  lane?: string;
  sort?: 'likes' | 'recent';
  page?: number;
  limit?: number;
};

export interface CommunityBuildInput {
  title: string;
  notes?: string | null;
  lane?: string | null;
  itemIds: string[];
  emblemId?: string | null;
  talentIds: string[];
  battleSpellId?: string | null;
}

export class ApiError extends Error {
  status: number;
  /** Machine-readable error code when the API sends one (e.g. community builds). */
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** Application life cycle shared with the recruitment API. */
export type RecruitmentApplicationStatus =
  | 'pending'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface RecruitmentFilters {
  role?: string;
  /** The browsing player's own rank level: keeps the campaigns they qualify for. */
  rankLevel?: number;
  availability?: string;
  status?: 'open' | 'closed' | 'all';
  limit?: number;
}

export interface ApplicationFilters {
  status?: RecruitmentApplicationStatus | 'active' | 'all';
  role?: string;
  minRankLevel?: number;
  availability?: string;
  limit?: number;
}

/** Drops empty values so an untouched filter never reaches the API. */
function qs(params?: Record<string, any>): string {
  if (!params) return '';
  const search = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return search ? `?${search}` : '';
}
/** A row of the personal notification mailbox (Prisma `Notification`). */
export type AppNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any> | null;
  read: boolean;
  link?: string | null;
  createdAt: string;
};

export type NotificationsQuery = {
  type?: string;
  status?: 'all' | 'unread' | 'read';
  page?: number;
  limit?: number;
};

export type NotificationPage = {
  items: AppNotification[];
  /** Rows matching the active filters. */
  total: number;
  /** Unread rows in the whole mailbox, filters excluded (drives the bell). */
  unread: number;
  /** Row count per type over the whole mailbox, to build the filter chips. */
  counts: Record<string, number>;
  page: number;
  limit: number;
  pages: number;
};

export type IntegrationName = 'anthropic' | 'cloudinary';

type IntegrationMeta = {
  configured: boolean;
  /** Where the effective secret comes from. */
  source: 'db' | 'env' | null;
  /** True when values are stored in the database (removable). */
  stored: boolean;
  /** Stored values exist but cannot be decrypted (ENCRYPTION_KEY changed). */
  unreadable: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type IntegrationsStatus = {
  encryptionReady: boolean;
  anthropic: IntegrationMeta & {
    apiKeyHint: string | null;
    model: string;
    storedModel: string | null;
    defaultModel: string;
  };
  cloudinary: IntegrationMeta & {
    cloudName: string | null;
    apiKeyHint: string | null;
    apiSecretHint: string | null;
    folder: string | null;
    /** Values stored in the database (the form pre-fills these, not the env fallbacks). */
    storedCloudName: string | null;
    storedFolder: string | null;
  };
};

export type IntegrationTestResult = {
  ok: boolean;
  code: 'ok' | 'not_configured' | 'unauthorized' | 'model_not_found' | 'not_found' | 'rate_limited' | 'network' | 'error';
  message: string;
  detail?: string;
};

/** Image upload purposes (#131), mirrored from the API `media.logic.ts`. */
export type MediaPurpose =
  | 'avatar'
  | 'team'
  | 'team-staff'
  | 'sponsor'
  | 'tournament'
  | 'season'
  | 'award'
  | 'match';
export type MediaStatus = 'pending' | 'approved' | 'rejected';

export type MediaAsset = {
  id: string;
  publicId: string;
  url: string;
  purpose: MediaPurpose;
  targetType: string;
  targetId: string | null;
  uploadedById: string;
  status: MediaStatus;
  bytes: number;
  width: number;
  height: number;
  format: string;
  reviewedAt: string | null;
  rejectReason: string | null;
  destroyed: boolean;
  createdAt: string;
  /** Library only. */
  inUse?: boolean;
  uploader?: string | null;
  reviewer?: string | null;
  targetLabel?: string | null;
};

export type MediaConfig = { enabled: boolean; maxBytes: number; formats: string[] };

export type MediaUploadTicket = {
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  params: Record<string, string | number>;
  maxBytes: number;
  formats: string[];
  expiresAt: string;
  status: 'approved' | 'pending';
};

export type MediaConfirmResult = {
  asset: MediaAsset;
  url: string;
  status: MediaStatus;
  /** True when the API already wrote the image into the target record. */
  applied: boolean;
};

export type MediaTargetState = {
  current: string | null;
  pending: MediaAsset | null;
  uploadStatus: 'approved' | 'pending';
  canPasteUrl: boolean;
};

export type MediaLibraryPage = {
  items: MediaAsset[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  counts: Record<MediaStatus, number>;
};

export const api = {

  auth: {
    me: (fresh = false) => request('/auth/me', { fresh }),

    adminLogin: (data: { username: string; password: string }) =>
      request('/auth/admin/login', { method: 'POST', body: data, auth: false }),

    mlbbSendVc: (data: { roleId: number; zoneId: number }) =>
      request('/auth/mlbb/send-vc', { method: 'POST', body: data, auth: false }),
    mlbbLogin: (data: { roleId: number; zoneId: number; vc: number }) =>
      request('/auth/mlbb/login', { method: 'POST', body: data, auth: false }),

    google: (data: { accessToken: string }) =>
      request('/auth/google', { method: 'POST', body: data, auth: false }),

    linkMlbb: (data: { roleId: number; zoneId: number; vc: number }) =>
      request('/auth/link/mlbb', { method: 'POST', body: data }),
    linkGoogle: (data: { accessToken: string }) =>
      request('/auth/link/google', { method: 'POST', body: data }),

    setProfileSource: (source: 'google' | 'game') =>
      request('/auth/profile-source', { method: 'PATCH', body: { source } }),

    syncGame: () => request('/auth/sync-game', { method: 'POST' }),

    unlinkMlbb: () => request('/auth/unlink/mlbb', { method: 'POST' }),

    gameHeroes: (sid: number) => request(`/auth/game/heroes?sid=${sid}`),
  },

  users: {
    list: () => request('/users', { fallback: [], auth: false }),
    adminList: () => request('/users/admin', { fallback: [] }),
    leaderboard: (
      params: {
        metric?: 'winRate' | 'wins' | 'mvpCount' | 'streak';
        role?: string;
        seasonId?: string;
        minGames?: number;
        limit?: number;
      } = {},
    ) => {
      const qs = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ).toString();
      return request(`/users/leaderboard${qs ? `?${qs}` : ''}`, {
        fallback: { metric: 'winRate', total: 0, entries: [] },
        auth: false,
      });
    },
    get: (id: string) => request(`/users/${id}`, { fallback: null, auth: false }),
    // Public esport stats (win rate, KDA, heroes, progression, badges).
    stats: (id: string) => request(`/users/${id}/stats`, { fallback: null, auth: false }),
    // Public paginated esport match history.
    matches: (id: string, page = 1, limit = 10) =>
      request(`/users/${id}/matches?page=${page}&limit=${limit}`, {
        fallback: { items: [], total: 0, page, limit, hasMore: false },
        auth: false,
      }),
    // Cached game account data (public, privacy-aware; the owner's session is
    // sent when present so a private profile stays visible to its owner).
    game: (id: string) => request(`/users/${id}/game`, { fallback: null }),
    gameMatches: (
      id: string,
      params: { season?: number | null; hero?: number | null; page?: number; limit?: number } = {},
    ) => {
      const qs = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)]),
      ).toString();
      const page = params.page ?? 1;
      const limit = params.limit ?? 10;
      return request(`/users/${id}/game/matches${qs ? `?${qs}` : ''}`, {
        fallback: { items: [], total: 0, page, limit, hasMore: false },
      });
    },
    gameMatch: (id: string, bid: string) => request(`/users/${id}/game/matches/${encodeURIComponent(bid)}`),
    update: (id: string, data: any) => request(`/users/${id}`, { method: 'PATCH', body: data }),
    remove: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
    deleteSelf: () => request('/users/me', { method: 'DELETE' }),
    setBan: (id: string, isBanned: boolean) =>
      request(`/users/${id}/ban`, { method: 'PATCH', body: { isBanned } }),
    setRole: (id: string, roleUser: string) =>
      request(`/users/${id}/role`, { method: 'PATCH', body: { roleUser } }),
    /** RBAC: replace the roles of a user (requires `admin.roles`). */
    setRoles: (id: string, roleIds: string[]) =>
      request(`/users/${id}/roles`, { method: 'PATCH', body: { roleIds } }),
    setSystemAccount: (id: string, isSystemAccount: boolean) =>
      request(`/users/${id}/system-account`, { method: 'PATCH', body: { isSystemAccount } }),
  },

  /** RBAC roles & permission catalogue (admin). */
  roles: {
    catalogue: () => request('/roles/permissions', { fallback: { groups: [], permissions: [] } }),
    list: () => request('/roles', { fallback: [] }),
    get: (id: string) => request(`/roles/${id}`),
    create: (data: any) => request('/roles', { method: 'POST', body: data }),
    update: (id: string, data: any) => request(`/roles/${id}`, { method: 'PATCH', body: data }),
    remove: (id: string) => request(`/roles/${id}`, { method: 'DELETE' }),
    addMember: (id: string, userId: string) =>
      request(`/roles/${id}/members`, { method: 'POST', body: { userId } }),
    removeMember: (id: string, userId: string) =>
      request(`/roles/${id}/members/${userId}`, { method: 'DELETE' }),
  },

  teams: {
    list: () => request('/teams', { fallback: [], auth: false }),
    get: (id: string) => request(`/teams/${id}`, { fallback: null, auth: false }),
    create: (data: any) => request('/teams', { method: 'POST', body: data }),
    update: (id: string, data: any) => request(`/teams/${id}`, { method: 'PATCH', body: data }),
    remove: (id: string) => request(`/teams/${id}`, { method: 'DELETE' }),
  },

  posts: {
    list: (category?: string) =>
      request(`/posts${category ? `?category=${category}` : ''}`, {
        fallback: [],
        auth: false,
      }),
    get: (id: string) => request(`/posts/${id}`, { fallback: null, auth: false }),
    create: (data: any) => request('/posts', { method: 'POST', body: data }),
    remove: (id: string) => request(`/posts/${id}`, { method: 'DELETE' }),
    // Per-user toggle: returns `{ liked, likes }` (auth required).
    like: (id: string) => request(`/posts/${id}/like`, { method: 'POST' }),
    comment: (id: string, data: any) =>
      request(`/posts/${id}/comments`, { method: 'POST', body: data }),
    // Communication feed (issue #49).
    feed: (params: { category?: string; sort?: string; page?: number; limit?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.category && params.category !== 'all') qs.set('category', params.category);
      if (params.sort) qs.set('sort', params.sort);
      if (params.page) qs.set('page', String(params.page));
      if (params.limit) qs.set('limit', String(params.limit));
      const q = qs.toString();
      return request(`/posts/feed${q ? `?${q}` : ''}`, {
        fallback: { items: [], total: 0, page: 1, limit: 10, hasMore: false },
        auth: false,
      });
    },
    categories: () =>
      request('/posts/categories', {
        fallback: { categories: [], counts: {} },
        auth: false,
      }),
    liked: () => request('/posts/liked', { fallback: [] }),
    share: (id: string) => request(`/posts/${id}/share`, { method: 'POST', auth: false }),
    update: (id: string, data: any) =>
      request(`/posts/${id}`, { method: 'PATCH', body: data }),
  },

  tournaments: {
    list: () => request('/tournaments', { fallback: [], auth: false }),
    get: (id: string) => request(`/tournaments/${id}`, { fallback: null, auth: false }),
    create: (data: any) => request('/tournaments', { method: 'POST', body: data }),
    update: (id: string, data: any) =>
      request(`/tournaments/${id}`, { method: 'PATCH', body: data }),
    remove: (id: string) => request(`/tournaments/${id}`, { method: 'DELETE' }),
    register: (id: string, teamId: string) =>
      request(`/tournaments/${id}/register`, { method: 'POST', body: { teamId } }),
    unregister: (id: string, teamId: string) =>
      request(`/tournaments/${id}/register/${teamId}`, { method: 'DELETE' }),
    // Detail view: participants, bracket, results, MVP, schedule, live match.
    details: (id: string) =>
      request(`/tournaments/${id}/details`, { fallback: null, auth: false }),
    // Admin: bracket management.
    generateBracket: (id: string, seeding: 'random' | 'order' = 'random') =>
      request(`/tournaments/${id}/bracket/generate`, { method: 'POST', body: { seeding } }),
    resetBracket: (id: string) => request(`/tournaments/${id}/bracket`, { method: 'DELETE' }),
    setMatchResult: (
      id: string,
      matchId: string,
      data: { scoreA: number; scoreB: number; winnerTeamId?: string },
    ) => request(`/tournaments/${id}/matches/${matchId}/result`, { method: 'PATCH', body: data }),
    scheduleMatch: (
      id: string,
      matchId: string,
      data: { scheduledAt?: string | null; streamUrl?: string | null },
    ) => request(`/tournaments/${id}/matches/${matchId}/schedule`, { method: 'PATCH', body: data }),
    setMatchStatus: (id: string, matchId: string, status: string) =>
      request(`/tournaments/${id}/matches/${matchId}/status`, { method: 'PATCH', body: { status } }),
    setMvp: (id: string, userId: string | null) =>
      request(`/tournaments/${id}/mvp`, { method: 'PATCH', body: { userId } }),
  },

  events: {
    list: () => request('/events', { fallback: [], auth: false }),
    get: (id: string) => request(`/events/${id}`, { fallback: null, auth: false }),
    create: (data: any) => request('/events', { method: 'POST', body: data }),
    remove: (id: string) => request(`/events/${id}`, { method: 'DELETE' }),
  },

  matches: {
    list: () => request('/matches', { fallback: [], auth: false }),
    get: (id: string) => request(`/matches/${id}`, { fallback: null, auth: false }),
    create: (data: any) => request('/matches', { method: 'POST', body: data }),
  },

  search: {
    all: (q?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (limit) params.set('limit', String(limit));
      return request(`/search${params.toString() ? `?${params}` : ''}`, {
        fallback: { users: [], heroes: [], teams: [], tournaments: [], events: [] },
        auth: false,
      });
    },
  },

  heroes: {
    list: (role?: string) =>
      request(`/heroes${role ? `?role=${role}` : ''}`, { fallback: [], auth: false }),
    get: (id: string) => request(`/heroes/${id}`, { auth: false }),
    // Admin: resync heroes from MLBB, returns { updated }.
    refresh: (): Promise<{ updated: number }> =>
      request('/heroes/refresh', { method: 'POST' }),

    // Live Moonton meta (cached server side). `heroId` is the Moonton id; rates in %.
    metaRanking: (params: MetaParams & { role?: string; lane?: string; sort?: string; order?: string } = {}) =>
      request(`/heroes/meta/ranking${metaQs(params)}`, { fallback: null, auth: false }),
    metaStats: (heroId: number | string, params: MetaParams = {}) =>
      request(`/heroes/${heroId}/meta/stats${metaQs(params)}`, { fallback: null, auth: false }),
    metaTrends: (heroId: number | string, params: MetaParams = {}) =>
      request(`/heroes/${heroId}/meta/trends${metaQs(params)}`, { fallback: null, auth: false }),
    metaTimeline: (heroId: number | string, params: MetaParams & { lane?: string } = {}) =>
      request(`/heroes/${heroId}/meta/timeline${metaQs(params)}`, { fallback: null, auth: false }),
    metaMatchups: (heroId: number | string, params: MetaParams = {}) =>
      request(`/heroes/${heroId}/meta/matchups${metaQs(params)}`, { fallback: null, auth: false }),
    metaBuilds: (heroId: number | string, params: MetaParams & { lane?: string } = {}) =>
      request(`/heroes/${heroId}/meta/builds${metaQs(params)}`, { fallback: null, auth: false }),
  },

  lanes: {
    list: () => request('/lanes', { fallback: [], auth: false }),
    // Admin: update a lane by its key.
    update: (key: string, payload: any) =>
      request(`/lanes/${key}`, { method: 'PATCH', body: payload }),
  },

  // Read layer via GraphQL (/graphql) - same shapes as REST.
  catalog: {
    esportOrg: () =>
      gql<{ esportOrg: any }>(
        `{ esportOrg { id name logo color description teams { id name image description type sort } } }`,
      ).then((d) => d.esportOrg),
    sponsors: () =>
      gql<{ sponsors: any[] }>(
        `{ sponsors { id name logo url sort tier description } }`,
      ).then((d) => d.sponsors),
    lanes: () =>
      gql<{ lanes: any[] }>(
        `{ lanes { id key name shortName description icon color compatibleClasses sort } }`,
      ).then((d) => d.lanes),
    roles: () =>
      gql<{ heroRoles: any[] }>(
        `{ heroRoles { id key name icon sort } }`,
      ).then((d) => d.heroRoles),
    heroes: (role?: string) =>
      gql<{ heroes: any[] }>(
        `query($role: String) { heroes(role: $role) { id name role } }`,
        { role },
      ).then((d) => d.heroes),
    showcaseHeroes: (count?: number) =>
      gql<{ showcaseHeroes: any[] }>(
        `query($count: Int) { showcaseHeroes(count: $count) { name art thumb image roles laneKeys } }`,
        { count },
      ).then((d) => d.showcaseHeroes),
  },

  admin: {
    // These routes are admin-only on the backend (JwtAuthGuard + RolesGuard):
    // they MUST send the auth token, and must NOT fall back to fabricated data
    // (that silently hid auth failures and showed fake stats/logs to admins).
    stats: () =>
      request('/admin/stats', {
        fallback: {
          totalUsers: 0, totalTeams: 0, totalTournaments: 0, totalPosts: 0,
          activeUsers: 0, totalMatches: 0, onlineNow: 0, newUsersToday: 0,
        },
      }),
    logs: () => request('/admin/logs', { fallback: [] }),
    addLog: (data: any) => request('/admin/logs', { method: 'POST', body: data }),

    // League control room (#56): aggregated season overview + quick actions.
    league: {
      overview: (seasonId?: string | null) =>
        request(`/admin/league/overview${seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : ''}`),
      announce: (data: { title: string; content: string; contentFormat?: string; images?: string[]; pin?: boolean }) =>
        request('/admin/league/announce', { method: 'POST', body: data }),
      recompute: (seasonId?: string | null) =>
        request(`/admin/league/recompute${seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : ''}`, { method: 'POST' }),
    },

    // Third-party integrations (#130): secrets are write-only, the API only
    // returns masked hints. Secret fields: '' keeps the stored value, null removes it.
    integrations: {
      status: () => request<IntegrationsStatus>('/admin/integrations', { fresh: true }),
      update: (name: IntegrationName, data: Record<string, string | null>) =>
        request<IntegrationsStatus>(`/admin/integrations/${name}`, { method: 'PUT', body: data }),
      remove: (name: IntegrationName) =>
        request<IntegrationsStatus>(`/admin/integrations/${name}`, { method: 'DELETE' }),
      test: (name: IntegrationName) =>
        request<IntegrationTestResult>(`/admin/integrations/${name}/test`, { method: 'POST' }),
    },

    // Media library (#131): every tracked upload, moderation of pending images.
    media: {
      list: (params: { purpose?: string; status?: string; uploader?: string; page?: number; limit?: number } = {}) =>
        request<MediaLibraryPage>(`/admin/media${qs(params)}`, { fresh: true }),
      approve: (id: string) => request<MediaAsset>(`/admin/media/${id}/approve`, { method: 'POST' }),
      reject: (id: string, reason?: string) =>
        request<MediaAsset>(`/admin/media/${id}/reject`, { method: 'POST', body: { reason } }),
      remove: (id: string) => request(`/admin/media/${id}`, { method: 'DELETE' }),
    },
  },

  // Signed direct uploads to Cloudinary (#131): sign -> upload -> confirm.
  media: {
    config: () => request<MediaConfig>('/media/config', { fallback: { enabled: false, maxBytes: 0, formats: [] } }),
    sign: (purpose: MediaPurpose, targetId?: string | null) =>
      request<MediaUploadTicket>('/media/sign', { method: 'POST', body: { purpose, targetId: targetId || undefined } }),
    confirm: (purpose: MediaPurpose, targetId: string | null | undefined, publicId: string) =>
      request<MediaConfirmResult>('/media/confirm', {
        method: 'POST',
        body: { purpose, targetId: targetId || undefined, publicId },
      }),
    target: (purpose: MediaPurpose, targetId: string) =>
      request<MediaTargetState>(`/media/targets/${purpose}/${targetId}`, { fresh: true }),
    removeFromTarget: (purpose: MediaPurpose, targetId: string) =>
      request(`/media/targets/${purpose}/${targetId}`, { method: 'DELETE' }),
    remove: (id: string) => request(`/media/${id}`, { method: 'DELETE' }),
  },

  mlbb: {

    heroes: (limit?: number) =>
      request(`/mlbb/heroes${limit ? `?limit=${limit}` : ''}`, { fallback: { total: 0, heroes: [] }, auth: false }),

    latest: (count = 6) =>
      request(`/mlbb/heroes/latest?count=${count}`, { fallback: [], auth: false }),

    showcase: (count = 6) =>
      request(`/mlbb/heroes/showcase?count=${count}`, { fallback: [], auth: false }),

    hero: (id: number | string) =>
      request(`/mlbb/heroes/${id}`, { auth: false }),

    heroMeta: (id: number | string) =>
      request(`/mlbb/heroes/${id}/meta`, { fallback: null, auth: false }),

    ranking: (params: { limit?: number; sort?: string; rank?: string; matchType?: number } = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
      ).toString();
      return request(`/mlbb/ranking${qs ? `?${qs}` : ''}`, { fallback: { total: 0, ranking: [] }, auth: false });
    },
  },

  // League standings (#43): season table, head-to-head, PDF export, settings.
  standings: {
    get: (seasonId: string, type: 'league' | 'playoff' | 'all' = 'league') =>
      request(`/standings?seasonId=${encodeURIComponent(seasonId)}&type=${type}`, {
        fallback: null,
        auth: false,
      }),
    h2h: (seasonId: string, teamA: string, teamB?: string, type: 'league' | 'playoff' | 'all' = 'all') =>
      request(
        `/standings/h2h?seasonId=${encodeURIComponent(seasonId)}&teamA=${encodeURIComponent(teamA)}${
          teamB ? `&teamB=${encodeURIComponent(teamB)}` : ''
        }&type=${type}`,
        { fallback: null, auth: false },
      ),
    /** Direct download URL of the server-side PDF (opened in a new tab). */
    exportUrl: (seasonId: string, type: 'league' | 'playoff' | 'all', lang: string) =>
      `${API_URL}/standings/export.pdf?seasonId=${encodeURIComponent(seasonId)}&type=${type}&lang=${encodeURIComponent(lang)}`,
    settings: (seasonId: string) =>
      request(`/standings/settings/${encodeURIComponent(seasonId)}`, { fallback: null, auth: false }),
    updateSettings: (seasonId: string, data: { qualifyTop?: number; points?: { win?: number; draw?: number; loss?: number } }) =>
      request(`/standings/settings/${encodeURIComponent(seasonId)}`, { method: 'PATCH', body: data }),
  },

  game: {
    // Game items (equipment/builds)
    items: () => request('/items', { fallback: [], auth: false }),
    item: (id: string) => request(`/items/${id}`, { fallback: null, auth: false }),
    createItem: (data: any) => request('/items', { method: 'POST', body: data }),
    updateItem: (id: string, data: any) =>
      request(`/items/${id}`, { method: 'PATCH', body: data }),
    deleteItem: (id: string) => request(`/items/${id}`, { method: 'DELETE' }),
    // Admin lists: include hidden entries (`enabled: false`).
    itemsAll: () => request('/items/all'),
    emblemsAll: () => request('/emblems/all'),
    battleSpellsAll: () => request('/battle-spells/all'),
    // Imports items, emblems and battle spells (icons, descriptions) from Moonton.
    syncCatalog: (): Promise<CatalogSyncResult> => request('/catalog/sync', { method: 'POST' }),

    // Game emblems
    emblems: () => request('/emblems', { fallback: [], auth: false }),
    emblem: (id: string) => request(`/emblems/${id}`, { fallback: null, auth: false }),
    createEmblem: (data: any) => request('/emblems', { method: 'POST', body: data }),
    updateEmblem: (id: string, data: any) =>
      request(`/emblems/${id}`, { method: 'PATCH', body: data }),
    deleteEmblem: (id: string) => request(`/emblems/${id}`, { method: 'DELETE' }),

    // Battle spells
    battleSpells: () => request('/battle-spells', { fallback: [], auth: false }),
    battleSpell: (id: string) => request(`/battle-spells/${id}`, { fallback: null, auth: false }),
    createBattleSpell: (data: any) => request('/battle-spells', { method: 'POST', body: data }),
    updateBattleSpell: (id: string, data: any) =>
      request(`/battle-spells/${id}`, { method: 'PATCH', body: data }),
    deleteBattleSpell: (id: string) => request(`/battle-spells/${id}`, { method: 'DELETE' }),
  },

  // Public catalog pages (enabled entries). Statistics come from the cached
  // Academy builds; `available: false` when Moonton could not be reached.
  gameCatalog: {
    items: () =>
      request('/catalog/items', { fallback: { total: 0, categories: [], items: [] }, auth: false }),
    itemHeroes: (gameId: number | string, params: CatalogStatsParams = {}) =>
      request(`/catalog/items/${gameId}/heroes${metaQs(params)}`, { fallback: null, auth: false }),
    synergies: (params: CatalogStatsParams & { item?: number | string } = {}) =>
      request(`/catalog/items/synergies${metaQs(params)}`, { fallback: null, auth: false }),
    spells: (params: CatalogStatsParams = {}) =>
      request(`/catalog/spells${metaQs(params)}`, { fallback: null, auth: false }),
    emblems: (params: CatalogStatsParams = {}) =>
      request(`/catalog/emblems${metaQs(params)}`, { fallback: null, auth: false }),
  },

  // Community builds (#129): player-made builds, likes, reports, moderation.
  communityBuilds: {
    list: (params: CommunityBuildListParams = {}): Promise<CommunityBuildPage> =>
      request(`/community-builds${metaQs(params)}`, {
        fallback: { items: [], total: 0, page: 1, limit: 20, hasMore: false },
      }),
    mine: (): Promise<CommunityBuild[]> => request('/community-builds/mine', { fresh: true }),
    get: (id: string): Promise<CommunityBuild> => request(`/community-builds/${id}`),
    talents: (): Promise<EmblemTalent[]> =>
      request('/community-builds/talents', { fallback: [], auth: false }),
    create: (data: CommunityBuildInput & { heroId: string; publish?: boolean }): Promise<CommunityBuild> =>
      request('/community-builds', { method: 'POST', body: data }),
    update: (id: string, data: Partial<CommunityBuildInput>): Promise<CommunityBuild> =>
      request(`/community-builds/${id}`, { method: 'PATCH', body: data }),
    remove: (id: string) => request(`/community-builds/${id}`, { method: 'DELETE' }),
    publish: (id: string): Promise<CommunityBuild> =>
      request(`/community-builds/${id}/publish`, { method: 'POST' }),
    unpublish: (id: string): Promise<CommunityBuild> =>
      request(`/community-builds/${id}/unpublish`, { method: 'POST' }),
    like: (id: string): Promise<{ liked: boolean; likesCount: number }> =>
      request(`/community-builds/${id}/like`, { method: 'PUT' }),
    unlike: (id: string): Promise<{ liked: boolean; likesCount: number }> =>
      request(`/community-builds/${id}/like`, { method: 'DELETE' }),
    report: (id: string, data: { reason: string; details?: string }) =>
      request(`/community-builds/${id}/report`, { method: 'POST', body: data }),
    // Moderation (`builds.moderate`). filter: reported | hidden | all.
    moderation: (params: { filter?: string; page?: number; limit?: number } = {}): Promise<CommunityBuildPage> =>
      request(`/moderation/community-builds${metaQs(params)}`, { fresh: true }),
    hide: (id: string, reason?: string) =>
      request(`/moderation/community-builds/${id}/hide`, { method: 'POST', body: { reason } }),
    unhide: (id: string) => request(`/moderation/community-builds/${id}/unhide`, { method: 'POST' }),
    dismissReports: (id: string) =>
      request(`/moderation/community-builds/${id}/dismiss-reports`, { method: 'POST' }),
    moderatorDelete: (id: string) => request(`/moderation/community-builds/${id}`, { method: 'DELETE' }),
  },

  builds: {
    // Recommended builds per hero
    byHero: (heroId: string) =>
      request(`/heroes/${heroId}/builds`, { fallback: [], auth: false }),
    get: (heroId: string, buildId: string) =>
      request(`/heroes/${heroId}/builds/${buildId}`, { fallback: null, auth: false }),
    create: (heroId: string, data: any) =>
      request(`/heroes/${heroId}/builds`, { method: 'POST', body: data }),
    update: (heroId: string, buildId: string, data: any) =>
      request(`/heroes/${heroId}/builds/${buildId}`, { method: 'PATCH', body: data }),
    delete: (heroId: string, buildId: string) =>
      request(`/heroes/${heroId}/builds/${buildId}`, { method: 'DELETE' }),
  },

  esport: {
    org: () => request('/esport', { fallback: null, auth: false }),
    teams: (type?: string) =>
      request(`/esport/teams${type ? `?type=${type}` : ''}`, { fallback: [], auth: false }),
    team: (id: string) => request(`/esport/teams/${id}`, { fallback: null, auth: false }),
    sponsors: () => request('/esport/sponsors', { fallback: [], auth: false }),
    mtl: () => request('/esport/mtl', { fallback: null, auth: false }),
    // Public target figures shown on the About page.
    figures: () => request('/esport/org/figures', { fallback: null, auth: false }),

    // Admin
    updateOrg: (id: string, data: any) =>
      request(`/esport/${id}`, { method: 'PATCH', body: data }),
    updateFigures: (data: any) =>
      request('/esport/org/figures', { method: 'PUT', body: data }),
    createTeam: (data: any) => request('/esport/teams', { method: 'POST', body: data }),
    updateTeam: (id: string, data: any) =>
      request(`/esport/teams/${id}`, { method: 'PATCH', body: data }),
    deleteTeam: (id: string) =>
      request(`/esport/teams/${id}`, { method: 'DELETE' }),
    transform: (id: string) =>
      request(`/esport/teams/${id}/transform`, { method: 'PATCH' }),
    addMember: (teamId: string, data: any) =>
      request(`/esport/teams/${teamId}/members`, { method: 'POST', body: data }),
    updateMember: (teamId: string, userId: string, data: any) =>
      request(`/esport/teams/${teamId}/members/${userId}`, { method: 'PATCH', body: data }),
    removeMember: (teamId: string, userId: string) =>
      request(`/esport/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),
    setCaptain: (teamId: string, userId: string) =>
      request(`/esport/teams/${teamId}/captain`, { method: 'PATCH', body: { userId } }),
    createSponsor: (data: any) =>
      request('/esport/sponsors', { method: 'POST', body: data }),
    updateSponsor: (id: string, data: any) =>
      request(`/esport/sponsors/${id}`, { method: 'PATCH', body: data }),
    deleteSponsor: (id: string) =>
      request(`/esport/sponsors/${id}`, { method: 'DELETE' }),

    // Seasons (lifecycle: upcoming -> active -> playoffs -> closed)
    seasons: (status?: string) =>
      request(`/esport/seasons${status ? `?status=${encodeURIComponent(status)}` : ''}`, {
        fallback: [],
        auth: false,
      }),
    currentSeason: () => request('/esport/seasons/current', { fallback: null, auth: false }),
    season: (idOrSlug: string) =>
      request(`/esport/seasons/${encodeURIComponent(idOrSlug)}`, { fallback: null, auth: false }),
    createSeason: (data: any) => request('/esport/seasons', { method: 'POST', body: data }),
    updateSeason: (id: string, data: any) =>
      request(`/esport/seasons/${id}`, { method: 'PATCH', body: data }),
    deleteSeason: (id: string) =>
      request(`/esport/seasons/${id}`, { method: 'DELETE' }),
    activateSeason: (id: string) => request(`/esport/seasons/${id}/activate`, { method: 'POST' }),
    startSeasonPlayoffs: (id: string) =>
      request(`/esport/seasons/${id}/playoffs`, { method: 'POST' }),
    seasonSummaryPreview: (id: string) =>
      request(`/esport/seasons/${id}/summary-preview`, { fallback: null }),
    closeSeason: (id: string, force = false) =>
      request(`/esport/seasons/${id}/close`, { method: 'POST', body: { force } }),
    reopenSeason: (id: string) => request(`/esport/seasons/${id}/reopen`, { method: 'POST' }),

    // Matches
    matches: (
      params: {
        seasonId?: string;
        teamId?: string;
        status?: string;
        stage?: string;
        from?: string;
        to?: string;
      } = {},
    ) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null && v !== '').map(([k, v]) => [k, String(v)]),
      ).toString();
      return request(`/esport/matches${qs ? `?${qs}` : ''}`, { fallback: [], auth: false });
    },
    // Matches of a period grouped by day (calendar view).
    matchesCalendar: (
      params: { seasonId?: string; teamId?: string; stage?: string; from?: string; to?: string } = {},
    ) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null && v !== '').map(([k, v]) => [k, String(v)]),
      ).toString();
      return request(`/esport/matches/calendar${qs ? `?${qs}` : ''}`, {
        fallback: { from: null, to: null, total: 0, days: [], undated: [] },
        auth: false,
      });
    },
    // Full match sheet (teams, games, screenshots, links, MVP, player stats).
    match: (id: string) => request(`/esport/matches/${id}`, { fallback: null, auth: false }),
    // Match sheet details: format, games, screenshots, VOD / stream, MVP.
    setMatchDetails: (id: string, data: any) =>
      request(`/esport/matches/${id}/details`, { method: 'PATCH', body: data }),
    teamMatches: (teamId: string) =>
      request(`/esport/teams/${teamId}/matches`, { fallback: [], auth: false }),

    // Team details (stats / history / schedule / staff / honours)
    teamStats: (teamId: string) =>
      request(`/esport/teams/${teamId}/stats`, { fallback: null, auth: false }),
    teamHistory: (teamId: string, page = 1, limit = 10, seasonId?: string) =>
      request(
        `/esport/teams/${teamId}/history?page=${page}&limit=${limit}${
          seasonId ? `&seasonId=${encodeURIComponent(seasonId)}` : ''
        }`,
        { fallback: null, auth: false },
      ),
    teamSchedule: (teamId: string) =>
      request(`/esport/teams/${teamId}/schedule`, { fallback: [], auth: false }),
    teamStaff: (teamId: string) =>
      request(`/esport/teams/${teamId}/staff`, { fallback: [], auth: false }),
    teamHonours: (teamId: string) =>
      request(`/esport/teams/${teamId}/honours`, { fallback: [], auth: false }),
    addStaff: (teamId: string, data: any) =>
      request(`/esport/teams/${teamId}/staff`, { method: 'POST', body: data }),
    updateStaff: (teamId: string, staffId: string, data: any) =>
      request(`/esport/teams/${teamId}/staff/${staffId}`, { method: 'PATCH', body: data }),
    removeStaff: (teamId: string, staffId: string) =>
      request(`/esport/teams/${teamId}/staff/${staffId}`, { method: 'DELETE' }),
    setHonours: (teamId: string, honours: any[]) =>
      request(`/esport/teams/${teamId}/honours`, { method: 'PUT', body: { honours } }),
    createMatch: (data: any) => request('/esport/matches', { method: 'POST', body: data }),
    updateMatch: (id: string, data: any) =>
      request(`/esport/matches/${id}`, { method: 'PATCH', body: data }),
    setMatchResult: (id: string, data: any) =>
      request(`/esport/matches/${id}/result`, { method: 'PATCH', body: data }),
    deleteMatch: (id: string) =>
      request(`/esport/matches/${id}`, { method: 'DELETE' }),
    // Per-player stats of a match
    matchPlayers: (id: string) =>
      request(`/esport/matches/${id}/players`, {
        fallback: { matchId: id, teamA: [], teamB: [], players: [] },
        auth: false,
      }),
    setMatchPlayers: (id: string, players: any[]) =>
      request(`/esport/matches/${id}/players`, { method: 'PUT', body: { players } }),
  },

  recruitment: {
    listOpen: (filters?: RecruitmentFilters) =>
      request(`/recruitment${qs(filters)}`, { fallback: [], auth: false }),
    meta: () =>
      request('/recruitment/meta', {
        fallback: { availability: [], statuses: [], transitions: {} },
        auth: false,
      }),
    mine: (filters?: ApplicationFilters) =>
      request(`/recruitment/mine${qs(filters)}`, { fallback: [] }),
    byTeam: (teamId: string, filters?: ApplicationFilters) =>
      request(`/recruitment/team/${teamId}${qs(filters)}`, { fallback: [] }),
    teamApplications: (teamId: string, filters?: ApplicationFilters) =>
      request(`/recruitment/team/${teamId}/applications${qs(filters)}`, { fallback: [] }),
    create: (data: any) => request('/recruitment', { method: 'POST', body: data }),
    update: (id: string, data: any) =>
      request(`/recruitment/${id}`, { method: 'PATCH', body: data }),
    remove: (id: string) => request(`/recruitment/${id}`, { method: 'DELETE' }),
    apply: (id: string, data: { role?: string; message?: string; availability?: string }) =>
      request(`/recruitment/${id}/apply`, { method: 'POST', body: data }),
    decide: (appId: string, status: RecruitmentApplicationStatus, note?: string) =>
      request(`/recruitment/applications/${appId}`, {
        method: 'PATCH',
        body: note ? { status, note } : { status },
      }),
    withdraw: (appId: string) =>
      request(`/recruitment/applications/${appId}`, {
        method: 'PATCH',
        body: { status: 'withdrawn' },
      }),
  },

  friends: {
    list: () => request('/friends', { fallback: [] }),
    requests: () => request('/friends/requests', { fallback: [] }),
    status: (userId: string) =>
      request(`/friends/status/${userId}`, { fallback: { status: 'none' } }),
    request: (userId: string) => request(`/friends/${userId}`, { method: 'POST' }),
    accept: (userId: string) => request(`/friends/${userId}/accept`, { method: 'POST' }),
    remove: (userId: string) => request(`/friends/${userId}`, { method: 'DELETE' }),
  },

  gamification: {
    me: () => request('/gamification/me', { fallback: null }),
    user: (id: string) => request(`/gamification/users/${id}`, { fallback: null, auth: false }),
    leaderboard: (limit = 10) =>
      request(`/gamification/leaderboard?limit=${limit}`, {
        fallback: { entries: [], total: 0 },
        auth: false,
      }),
  },

  // Avatar frames and titles (#124). Admin routes require `admin.rewards`.
  rewards: {
    catalog: () => request('/rewards/catalog', { fallback: { frames: [], titles: [] }, auth: false }),
    collection: () => request('/rewards/me/collection', { fresh: true }),
    equipFrame: (frameId: string | null, variant?: string | null) =>
      request('/rewards/me/frame', { method: 'POST', body: { frameId, ...(variant ? { variant } : {}) } }),
    equipTitle: (titleId: string | null) => request('/rewards/me/title', { method: 'POST', body: { titleId } }),
    admin: {
      timeline: () => request('/rewards/admin/timeline', { fresh: true }),
      frames: () => request('/rewards/admin/frames', { fresh: true }),
      temporary: () => request('/rewards/admin/temporary', { fresh: true }),
      userCollection: (userId: string) =>
        request(`/rewards/admin/users/${encodeURIComponent(userId)}/collection`, { fresh: true }),
      grant: (data: { userId: string; frameId: string; variant?: string; days?: number }) =>
        request('/rewards/admin/frames/grant', { method: 'POST', body: data }),
      end: (data: { userId: string; frameId: string; variant?: string }) =>
        request('/rewards/admin/frames/end', { method: 'POST', body: data }),
      xpCorrection: (data: { userId: string; amount: number; reason: string }) =>
        request('/rewards/admin/xp-correction', { method: 'POST', body: data }),
      tournamentResults: (tournamentId?: string) =>
        request(
          `/rewards/admin/tournament-results${tournamentId ? `?tournamentId=${encodeURIComponent(tournamentId)}` : ''}`,
          { fresh: true },
        ),
      recordTournamentResult: (data: { tournamentId: string; kind: 'winner' | 'finalist' | 'mvp'; userIds: string[] }) =>
        request('/rewards/admin/tournament-results', { method: 'POST', body: data }),
      setWeeklyMvp: (data: { userId: string; week?: string }) =>
        request('/rewards/admin/mvp-week', { method: 'POST', body: data }),
      recalculate: (userId: string) => request('/rewards/admin/recalculate', { method: 'POST', body: { userId } }),
    },
  },

  // Sponsoring (issue #52): public page data, partnership form, admin offers / inbox.
  sponsors: {
    // Active sponsors of a season (id, slug or 'current'), tiered.
    list: (seasonId?: string) =>
      request(`/sponsors${seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : ''}`, {
        fallback: { season: null, tiers: [], items: [], byTier: {} },
        auth: false,
      }),
    offers: () => request('/sponsors/offers', { fallback: [], auth: false }),
    faq: (lang: string) =>
      request(`/sponsors/faq?lang=${encodeURIComponent(lang)}`, { fallback: { lang, items: [] }, auth: false }),
    sendRequest: (data: {
      company: string;
      contactName: string;
      email: string;
      phone?: string;
      message: string;
      offerId?: string;
    }) => request('/sponsors/requests', { method: 'POST', body: data, auth: false }),
    // Admin
    all: () => request('/sponsors/all', { fallback: [] }),
    allOffers: () => request('/sponsors/offers/all', { fallback: [] }),
    createOffer: (data: any) => request('/sponsors/offers', { method: 'POST', body: data }),
    updateOffer: (id: string, data: any) => request(`/sponsors/offers/${id}`, { method: 'PATCH', body: data }),
    deleteOffer: (id: string) => request(`/sponsors/offers/${id}`, { method: 'DELETE' }),
    requests: (status?: string) =>
      request(`/sponsors/requests${status ? `?status=${encodeURIComponent(status)}` : ''}`, { fallback: [] }),
    updateRequest: (id: string, data: { status?: string; adminNote?: string }) =>
      request(`/sponsors/requests/${id}`, { method: 'PATCH', body: data }),
    deleteRequest: (id: string) => request(`/sponsors/requests/${id}`, { method: 'DELETE' }),
  },

  contact: {
    send: (data: { name: string; email: string; subject?: string; message: string }) =>
      request('/contact', { method: 'POST', body: data, auth: false }),
  },

  // Togo map (issue #70): static gazetteer + per-city counts.
  geo: {
    cities: () =>
      request('/geo/cities', { fallback: { regions: [], cities: [], other: { id: 'other', name: 'Autre' } }, auth: false }),
    map: (seasonId?: string | null) =>
      request(`/geo/map${qs({ seasonId })}`, { fallback: null, auth: false }),
  },

  notifications: {
    list: (params: NotificationsQuery = {}) => {
      const qs = new URLSearchParams();
      if (params.type) qs.set('type', params.type);
      if (params.status && params.status !== 'all') qs.set('status', params.status);
      if (params.page) qs.set('page', String(params.page));
      if (params.limit) qs.set('limit', String(params.limit));
      const suffix = qs.toString() ? `?${qs}` : '';
      return request<NotificationPage>(`/notifications${suffix}`, {
        fallback: {
          items: [],
          total: 0,
          unread: 0,
          counts: {},
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          pages: 1,
        },
      });
    },
    unreadCount: () => request('/notifications/unread-count', { fallback: { count: 0 } }),
    markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    /** Without a type, clears the whole mailbox; with one, only that category. */
    markAllRead: (type?: string) =>
      request(`/notifications/read-all${type ? `?type=${encodeURIComponent(type)}` : ''}`, {
        method: 'PATCH',
      }),
  },

  teamRequests: {
    create: (data: { proposedName: string; tag?: string; message?: string }) =>
      request('/team-requests', { method: 'POST', body: data }),
    mine: () => request('/team-requests/mine', { fallback: [] }),
    get: (id: string) => request(`/team-requests/${id}`, { fallback: null }),
    list: (status?: string) =>
      request(`/team-requests${status ? `?status=${status}` : ''}`, { fallback: [] }),
    setStatus: (id: string, status: string) =>
      request(`/team-requests/${id}/status`, { method: 'PATCH', body: { status } }),
  },

  messages: {
    startThread: (data: { userId: string; subject?: string; requestId?: string; body: string }) =>
      request('/messages/threads', { method: 'POST', body: data }),
    threads: () => request('/messages/threads', { fallback: [] }),
    thread: (id: string) => request(`/messages/threads/${id}`, { fallback: null }),
    reply: (id: string, body: string) =>
      request(`/messages/threads/${id}`, { method: 'POST', body: { body } }),
    markRead: (id: string) =>
      request(`/messages/threads/${id}/read`, { method: 'POST' }),
    // Unread badges: direct threads + group rooms.
    unread: () => request('/messages/unread', { fallback: { direct: 0, rooms: 0, total: 0 } }),
    // Group rooms (esport team / tournament / draft team), membership derived server-side.
    rooms: () => request('/messages/rooms', { fallback: [] }),
    room: (kind: string, scopeId: string, params?: { before?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.before) q.set('before', params.before);
      if (params?.limit) q.set('limit', String(params.limit));
      const qs = q.toString();
      return request(`/messages/rooms/${kind}/${scopeId}${qs ? `?${qs}` : ''}`, { fallback: null });
    },
    postRoom: (kind: string, scopeId: string, body: string) =>
      request(`/messages/rooms/${kind}/${scopeId}`, { method: 'POST', body: { body } }),
    markRoomRead: (kind: string, scopeId: string) =>
      request(`/messages/rooms/${kind}/${scopeId}/read`, { method: 'POST' }),
  },

  push: {
    publicKey: () => request('/push/public-key', { auth: false }),
    subscribe: (sub: any) => request('/push/subscribe', { method: 'POST', body: sub }),
    unsubscribe: (endpoint: string) =>
      request('/push/unsubscribe', { method: 'POST', body: { endpoint } }),
  },

  stream: {
    // Public: the YouTube channel + Season 1 video list, set by the admin.
    config: () =>
      request('/stream/config', {
        fallback: {
          youtubeChannel: 'eternumesports',
          channelId: '',
          channelTitle: '',
          channelAvatar: '',
          channelBanner: '',
          liveTitle: '',
          liveDesc: '',
          s1MainVideoId: '',
          videos: [],
        },
        auth: false,
      }),
    live: () =>
      request('/stream/live', {
        fallback: { live: false, videoId: null, title: null },
        auth: false,
      }),
    views: (videoIds: string) =>
      request(`/stream/views?videoIds=${encodeURIComponent(videoIds)}`, {
        fallback: { views: {} },
        auth: false,
      }),
    updateConfig: (data: any) =>
      request('/stream/config', { method: 'PATCH', body: data }),
    refresh: () => request('/stream/refresh', { method: 'POST' }),
    // Seasons (created in the esport module) with their attached videos.
    seasons: () => request('/stream/seasons', { fallback: [], auth: false }),
    seasonVideos: (seasonId: string) =>
      request(`/stream/seasons/${seasonId}/videos`, { fallback: [] }),
    setSeasonVideos: (seasonId: string, videos: any[]) =>
      request(`/stream/seasons/${seasonId}/videos`, { method: 'PUT', body: { videos } }),
    // YouTube channel connection (OAuth) + live control (admin).
    youtube: {
      connect: () => request('/stream/youtube/connect'),
      status: () =>
        request('/stream/youtube/status', { fallback: { connected: false } }),
      disconnect: () => request('/stream/youtube/disconnect', { method: 'POST' }),
      videos: (pageToken?: string) =>
        request(
          `/stream/youtube/videos${pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : ''}`,
          { fallback: { videos: [], nextPageToken: null, total: 0 } },
        ),
    },
    livePanel: () =>
      request('/stream/live/panel', { fallback: { active: false } }),
    startLive: (data: any) =>
      request('/stream/live/start', { method: 'POST', body: data }),
    stopLive: () => request('/stream/live/stop', { method: 'POST' }),
  },

  // Player dashboard: every widget in one round trip (JWT).
  dashboard: {
    get: () =>
      request('/dashboard', {
        fallback: {
          generatedAt: null,
          quickStats: null,
          rank: { metric: 'winRate', position: null, total: 0, value: null, games: 0 },
          lastMatches: [],
          upcoming: [],
          notifications: { unread: 0, latest: [] },
          activity: [],
        },
      }),
  },

  // Draft Simulator (community tournaments 1v1 / 3v3 / 5v5).
  draft: {
    // Player
    list: () => request('/draft', { fallback: [] }),
    get: (id: string) => request(`/draft/${id}`, { fallback: null }),
    register: (id: string, preferredRole: string) =>
      request(`/draft/${id}/register`, { method: 'POST', body: { preferredRole } }),
    unregister: (id: string) => request(`/draft/${id}/register`, { method: 'DELETE' }),
    bracket: (id: string) =>
      request(`/draft/${id}/bracket`, { fallback: { teams: [], matches: [] } }),
    myTeam: (id: string) => request(`/draft/${id}/my-team`, { fallback: null }),
    // Admin
    admin: {
      list: () => request('/draft/admin', { fallback: [] }),
      create: (data: any) => request('/draft/admin', { method: 'POST', body: data }),
      update: (id: string, data: any) =>
        request(`/draft/admin/${id}`, { method: 'PATCH', body: data }),
      remove: (id: string) => request(`/draft/admin/${id}`, { method: 'DELETE' }),
      open: (id: string) => request(`/draft/admin/${id}/open`, { method: 'POST' }),
      close: (id: string) => request(`/draft/admin/${id}/close`, { method: 'POST' }),
      registrations: (id: string) =>
        request(`/draft/admin/${id}/registrations`, { fallback: [] }),
      runDraft: (id: string) => request(`/draft/admin/${id}/draft`, { method: 'POST' }),
      secondPhase: (id: string, closesAt?: string) =>
        request(`/draft/admin/${id}/second-phase`, { method: 'POST', body: { closesAt } }),
      publish: (id: string) => request(`/draft/admin/${id}/publish`, { method: 'POST' }),
      eliminate: (id: string, teamId: string) =>
        request(`/draft/admin/${id}/teams/${teamId}/eliminate`, { method: 'POST' }),
      setWinner: (id: string, matchId: string, winnerTeamId: string) =>
        request(`/draft/admin/${id}/matches/${matchId}/winner`, {
          method: 'POST',
          body: { winnerTeamId },
        }),
    },
  },

  pickban: {
    heroes: () => request('/pickban/heroes', { fallback: [], auth: false }),
    suggest: (state: any) => request('/pickban/suggest', { method: 'POST', body: state, auth: false }),
    getByCode: (code: string) => request(`/pickban/share/${code}`, { auth: false }),
    list: () => request('/pickban', { fallback: [] }),
    get: (id: string) => request(`/pickban/${id}`),
    create: (data: { name?: string; mode?: 'ranked' | 'tournament' }) =>
      request('/pickban', { method: 'POST', body: data }),
    step: (id: string, data: { action: string; team: string; heroId: string; lane?: string }) =>
      request(`/pickban/${id}/step`, { method: 'PATCH', body: data }),
    undo: (id: string) => request(`/pickban/${id}/undo`, { method: 'PATCH' }),
    reset: (id: string) => request(`/pickban/${id}/reset`, { method: 'PATCH' }),
    remove: (id: string) => request(`/pickban/${id}`, { method: 'DELETE' }),
  },

  // League statistics (teams / players / meta / records), public.
  // `seasonId` accepts a season id, 'current' or 'all'.
  leagueStats: {
    teams: (seasonId: string) =>
      request(`/league-stats/teams?seasonId=${encodeURIComponent(seasonId)}`, { fallback: null, auth: false }),
    players: (params: { seasonId: string; role?: string; sort?: string; limit?: number }) => {
      const q = new URLSearchParams({ seasonId: params.seasonId });
      if (params.role) q.set('role', params.role);
      if (params.sort) q.set('sort', params.sort);
      if (params.limit) q.set('limit', String(params.limit));
      return request(`/league-stats/players?${q.toString()}`, { fallback: null, auth: false });
    },
    meta: (seasonId: string, limit = 10) =>
      request(`/league-stats/meta?seasonId=${encodeURIComponent(seasonId)}&limit=${limit}`, {
        fallback: null,
        auth: false,
      }),
    records: (seasonId: string, period: 'week' | 'season') =>
      request(`/league-stats/records?seasonId=${encodeURIComponent(seasonId)}&period=${period}`, {
        fallback: null,
        auth: false,
      }),
  },
  awards: {
    /** Awards + regular / playoffs podiums + sponsors of a season (id or slug). */
    season: (idOrSlug: string) =>
      request(`/awards/seasons/${encodeURIComponent(idOrSlug)}`, { fallback: null, auth: false }),
    hallOfFame: () => request('/awards/hall-of-fame', { fallback: { seasons: [] }, auth: false }),
    suggest: (seasonId: string, minGames?: number) =>
      request(`/awards/seasons/${encodeURIComponent(seasonId)}/suggest`, {
        method: 'POST',
        body: minGames ? { minGames } : {},
      }),
    create: (seasonId: string, data: any) =>
      request(`/awards/seasons/${encodeURIComponent(seasonId)}`, { method: 'POST', body: data }),
    update: (awardId: string, data: any) => request(`/awards/${awardId}`, { method: 'PATCH', body: data }),
    remove: (awardId: string) => request(`/awards/${awardId}`, { method: 'DELETE' }),
    setPodium: (
      seasonId: string,
      data: {
        regular?: { placement: number; teamId: string }[] | null;
        playoffs?: { placement: number; teamId: string }[] | null;
        derivePlayoffs?: 'matches' | 'tournament';
        tournamentId?: string;
      },
    ) => request(`/awards/seasons/${encodeURIComponent(seasonId)}/podium`, { method: 'PUT', body: data }),
  },
  ai: {
    status: (): Promise<{ enabled: boolean; model: string; mode: 'llm' | 'heuristic' }> =>
      request('/ai/status', { fallback: { enabled: false, model: 'unknown', mode: 'heuristic' }, auth: false }),
    coach: (lang: string) => request(`/ai/coach?lang=${lang}`, { method: 'POST' }),
    recommendHeroes: (params: { role?: string; lane?: string }, lang: string) =>
      request(`/ai/recommend/heroes?lang=${lang}`, { method: 'POST', body: params }),
    recommendBuild: (heroId: string, lang: string) =>
      request(`/ai/recommend/build?lang=${lang}`, { method: 'POST', body: { heroId } }),
    counterPicks: (heroIds: string[], lang: string) =>
      request(`/ai/counter?lang=${lang}`, { method: 'POST', body: { heroIds } }),
    analyze: (lang: string) => request(`/ai/analyze?lang=${lang}`, { method: 'POST' }),
  },
};

export default api;
