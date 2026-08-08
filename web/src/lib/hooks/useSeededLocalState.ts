"use client";

import { useEffect, useState } from "react";
import { useLocalState } from "@/lib/hooks/useLocalState";

/**
 * `useLocalState` plus one-time first-run seeding.
 *
 * Exists to make a specific bug impossible to repeat: seeding must wait for the
 * `hydrated` flag, because a seed check that runs on mount reads the pre-hydration
 * value (the `initial` argument) regardless of what's actually in storage — and would
 * therefore overwrite real saved data with demo data on every load. Any screen that
 * wants "populate this if empty" behaviour should use this rather than hand-rolling the
 * effect.
 */
export function useSeededLocalState<T>(
  key: string,
  initial: T,
  seed: () => T,
  isEmpty: (value: T) => boolean,
): [T, (next: T | ((prev: T) => T)) => void] {
  return useSeedOnce(useLocalState<T>(key, initial), seed, isEmpty);
}

/**
 * The seed-once behavior above, decoupled from `useLocalState` specifically — lets a
 * call site seed on top of `useSyncedArrayState`/`useSyncedRecordState`/
 * `useSyncedLocalState` instead, when a key needs both demo-seeding AND background sync
 * (e.g. sc-mock-tests). Pass the base hook's own `[value, setValue, hydrated]` tuple.
 */
export function useSeedOnce<T>(
  base: [T, (next: T | ((prev: T) => T)) => void, boolean],
  seed: () => T,
  isEmpty: (value: T) => boolean,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue, hydrated] = base;
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!hydrated || seeded) return;
    setSeeded(true);
    if (isEmpty(value)) setValue(seed());
    // `seeded` guards this to a single run, so re-created seed/isEmpty closures are harmless.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, seeded]);

  return [value, setValue];
}
