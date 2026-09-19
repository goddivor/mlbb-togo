'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { api, getToken, API_URL } from '@/lib/api';

const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;
export const getSocket = (): Socket | null => socket;

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  usePresence.getState().reset();
  useChatUnread.getState().reset();
}

// ----- Group chat rooms -----

/** Subscribe this socket to a room (server checks membership). */
export function joinRoom(threadId: string) {
  socket?.emit('room:join', { threadId });
}

/** Broadcast a typing indicator to the other members of a room. */
export function sendTyping(threadId: string, typing = true) {
  socket?.emit('room:typing', { threadId, typing });
}

interface ChatUnreadState {
  direct: number;
  rooms: number;
  total: number;
  loaded: boolean;
  refresh: () => Promise<void>;
  reset: () => void;
}

let unreadTimer: ReturnType<typeof setTimeout> | null = null;

/** Unread message badges (direct + rooms), refreshed on socket events. */
export const useChatUnread = create<ChatUnreadState>((set) => ({
  direct: 0,
  rooms: 0,
  total: 0,
  loaded: false,
  refresh: async () => {
    if (!getToken()) return;
    try {
      const r: any = await api.messages.unread();
      set({
        direct: Number(r?.direct) || 0,
        rooms: Number(r?.rooms) || 0,
        total: Number(r?.total) || 0,
        loaded: true,
      });
    } catch {
      /* keep the previous counts */
    }
  },
  reset: () => set({ direct: 0, rooms: 0, total: 0, loaded: false }),
}));

/** Debounced refresh so a burst of events triggers a single request. */
export function refreshChatUnread(delay = 400) {
  if (unreadTimer) clearTimeout(unreadTimer);
  unreadTimer = setTimeout(() => {
    unreadTimer = null;
    void useChatUnread.getState().refresh();
  }, delay);
}

interface PresenceState {
  online: Set<string>;
  connected: boolean;
  setSnapshot: (ids: string[]) => void;
  setOne: (id: string, on: boolean) => void;
  setConnected: (b: boolean) => void;
  reset: () => void;
}

export const usePresence = create<PresenceState>((set) => ({
  online: new Set<string>(),
  connected: false,
  setSnapshot: (ids) => set({ online: new Set(ids) }),
  setOne: (id, on) =>
    set((s) => {
      const next = new Set(s.online);
      if (on) next.add(id);
      else next.delete(id);
      return { online: next };
    }),
  setConnected: (b) => set({ connected: b }),
  reset: () => set({ online: new Set<string>(), connected: false }),
}));

export function useIsOnline(userId?: string): boolean {
  return usePresence((s) => (userId ? s.online.has(userId) : false));
}

/** Open (once) the real-time connection and feed presence. */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    if (!socket) {
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
      });
    }
    const s = socket;
    const p = usePresence.getState();
    const onConnect = () => p.setConnected(true);
    const onDisconnect = () => p.setConnected(false);
    const onSnapshot = (data: any) => p.setSnapshot(data?.online || []);
    const onUpdate = (data: any) => p.setOne(data.userId, !!data.online);
    const onMessage = () => refreshChatUnread();

    s.on('connect', onConnect);
    s.on('message:new', onMessage);
    s.on('message:read', onMessage);
    s.on('disconnect', onDisconnect);
    s.on('presence:state', onSnapshot);
    s.on('presence:update', onUpdate);
    if (s.connected) p.setConnected(true);
    refreshChatUnread(0);

    return () => {
      s.off('connect', onConnect);
      s.off('message:new', onMessage);
      s.off('message:read', onMessage);
      s.off('disconnect', onDisconnect);
      s.off('presence:state', onSnapshot);
      s.off('presence:update', onUpdate);
    };
  }, []);

  return <>{children}</>;
}
