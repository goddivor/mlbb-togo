// Client API central — point de contact unique avec le backend NestJS.
// Stratégie de résilience : si le backend est injoignable (réseau), on retombe
// sur les données de démonstration (mockData) afin que l'UI reste utilisable.

import {
  mockPlayers,
  mockTeams,
  mockPosts,
  mockTournaments,
  mockEvents,
  mockMatches,
  mockNotifications,
  mockAdminLogs,
  mockFormTemplates,
  mockFormResponses,
} from './mockData';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006/api';

const TOKEN_KEY = 'mlbb-token';

/**
 * Route une image du CDN Moonton via notre proxy backend (fiabilise le chargement :
 * pas de hotlink/referer, retry et cache côté serveur).
 */
export const mlbbImg = (url?: string | null, width?: number): string =>
  url
    ? `${API_URL}/mlbb/image?url=${encodeURIComponent(url)}${width ? `&w=${width}` : ''}`
    : '';

/**
 * Source d'avatar fiable : les images du CDN de jeu (youngjoygame) passent par
 * le proxy (protection hotlink), les autres (Google...) sont chargées directement.
 */
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
  /** Valeur de repli renvoyée si l'appel réseau échoue (backend hors-ligne). */
  fallback?: any;
  /** Authentification requise (ajoute le Bearer token). */
  auth?: boolean;
}

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, fallback, auth = true } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

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
        /* ignore */
      }
      throw new ApiError(message, res.status);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    // Si un repli est fourni, on l'utilise pour TOUTE erreur (réseau OU HTTP),
    // afin que les sections en lecture seule ne cassent jamais la page.
    if (fallback !== undefined) {
      // eslint-disable-next-line no-console
      console.warn(`[api] échec sur ${path}, repli.`);
      return fallback as T;
    }
    throw err;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Recherche dans une liste mock par id (repli pour les routes /:id)
const findMock = (list: any[], id: string) => list.find((x) => x.id === id);

