"use client";

import { useEffect, useRef } from "react";
import { useLocalState } from "@/lib/hooks/useLocalState";
import { useSupabaseUser } from "@/lib/supabase/useSupabaseUser";
import { pullRows, upsertRows, softDeleteRows } from "@/lib/sync/syncEngine";

export interface ArraySync<T extends { id: string }> {
  table: string;
  toRow: (item: T, userId: string) => Record<string, unknown>;
  fromRow: (row: Record<string, unknown>) => T;
}

const PUSH_DEBOUNCE_MS = 800;

/**
 * Drop-in replacement for `useLocalState` on id-array keys (sc-logged-sessions,
 * sc-mock-tests, later sc-planned-blocks). Client-generated ids make same-id conflicts
 * practically impossible, so merging only ever means: rows remote has that local lacks
 * get added locally; rows local has that remote lacks get pushed up. Locally-removed
 * ids get soft-deleted remotely (`deleted_at`), matching each screen's existing
 * `removeX(id)` pattern.
 *
 * Accepted v1 limitation: a delete never propagates back down to a device that already
 * cached that row before the delete happened — pulls only ever add. Safe because
 * single-device usage is the overwhelming common case today.
 */
export function useSyncedArrayState<T extends { id: string }>(
  key: string,
  initial: T[],
  sync: ArraySync<T> | null,
): [T[], (next: T[] | ((prev: T[]) => T[])) => void, boolean] {
  const [value, setValue, hydrated] = useLocalState<T[]>(key, initial);
  const { user } = useSupabaseUser();
  const prevRef = useRef<T[]>(value);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyToPush = useRef<string | null>(null);

  useEffect(() => {
    if (!sync || !hydrated || !user) return;
    if (readyToPush.current === user.id) return;
    let cancelled = false;

    (async () => {
      const remoteRows = await pullRows(sync.table, user.id);
      if (cancelled) return;

      const localIds = new Set(value.map((v) => v.id));
      const remoteItems = remoteRows.map((r) => sync.fromRow(r.row));
      const toAddLocally = remoteItems.filter((item) => !localIds.has(item.id));
      if (toAddLocally.length > 0) {
        setValue((prev) => [...prev, ...toAddLocally]);
      }

      const remoteIds = new Set(remoteItems.map((item) => item.id));
      const localOnly = value.filter((v) => !remoteIds.has(v.id));
      if (localOnly.length > 0) {
        await upsertRows(sync.table, localOnly.map((item) => sync.toRow(item, user.id)));
      }

      readyToPush.current = user.id;
      prevRef.current = [...value, ...toAddLocally];
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync, hydrated, user?.id, key]);

  useEffect(() => {
    if (!sync || !hydrated || !user || readyToPush.current !== user.id) {
      prevRef.current = value;
      return;
    }
    const prev = prevRef.current;
    const prevById = new Map(prev.map((v) => [v.id, v]));
    const nextIds = new Set(value.map((v) => v.id));
    // Catches both genuinely-new ids and in-place edits to an existing one (e.g. toggling
    // a planned block's `completed` flag) — an upsert handles either case identically.
    const upserts = value.filter((v) => {
      const prevItem = prevById.get(v.id);
      return !prevItem || JSON.stringify(prevItem) !== JSON.stringify(v);
    });
    const removedIds = prev.filter((v) => !nextIds.has(v.id)).map((v) => v.id);
    prevRef.current = value;

    if (upserts.length === 0 && removedIds.length === 0) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      if (upserts.length > 0) upsertRows(sync.table, upserts.map((item) => sync.toRow(item, user.id)));
      if (removedIds.length > 0) softDeleteRows(sync.table, removedIds);
    }, PUSH_DEBOUNCE_MS);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [sync, hydrated, user, value, key]);

  return [value, setValue, hydrated];
}
