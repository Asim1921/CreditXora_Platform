"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A timestamp that is stable within a render and refreshed on an interval.
 *
 * Calling `Date.now()` straight in a component body is impure: it can differ
 * between the server render and hydration, and between two renders in the same
 * frame. `useSyncExternalStore` is the supported way to read a changing
 * external value — the server snapshot is 0, so markup matches on hydration and
 * React re-renders with the real time immediately after.
 *
 * The snapshot is bucketed to `refreshMs` so it stays referentially stable
 * between ticks, which is what the store contract requires.
 */
export function useNow(refreshMs = 60_000): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const timer = window.setInterval(onStoreChange, refreshMs);
      return () => window.clearInterval(timer);
    },
    [refreshMs],
  );

  const getSnapshot = useCallback(
    () => Math.floor(Date.now() / refreshMs) * refreshMs,
    [refreshMs],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}

/** True when `value` is a date in the past. Safe before `now` is populated. */
export function isOverdue(value: string | null | undefined, now: number): boolean {
  if (!value || now === 0) return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time <= now;
}