export const api = {
  // === Authentification ===
  auth: {
    register: (data: any) =>
      request('/auth/register', { method: 'POST', body: data, auth: false }),
    login: (data: { email: string; password: string }) =>
      request('/auth/login', { method: 'POST', body: data, auth: false }),
    me: () => request('/auth/me'),
    changePassword: (data: { email: string; currentPassword: string; newPassword: string }) =>
      request('/auth/change-password', { method: 'POST', body: data, auth: false }),
    // Connexion MLBB par code de vérification (envoyé dans le courrier en jeu).
    mlbbSendVc: (data: { roleId: number; zoneId: number }) =>
      request('/auth/mlbb/send-vc', { method: 'POST', body: data, auth: false }),
    mlbbLogin: (data: { roleId: number; zoneId: number; vc: number }) =>
      request('/auth/mlbb/login', { method: 'POST', body: data, auth: false }),
    // Connexion Google (access token Google Identity Services).
    google: (data: { accessToken: string }) =>
      request('/auth/google', { method: 'POST', body: data, auth: false }),
    // Liaison d'un second profil au compte connecté.
    linkMlbb: (data: { roleId: number; zoneId: number; vc: number }) =>
      request('/auth/link/mlbb', { method: 'POST', body: data }),
    linkGoogle: (data: { accessToken: string }) =>
      request('/auth/link/google', { method: 'POST', body: data }),
    // Choix de la source du profil affiché (google | game).
    setProfileSource: (source: 'google' | 'game') =>
      request('/auth/profile-source', { method: 'PATCH', body: { source } }),
    // Resynchronise les données de jeu.
    syncGame: () => request('/auth/sync-game', { method: 'POST' }),
    // Héros favoris pour une saison donnée (sélecteur de saison).
    gameHeroes: (sid: number) => request(`/auth/game/heroes?sid=${sid}`),
  },

  // === Joueurs / Utilisateurs ===
  users: {
    list: () => request('/users', { fallback: mockPlayers, auth: false }),
    leaderboard: () =>
      request('/users/leaderboard', {
        fallback: [...mockPlayers].sort((a, b) => b.winRate - a.winRate),
        auth: false,
      }),
    get: (id: string) => request(`/users/${id}`, { fallback: findMock(mockPlayers, id), auth: false }),
    update: (id: string, data: any) => request(`/users/${id}`, { method: 'PATCH', body: data }),
    remove: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
    setBan: (id: string, isBanned: boolean) =>
      request(`/users/${id}/ban`, { method: 'PATCH', body: { isBanned } }),
    setRole: (id: string, roleUser: string) =>
      request(`/users/${id}/role`, { method: 'PATCH', body: { roleUser } }),
  },

  // === Équipes ===
  teams: {
    list: () => request('/teams', { fallback: mockTeams, auth: false }),
    get: (id: string) => request(`/teams/${id}`, { fallback: findMock(mockTeams, id), auth: false }),
    create: (data: any) => request('/teams', { method: 'POST', body: data }),
    update: (id: string, data: any) => request(`/teams/${id}`, { method: 'PATCH', body: data }),
    remove: (id: string) => request(`/teams/${id}`, { method: 'DELETE' }),
  },

  // === Forum (posts) ===
  posts: {
    list: (category?: string) =>
      request(`/posts${category ? `?category=${category}` : ''}`, {
        fallback: mockPosts,
        auth: false,
      }),
    get: (id: string) => request(`/posts/${id}`, { fallback: findMock(mockPosts, id), auth: false }),
    create: (data: any) => request('/posts', { method: 'POST', body: data }),
    remove: (id: string) => request(`/posts/${id}`, { method: 'DELETE' }),
    like: (id: string) => request(`/posts/${id}/like`, { method: 'POST', auth: false }),
    comment: (id: string, data: any) =>
      request(`/posts/${id}/comments`, { method: 'POST', body: data }),
  },

  // === Tournois ===
  tournaments: {
    list: () => request('/tournaments', { fallback: mockTournaments, auth: false }),
    get: (id: string) =>
      request(`/tournaments/${id}`, { fallback: findMock(mockTournaments, id), auth: false }),
    create: (data: any) => request('/tournaments', { method: 'POST', body: data }),
    update: (id: string, data: any) =>
      request(`/tournaments/${id}`, { method: 'PATCH', body: data }),
    remove: (id: string) => request(`/tournaments/${id}`, { method: 'DELETE' }),
  },

  // === Événements ===
  events: {
    list: () => request('/events', { fallback: mockEvents, auth: false }),
    get: (id: string) => request(`/events/${id}`, { fallback: findMock(mockEvents, id), auth: false }),
    create: (data: any) => request('/events', { method: 'POST', body: data }),
    remove: (id: string) => request(`/events/${id}`, { method: 'DELETE' }),
  },

  // === Matchs ===
  matches: {
    list: () => request('/matches', { fallback: mockMatches, auth: false }),
    get: (id: string) => request(`/matches/${id}`, { fallback: findMock(mockMatches, id), auth: false }),
    create: (data: any) => request('/matches', { method: 'POST', body: data }),
  },

  // === Héros ===
  heroes: {
    list: (role?: string) =>
      request(`/heroes${role ? `?role=${role}` : ''}`, { fallback: [], auth: false }),
    get: (id: string) => request(`/heroes/${id}`, { auth: false }),
  },

  // === Administration ===
  admin: {
    stats: () =>
      request('/admin/stats', {
        fallback: {
          totalUsers: 8, totalTeams: 3, totalTournaments: 3, totalPosts: 4,
          activeUsers: 5, totalMatches: 3, onlineNow: 4, newUsersToday: 2,
        },
        auth: false,
      }),
    logs: () => request('/admin/logs', { fallback: mockAdminLogs, auth: false }),
    addLog: (data: any) => request('/admin/logs', { method: 'POST', body: data }),
    forms: {
      list: () => request('/admin/forms', { fallback: mockFormTemplates, auth: false }),
      get: (id: string) =>
        request(`/admin/forms/${id}`, { fallback: findMock(mockFormTemplates, id), auth: false }),
      create: (data: any) => request('/admin/forms', { method: 'POST', body: data }),
      update: (id: string, data: any) =>
        request(`/admin/forms/${id}`, { method: 'PATCH', body: data }),
      remove: (id: string) => request(`/admin/forms/${id}`, { method: 'DELETE' }),
      responses: (id: string) =>
        request(`/admin/forms/${id}/responses`, {
          fallback: mockFormResponses.filter((r) => r.formId === id),
          auth: false,
        }),
      submit: (id: string, data: any) =>
        request(`/admin/forms/${id}/responses`, { method: 'POST', body: { data }, auth: false }),
    },
  },

  // === Données officielles Mobile Legends (proxy Moonton GMS) ===
  mlbb: {
    // Galerie / liste des héros officiels. limit optionnel.
    heroes: (limit?: number) =>
      request(`/mlbb/heroes${limit ? `?limit=${limit}` : ''}`, { fallback: { total: 0, heroes: [] }, auth: false }),
    // Les N héros les plus récents (défaut 6, comme la page d'accueil officielle).
    latest: (count = 6) =>
      request(`/mlbb/heroes/latest?count=${count}`, { fallback: [], auth: false }),
    // Vitrine riche des N derniers héros (carrousel d'accueil).
    showcase: (count = 6) =>
      request(`/mlbb/heroes/showcase?count=${count}`, { fallback: [], auth: false }),
    // Détail complet d'un héros (compétences, skins, lore) par hero_id.
    hero: (id: number | string) =>
      request(`/mlbb/heroes/${id}`, { auth: false }),
    // Classement méta des héros (win/pick/ban + synergies). sort: winRate|pickRate|banRate
    ranking: (params: { limit?: number; sort?: string; rank?: string; matchType?: number } = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
      ).toString();
      return request(`/mlbb/ranking${qs ? `?${qs}` : ''}`, { fallback: { total: 0, ranking: [] }, auth: false });
    },
  },

  // === E-sport (ETERNUM ESPORTS, équipes, sponsors) ===
  esport: {
    org: () => request('/esport', { fallback: null, auth: false }),
    teams: () => request('/esport/teams', { fallback: [], auth: false }),
    sponsors: () => request('/esport/sponsors', { fallback: [], auth: false }),
    mtl: () => request('/esport/mtl', { fallback: null, auth: false }),
  },

  // === Contact ===
  contact: {
    send: (data: { name: string; email: string; subject?: string; message: string }) =>
      request('/contact', { method: 'POST', body: data, auth: false }),
  },

  // === Notifications ===
  notifications: {
    list: () => request('/notifications', { fallback: mockNotifications, auth: false }),
  },
};

export default api;
