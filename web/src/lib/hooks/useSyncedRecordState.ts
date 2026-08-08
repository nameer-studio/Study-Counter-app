"use client";

import { useEffect, useRef } from "react";
import { useLocalState } from "@/lib/hooks/useLocalState";
import { useSupabaseUser } from "@/lib/supabase/useSupabaseUser";
import { pullKeyedMap, upsertKeyedMapEntries } from "@/lib/sync/syncEngine";

export interface RecordSync<V> {
  table: string;
  toRow: (chapterId: string, value: V, userId: string) => Record<string, unknown>;
  fromRow: (row: Record<string, unknown>) => [string, V];
}

const PUSH_DEBOUNCE_MS = 800;

/**
 * Drop-in replacement for `useLocalState` on keyed-map keys (sc-foundation-rounds,
 * sc-chapter-confidence) — `Record<chapterId, V>` synced against a `(user_id,
 * chapter_id)`-keyed table. Same merge philosophy as `useSyncedArrayState`: remote
 * entries missing locally get added; local-only entries get pushed; no chapter-id
 * "delete" case exists in this domain (a revision round or confidence rating is set or
 * left at its default, never removed as a row).
 */
export function useSyncedRecordState<V>(
  key: string,
  initial: Record<string, V>,
  sync: RecordSync<V> | null,
): [Record<string, V>, (next: Record<string, V> | ((prev: Record<string, V>) => Record<string, V>)) => void, boolean] {
  const [value, setValue, hydrated] = useLocalState<Record<string, V>>(key, initial);
  const { user } = useSupabaseUser();
  const prevRef = useRef<Record<string, V>>(value);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyToPush = useRef<string | null>(null);

  useEffect(() => {
    if (!sync || !hydrated || !user) return;
    if (readyToPush.current === user.id) return;
    let cancelled = false;

    (async () => {
      const remoteRows = await pullKeyedMap(sync.table, user.id);
      if (cancelled) return;
      const remoteEntries = remoteRows.map((r) => sync.fromRow(r.row));

      const toAdd: Record<string, V> = {};
      for (const [k, v] of remoteEntries) {
        if (!(k in value)) toAdd[k] = v;
      }
      if (Object.keys(toAdd).length > 0) {
        setValue((prev) => ({ ...prev, ...toAdd }));
      }

      const remoteKeys = new Set(remoteEntries.map(([k]) => k));
      const localOnlyEntries = Object.entries(value).filter(([k]) => !remoteKeys.has(k));
      if (localOnlyEntries.length > 0) {
        await upsertKeyedMapEntries(
          sync.table,
          localOnlyEntries.map(([k, v]) => sync.toRow(k, v, user.id)),
        );
      }

      readyToPush.current = user.id;
      prevRef.current = { ...value, ...toAdd };
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
    const changedEntries = Object.entries(value).filter(([k, v]) => prev[k] !== v);
    prevRef.current = value;
    if (changedEntries.length === 0) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      upsertKeyedMapEntries(sync.table, changedEntries.map(([k, v]) => sync.toRow(k, v, user.id)));
    }, PUSH_DEBOUNCE_MS);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [sync, hydrated, user, value, key]);

  return [value, setValue, hydrated];
}
