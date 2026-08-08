import type { ActivityType } from "@/lib/domain/types";

/** A finished study session — the web-local stand-in for the `study_sessions` table
 *  (PLAN.md §5) until Phase 2's Supabase sync exists. */
export interface LoggedSession {
  id: string;
  paperId: string;
  chapterId: string;
  activityType: ActivityType;
  durationMs: number;
  endedAt: number; // epoch ms
}

export function newSessionId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
