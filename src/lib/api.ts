
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
  const { method = 'GET', body, fallback, auth = true } = options;
  const isGet = method === 'GET';
  const token = getToken();

  // A write may make the read cache stale.
  if (!isGet) getCache.clear();

  const key = `${path}|${auth && token ? 'a' : 'g'}`;

  if (isGet) {
    const cached = getCache.get(key);
    if (cached && Date.now() - cached.at < GET_TTL) return cached.data as T;
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
        try {
          const data = await res.json();
          message = data.message || message;
        } catch {
          //
        }
        throw new ApiError(message, res.status);
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

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const api = {

  auth: {
    me: () => request('/auth/me'),

    changePassword: (data: { email: string; currentPassword: string; newPassword: string }) =>
      request('/auth/change-password', { method: 'POST', body: data, auth: false }),

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
    leaderboard: () => request('/users/leaderboard', { fallback: [], auth: false }),
    get: (id: string) => request(`/users/${id}`, { fallback: null, auth: false }),
    update: (id: string, data: any) => request(`/users/${id}`, { method: 'PATCH', body: data }),
    remove: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
    deleteSelf: () => request('/users/me', { method: 'DELETE' }),
    setBan: (id: string, isBanned: boolean) =>
      request(`/users/${id}/ban`, { method: 'PATCH', body: { isBanned } }),
    setRole: (id: string, roleUser: string) =>
      request(`/users/${id}/role`, { method: 'PATCH', body: { roleUser } }),
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
    like: (id: string) => request(`/posts/${id}/like`, { method: 'POST', auth: false }),
    comment: (id: string, data: any) =>
      request(`/posts/${id}/comments`, { method: 'POST', body: data }),
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

  heroes: {
    list: (role?: string) =>
      request(`/heroes${role ? `?role=${role}` : ''}`, { fallback: [], auth: false }),
    get: (id: string) => request(`/heroes/${id}`, { auth: false }),
    // Admin: resync heroes from MLBB, returns { updated }.
    refresh: (): Promise<{ updated: number }> =>
      request('/heroes/refresh', { method: 'POST' }),
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
        `{ sponsors { id name logo url sort } }`,
      ).then((d) => d.sponsors),
    lanes: () =>
      gql<{ lanes: any[] }>(
        `{ lanes { id key name shortName description icon color compatibleClasses sort } }`,
      ).then((d) => d.lanes),
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

  esport: {
    org: () => request('/esport', { fallback: null, auth: false }),
    teams: (type?: string) =>
      request(`/esport/teams${type ? `?type=${type}` : ''}`, { fallback: [], auth: false }),
    team: (id: string) => request(`/esport/teams/${id}`, { fallback: null, auth: false }),
    sponsors: () => request('/esport/sponsors', { fallback: [], auth: false }),
    mtl: () => request('/esport/mtl', { fallback: null, auth: false }),

    // Admin
    updateOrg: (id: string, data: any) =>
      request(`/esport/${id}`, { method: 'PATCH', body: data }),
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

    // Seasons
    seasons: () => request('/esport/seasons', { fallback: [], auth: false }),
    createSeason: (data: any) => request('/esport/seasons', { method: 'POST', body: data }),
    updateSeason: (id: string, data: any) =>
      request(`/esport/seasons/${id}`, { method: 'PATCH', body: data }),
    deleteSeason: (id: string) =>
      request(`/esport/seasons/${id}`, { method: 'DELETE' }),

    // Matches
    matches: (params: { seasonId?: string; teamId?: string; status?: string } = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null && v !== '').map(([k, v]) => [k, String(v)]),
      ).toString();
      return request(`/esport/matches${qs ? `?${qs}` : ''}`, { fallback: [], auth: false });
    },
    teamMatches: (teamId: string) =>
      request(`/esport/teams/${teamId}/matches`, { fallback: [], auth: false }),
    createMatch: (data: any) => request('/esport/matches', { method: 'POST', body: data }),
    updateMatch: (id: string, data: any) =>
      request(`/esport/matches/${id}`, { method: 'PATCH', body: data }),
    setMatchResult: (id: string, data: any) =>
      request(`/esport/matches/${id}/result`, { method: 'PATCH', body: data }),
    deleteMatch: (id: string) =>
      request(`/esport/matches/${id}`, { method: 'DELETE' }),
  },

  recruitment: {
    listOpen: (role?: string) =>
      request(`/recruitment${role ? `?role=${role}` : ''}`, { fallback: [], auth: false }),
    mine: () => request('/recruitment/mine', { fallback: [] }),
    byTeam: (teamId: string) => request(`/recruitment/team/${teamId}`, { fallback: [] }),
    create: (data: any) => request('/recruitment', { method: 'POST', body: data }),
    update: (id: string, data: any) =>
      request(`/recruitment/${id}`, { method: 'PATCH', body: data }),
    remove: (id: string) => request(`/recruitment/${id}`, { method: 'DELETE' }),
    apply: (id: string, data: { role?: string; message?: string }) =>
      request(`/recruitment/${id}/apply`, { method: 'POST', body: data }),
    decide: (appId: string, status: 'accepted' | 'rejected') =>
      request(`/recruitment/applications/${appId}`, { method: 'PATCH', body: { status } }),
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

  contact: {
    send: (data: { name: string; email: string; subject?: string; message: string }) =>
      request('/contact', { method: 'POST', body: data, auth: false }),
  },

  notifications: {
    list: () => request('/notifications', { fallback: [] }),
    unreadCount: () => request('/notifications/unread-count', { fallback: { count: 0 } }),
    markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
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
  },

  push: {
    publicKey: () => request('/push/public-key', { auth: false }),
    subscribe: (sub: any) => request('/push/subscribe', { method: 'POST', body: sub }),
    unsubscribe: (endpoint: string) =>
      request('/push/unsubscribe', { method: 'POST', body: { endpoint } }),
  },
};

export default api;
