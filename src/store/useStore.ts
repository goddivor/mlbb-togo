import { create } from 'zustand';

export const useAuthStore = create<any>((set) => ({
  user: null,
  userProfile: null,
  loading: true,
  setUser: (user: any) => set({ user, loading: false }),
  setUserProfile: (userProfile: any) => set({ userProfile }),
  setLoading: (loading: boolean) => set({ loading }),
  logout: () => set({ user: null, userProfile: null, loading: false }),
}));

export const useLangStore = create<any>((set) => ({
  lang: 'fr',
  setLang: (lang: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('mlbb-lang', lang);
    set({ lang });
  },
}));

export const useThemeStore = create<any>((set) => ({
  theme:
    typeof window !== 'undefined'
      ? localStorage.getItem('mlbb-theme') || 'light'
      : 'light',
  toggleTheme: () =>
    set((state: any) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      const patch: any = { theme: newTheme };
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlbb-theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        // Alternate palettes are dark-only: switching to light resets to default.
        if (newTheme === 'light') {
          localStorage.setItem('mlbb-palette', 'default');
          document.documentElement.classList.remove('theme-neon', 'theme-gold', 'theme-night');
          patch.palette = 'default';
        }
      }
      return patch;
    }),
  setTheme: (theme: string) =>
    set(() => {
      const patch: any = { theme };
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlbb-theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
        if (theme === 'light') {
          localStorage.setItem('mlbb-palette', 'default');
          document.documentElement.classList.remove('theme-neon', 'theme-gold', 'theme-night');
          patch.palette = 'default';
        }
      }
      return patch;
    }),

  // Additive color palette: 'default' keeps the current theme untouched;
  // 'neon' | 'gold' | 'night' re-skin the app (dark aesthetics).
  palette:
    typeof window !== 'undefined'
      ? localStorage.getItem('mlbb-palette') || 'default'
      : 'default',
  setPalette: (palette: string) =>
    set((state: any) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlbb-palette', palette);
        const el = document.documentElement;
        el.classList.remove('theme-neon', 'theme-gold', 'theme-night');
        if (palette !== 'default') {
          el.classList.add('theme-' + palette);
          el.classList.add('dark');
          localStorage.setItem('mlbb-theme', 'dark');
        }
      }
      return palette !== 'default' && state.theme !== 'dark'
        ? { palette, theme: 'dark' }
        : { palette };
    }),
}));

export const useAppStore = create<any>((set) => ({
  sidebarOpen: false,
  notifications: [],
  unreadCount: 0,
  maintenanceMode: false,
  toggleSidebar: () => set((state: any) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  addNotification: (notification: any) =>
    set((state: any) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  setNotifications: (notifications: any[]) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),
  markAsRead: (id: string) =>
    set((state: any) => ({
      notifications: state.notifications.map((n: any) =>
        n.id === id ? { ...n, read: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
  toggleMaintenance: () =>
    set((state: any) => ({ maintenanceMode: !state.maintenanceMode })),
  setMaintenance: (mode: boolean) => set({ maintenanceMode: mode }),
}));

export const usePlayerStore = create<any>((set) => ({
  players: [],
  currentPlayer: null,
  leaderboard: [],
  setPlayers: (players: any[]) => set({ players }),
  setCurrentPlayer: (player: any) => set({ currentPlayer: player }),
  setLeaderboard: (leaderboard: any[]) => set({ leaderboard }),
  updatePlayer: (id: string, data: any) =>
    set((state: any) => ({
      players: state.players.map((p: any) => (p.id === id ? { ...p, ...data } : p)),
    })),
  deletePlayer: (id: string) =>
    set((state: any) => ({
      players: state.players.filter((p: any) => p.id !== id),
    })),
}));

export const useTeamStore = create<any>((set) => ({
  teams: [],
  currentTeam: null,
  teamChat: [],
  setTeams: (teams: any[]) => set({ teams }),
  setCurrentTeam: (team: any) => set({ currentTeam: team }),
  addTeam: (team: any) => set((state: any) => ({ teams: [...state.teams, team] })),
  deleteTeam: (id: string) =>
    set((state: any) => ({ teams: state.teams.filter((t: any) => t.id !== id) })),
  setTeamChat: (messages: any[]) => set({ teamChat: messages }),
  addChatMessage: (message: any) =>
    set((state: any) => ({ teamChat: [...state.teamChat, message] })),
}));

export const useForumStore = create<any>((set) => ({
  posts: [],
  currentPost: null,
  categories: [
    { id: 'strategies', name: 'Stratégies', icon: '⚔️', color: 'neon-blue' },
    { id: 'recruitment', name: 'Recrutement', icon: '📢', color: 'neon-purple' },
    { id: 'tournaments', name: 'Tournois', icon: '🏆', color: 'neon-gold' },
    { id: 'general', name: 'Général', icon: '💬', color: 'neon-pink' },
    { id: 'guides', name: 'Guides', icon: '📖', color: 'neon-green' },
    { id: 'off-topic', name: 'Hors-sujet', icon: '😄', color: 'gray' },
  ],
  setPosts: (posts: any[]) => set({ posts }),
  setCurrentPost: (post: any) => set({ currentPost: post }),
  addPost: (post: any) => set((state: any) => ({ posts: [post, ...state.posts] })),
  deletePost: (id: string) =>
    set((state: any) => ({ posts: state.posts.filter((p: any) => p.id !== id) })),
  likePost: (id: string) =>
    set((state: any) => ({
      posts: state.posts.map((p: any) =>
        p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p,
      ),
    })),
}));

export const useTournamentStore = create<any>((set) => ({
  tournaments: [],
  currentTournament: null,
  setTournaments: (tournaments: any[]) => set({ tournaments }),
  setCurrentTournament: (tournament: any) => set({ currentTournament: tournament }),
  addTournament: (tournament: any) =>
    set((state: any) => ({ tournaments: [...state.tournaments, tournament] })),
  deleteTournament: (id: string) =>
    set((state: any) => ({
      tournaments: state.tournaments.filter((t: any) => t.id !== id),
    })),
}));

export const useEventStore = create<any>((set) => ({
  events: [],
  selectedDate: new Date(),
  setEvents: (events: any[]) => set({ events }),
  setSelectedDate: (date: Date) => set({ selectedDate: date }),
  addEvent: (event: any) => set((state: any) => ({ events: [...state.events, event] })),
  deleteEvent: (id: string) =>
    set((state: any) => ({ events: state.events.filter((e: any) => e.id !== id) })),
}));

export const useMatchStore = create<any>((set) => ({
  matches: [],
  matchHistory: [],
  setMatches: (matches: any[]) => set({ matches }),
  setMatchHistory: (history: any[]) => set({ matchHistory: history }),
  addMatch: (match: any) => set((state: any) => ({ matches: [...state.matches, match] })),
}));

