'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getChild, type Child } from '@/lib/mock-data';
import {
  hydrateChildDashboardStateFromSupabase,
  mergeWithDefaultChildState,
  readChildDashboardState,
  type ChildDashboardState,
} from '@/lib/mission-state';

export type ToastTone = 'success' | 'info' | 'warning' | 'celebrate';
export type ChildToast = { id: number; message: string; tone: ToastTone };

type ChildStateContextValue = {
  child: Child;
  state: ChildDashboardState;
  /** True once the authoritative Supabase state (or the offline fallback) has loaded. */
  ready: boolean;
  /** False until the first cached or live snapshot is shown — avoids flashing default balances. */
  hasSnapshot: boolean;
  /** True a moment after ready, so balance animations only celebrate real changes. */
  settled: boolean;
  refresh: () => Promise<ChildDashboardState>;
  /** Replace the displayed state with an already-persisted snapshot. */
  applyState: (next: ChildDashboardState) => void;
  toast: ChildToast | null;
  notify: (message: string, tone?: ToastTone) => void;
};

const ChildStateContext = createContext<ChildStateContextValue | null>(null);

const REFRESH_INTERVAL_MS = 30_000;

export function ChildStateProvider({ childId, children }: { childId: string; children: ReactNode }) {
  const child = getChild(childId);
  if (!child) {
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center font-display text-xl text-ink">
        We couldn&apos;t find that player.
      </main>
    );
  }
  return (
    <ChildStateInner child={child}>{children}</ChildStateInner>
  );
}

function ChildStateInner({ child, children }: { child: Child; children: ReactNode }) {
  const [state, setState] = useState<ChildDashboardState>(() => mergeWithDefaultChildState(child, null));
  const [ready, setReady] = useState(false);
  const [hasSnapshot, setHasSnapshot] = useState(false);
  const [settled, setSettled] = useState(false);
  const [toast, setToast] = useState<ChildToast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastId = useRef(0);
  const refreshing = useRef<Promise<ChildDashboardState> | null>(null);

  const refresh = useCallback(() => {
    if (refreshing.current) return refreshing.current;
    const run = hydrateChildDashboardStateFromSupabase(child.id, child)
      .then((next) => {
        setState(next);
        setReady(true);
        return next;
      })
      .finally(() => {
        refreshing.current = null;
      });
    refreshing.current = run;
    return run;
  }, [child]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // First paint from the local display cache, then reconcile with Supabase.
      await Promise.resolve();
      if (cancelled) return;
      const cached = readChildDashboardState(child.id);
      if (cached) {
        setState(mergeWithDefaultChildState(child, cached));
        setHasSnapshot(true);
      }
      await refresh();
      if (cancelled) return;
      setHasSnapshot(true);
      window.setTimeout(() => setSettled(true), 400);
    })();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [child, refresh]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const notify = useCallback((message: string, tone: ToastTone = 'success') => {
    toastId.current += 1;
    setToast({ id: toastId.current, message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), tone === 'celebrate' ? 3600 : 2600);
  }, []);

  const value = useMemo<ChildStateContextValue>(
    () => ({ child, state, ready, hasSnapshot, settled, refresh, applyState: setState, toast, notify }),
    [child, state, ready, hasSnapshot, settled, refresh, toast, notify]
  );

  return <ChildStateContext.Provider value={value}>{children}</ChildStateContext.Provider>;
}

export function useChildState() {
  const value = useContext(ChildStateContext);
  if (!value) throw new Error('useChildState must be used inside ChildPageFrame');
  return value;
}
