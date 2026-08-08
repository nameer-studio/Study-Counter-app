"use client";

import { useEffect, useState } from "react";

/**
 * Persisted client state — the offline-first stand-in for IndexedDB until the real
 * data layer lands (WEB_PLAN.md §4). Reads synchronously would break SSR (localStorage
 * doesn't exist on the server), so state starts at [initial] and hydrates from storage
 * in an effect; a same-value check on write avoids clobbering other tabs mid-render.
 */
export function useLocalState<T>(
  key: string,
  initial: T,
): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // Corrupt or inaccessible storage — fall back to `initial` silently.
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable (private browsing) — data stays in-memory only.
    }
  }, [key, value, hydrated]);

  // [2] lets callers gate logic (like first-run seeding) on hydration actually being
  // complete — reading `value` in the same effect tick as hydration's own mount effect
  // sees the pre-hydration closure, not what was just read from storage, so any code
  // that needs to react to "is there real stored data" MUST wait for this flag rather
  // than checking `value` directly on mount.
  return [value, setValue, hydrated];
}
