import { supabase } from "@/lib/supabase/client";

/**
 * Thin wrappers over `supabase.from(table)...` shared by the three synced-state hooks.
 * No domain knowledge lives here — each hook's `sync` config supplies the
 * table/toRow/fromRow mapping; this file only knows about singleton rows (PK=user_id),
 * multi-row tables (PK=id, soft-delete via deleted_at), and keyed-map rows
 * (PK=(user_id,chapter_id)).
 */

export interface RowPull {
  row: Record<string, unknown>;
  updatedAt: string;
}

export async function pullSingleton(table: string, userId: string): Promise<RowPull | null> {
  const { data, error } = await supabase.from(table).select("*").eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  return { row: data, updatedAt: data.updated_at as string };
}

export async function pushSingleton(
  table: string,
  userId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await supabase.from(table).upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
}

export async function pullRows(table: string, userId: string): Promise<RowPull[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null);
  if (error || !data) return [];
  return data.map((row) => ({ row, updatedAt: row.updated_at as string }));
}

export async function upsertRows(table: string, rows: Record<string, unknown>[]): Promise<void> {
  if (rows.length === 0) return;
  await supabase.from(table).upsert(rows, { onConflict: "id" });
}

export async function softDeleteRows(table: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await supabase.from(table).update({ deleted_at: new Date().toISOString() }).in("id", ids);
}

export async function pullKeyedMap(table: string, userId: string): Promise<RowPull[]> {
  const { data, error } = await supabase.from(table).select("*").eq("user_id", userId);
  if (error || !data) return [];
  return data.map((row) => ({ row, updatedAt: row.updated_at as string }));
}

export async function upsertKeyedMapEntries(
  table: string,
  rows: Record<string, unknown>[],
): Promise<void> {
  if (rows.length === 0) return;
  await supabase.from(table).upsert(rows, { onConflict: "user_id,chapter_id" });
}
