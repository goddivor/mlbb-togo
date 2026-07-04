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
      if (typeof window !== 'undefined') {
        localStorage.setItem('mlbb-theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
      return { theme: newTheme };
    }),
  setTheme: (theme: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mlbb-theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    set({ theme });
  },
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

export const useAdminStore = create<any>((set) => ({
  stats: {
    totalUsers: 8,
    totalTeams: 3,
    totalTournaments: 3,
    totalPosts: 4,
    activeUsers: 5,
    totalMatches: 3,
    onlineNow: 4,
    newUsersToday: 2,
  },
  adminLogs: [],
  formTemplates: [],
  formResponses: [],
  selectedUsers: [],

  setStats: (stats: any) => set({ stats }),
  updateStat: (key: string, value: any) =>
    set((state: any) => ({ stats: { ...state.stats, [key]: value } })),

  addAdminLog: (log: any) =>
    set((state: any) => ({
      adminLogs: [
        { id: 'log_' + Date.now(), timestamp: new Date().toISOString(), ...log },
        ...state.adminLogs,
      ],
    })),
  setAdminLogs: (logs: any[]) => set({ adminLogs: logs }),

  addFormTemplate: (template: any) =>
    set((state: any) => ({
      formTemplates: [
        ...state.formTemplates,
        { id: 'form_' + Date.now(), createdAt: new Date().toISOString(), ...template },
      ],
    })),
  updateFormTemplate: (id: string, data: any) =>
    set((state: any) => ({
      formTemplates: state.formTemplates.map((f: any) =>
        f.id === id ? { ...f, ...data } : f,
      ),
    })),
  deleteFormTemplate: (id: string) =>
    set((state: any) => ({
      formTemplates: state.formTemplates.filter((f: any) => f.id !== id),
    })),
  setFormTemplates: (templates: any[]) => set({ formTemplates: templates }),

  addFormResponse: (response: any) =>
    set((state: any) => ({
      formResponses: [
        ...state.formResponses,
        { id: 'resp_' + Date.now(), submittedAt: new Date().toISOString(), ...response },
      ],
    })),
  setFormResponses: (responses: any[]) => set({ formResponses: responses }),

  toggleUserSelection: (id: string) =>
    set((state: any) => ({
      selectedUsers: state.selectedUsers.includes(id)
        ? state.selectedUsers.filter((u: any) => u !== id)
        : [...state.selectedUsers, id],
    })),
  clearSelection: () => set({ selectedUsers: [] }),
}));
