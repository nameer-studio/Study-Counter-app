import { supabase } from "@/lib/supabase/client";

/**
 * Answers "does this account already have data on Supabase" right after sign-in — used
 * by onboarding to decide whether a returning user should skip straight to the
 * dashboard instead of being walked through profile/attempt/situation setup again.
 *
 * The actual pull-and-merge for every synced key happens automatically inside
 * `useSyncedLocalState`/`useSyncedArrayState`/`useSyncedRecordState` as soon as
 * `useSupabaseUser` reports a session — each hook instance reacts independently, so
 * there's no separate orchestration step needed to move the data itself. This function
 * only answers the one question the *caller* can't get from a hook: is this a fresh
 * account or a returning one.
 */
export async function hasRemoteAttempt(userId: string): Promise<boolean> {
  const { data } = await supabase.from("attempts").select("user_id").eq("user_id", userId).maybeSingle();
  return data != null;
}
