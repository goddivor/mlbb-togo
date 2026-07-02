'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { getToken, API_URL } from '@/lib/api';

const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;
export const getSocket = (): Socket | null => socket;

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  usePresence.getState().reset();
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

/** Ouvre (une seule fois) la connexion temps réel et alimente la présence. */
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

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('presence:state', onSnapshot);
    s.on('presence:update', onUpdate);
    if (s.connected) p.setConnected(true);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('presence:state', onSnapshot);
      s.off('presence:update', onUpdate);
    };
  }, []);

  return <>{children}</>;
}
