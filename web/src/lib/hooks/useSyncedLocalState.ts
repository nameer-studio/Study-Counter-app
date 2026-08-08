"use client";

import { useEffect, useRef } from "react";
import { useLocalState } from "@/lib/hooks/useLocalState";
import { useSupabaseUser } from "@/lib/supabase/useSupabaseUser";
import { pullSingleton, pushSingleton } from "@/lib/sync/syncEngine";

export interface SingletonSync<T> {
  table: string;
  toRow: (value: T, userId: string) => Record<string, unknown>;
  fromRow: (row: Record<string, unknown>) => T;
  /** Is `value` still the "nothing set yet" state (e.g. null, or empty strings)? Skips
   *  pushing garbage and lets a genuinely-empty local device adopt whatever's remote. */
  isEmpty: (value: T) => boolean;
}

const PUSH_DEBOUNCE_MS = 800;

/**
 * Drop-in replacement for `useLocalState` on singleton-per-user keys (sc-profile,
 * sc-attempt, sc-situation, sc-situation-hours) — same `[value, setValue, hydrated]`
 * shape, plus background sync when `sync` is non-null and a user is signed in.
 *
 * Merge rule: on first sign-in this device sees, remote wins only if it's newer than
 * this device's last-synced shadow timestamp (`localStorage["${key}__syncedAt"]") or the
 * local value is still empty; otherwise local is pushed up — including the "brand-new
 * account, seed it from whatever I already had locally" case, when there's no remote
 * row at all yet.
 */
export function useSyncedLocalState<T>(
  key: string,
  initial: T,
  sync: SingletonSync<T> | null,
): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue, hydrated] = useLocalState<T>(key, initial);
  const { user } = useSupabaseUser();
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyToPush = useRef<string | null>(null);

  // Pull-and-merge once per sign-in (also pushes local-as-seed when remote is empty).
  useEffect(() => {
    if (!sync || !hydrated || !user) return;
    if (readyToPush.current === user.id) return;
    let cancelled = false;

    (async () => {
      const remote = await pullSingleton(sync.table, user.id);
      if (cancelled) return;
      const shadowKey = `${key}__syncedAt`;
      const shadow = localStorage.getItem(shadowKey);
      const localIsEmpty = sync.isEmpty(value);

      if (remote) {
        const remoteIsNewer = !shadow || new Date(remote.updatedAt) > new Date(shadow);
        if (localIsEmpty || remoteIsNewer) {
          setValue(sync.fromRow(remote.row));
        } else {
          await pushSingleton(sync.table, user.id, sync.toRow(value, user.id));
        }
        localStorage.setItem(shadowKey, remote.updatedAt);
      } else if (!localIsEmpty) {
        await pushSingleton(sync.table, user.id, sync.toRow(value, user.id));
        localStorage.setItem(shadowKey, new Date().toISOString());
      }
      readyToPush.current = user.id;
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally re-runs only when the signed-in user changes, not on every edit —
    // ongoing edits are handled by the debounced push effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync, hydrated, user?.id, key]);

  // Debounced push on every subsequent local edit, once this key's initial sync is done.
  useEffect(() => {
    if (!sync || !hydrated || !user || readyToPush.current !== user.id) return;
    if (sync.isEmpty(value)) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      pushSingleton(sync.table, user.id, sync.toRow(value, user.id)).then(() => {
        localStorage.setItem(`${key}__syncedAt`, new Date().toISOString());
      });
    }, PUSH_DEBOUNCE_MS);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [sync, hydrated, user, value, key]);

  return [value, setValue, hydrated];
}
