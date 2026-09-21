'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { parseFrameRef } from '@/components/game/frames';
import { useAuthStore } from '@/store/useStore';
import type { Collection } from './shared';

/** Pushes the equipped frame / title to the signed-in user (header, profile, cards). */
function patchAuthUser(patch: { equippedFrame?: string | null; equippedTitle?: string | null }) {
  const state = useAuthStore.getState();
  if (state.user) state.setUser({ ...state.user, ...patch });
  if (state.userProfile) state.setUserProfile({ ...state.userProfile, ...patch });
}

/**
 * The signed-in player's frames and titles collection, loaded on first use,
 * with optimistic equip / unequip of frames and titles.
 */
export function useRewardsCollection(enabled: boolean, errorLabel: string) {
  const [data, setData] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const started = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await api.rewards.collection();
      setData(res as Collection);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || started.current) return;
    started.current = true;
    load();
  }, [enabled, load]);

  /** Equips `key` (`id` or `id:variant`); null brings the rank frame back. */
  const equipFrame = useCallback(
    async (key: string | null) => {
      if (!data || pending) return false;
      const previous = { equippedFrame: data.equippedFrame, fallbackFrame: data.fallbackFrame };
      setPending(`frame:${key ?? ''}`);
      setData((d) => (d ? { ...d, equippedFrame: key } : d));
      patchAuthUser({ equippedFrame: key });
      try {
        const ref = parseFrameRef(key);
        const res: any = await api.rewards.equipFrame(ref ? ref.id : null, ref?.variant || null);
        setData((d) => (d ? { ...d, equippedFrame: res?.equippedFrame ?? null, fallbackFrame: res?.fallbackFrame ?? null } : d));
        patchAuthUser({ equippedFrame: res?.equippedFrame ?? null });
        return true;
      } catch (e: any) {
        setData((d) => (d ? { ...d, ...previous } : d));
        patchAuthUser({ equippedFrame: previous.equippedFrame });
        toast.error(e?.message || errorLabel);
        return false;
      } finally {
        setPending(null);
      }
    },
    [data, pending, errorLabel],
  );

  /** Equips a level title; null = no title. */
  const equipTitle = useCallback(
    async (id: string | null) => {
      if (!data || pending) return false;
      const previous = data.equippedTitle;
      setPending(`title:${id ?? ''}`);
      setData((d) => (d ? { ...d, equippedTitle: id } : d));
      patchAuthUser({ equippedTitle: id });
      try {
        const res: any = await api.rewards.equipTitle(id);
        setData((d) => (d ? { ...d, equippedTitle: res?.equippedTitle ?? null } : d));
        patchAuthUser({ equippedTitle: res?.equippedTitle ?? null });
        return true;
      } catch (e: any) {
        setData((d) => (d ? { ...d, equippedTitle: previous } : d));
        patchAuthUser({ equippedTitle: previous });
        toast.error(e?.message || errorLabel);
        return false;
      } finally {
        setPending(null);
      }
    },
    [data, pending, errorLabel],
  );

  return { data, loading, failed, pending, reload: load, equipFrame, equipTitle };
}
