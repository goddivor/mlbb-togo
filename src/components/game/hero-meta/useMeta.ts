'use client';

import { useEffect, useState } from 'react';

/** Loads one meta resource; `null` data means unavailable. Ignores stale responses. */
export function useMeta<T = any>(load: () => Promise<T | null>, deps: unknown[]): { data: T | null; loading: boolean } {
  const [state, setState] = useState<{ data: T | null; loading: boolean }>({ data: null, loading: true });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ data: s.data, loading: true }));
    load()
      .then((data) => alive && setState({ data: data ?? null, loading: false }))
      .catch(() => alive && setState({ data: null, loading: false }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
