import type { ActivityType } from "@/lib/domain/types";

/** Shared localStorage key — imported by both the Planner (which lists blocks) and the
 *  Dashboard's neglect-alert "Schedule" action (which writes one), so the two can never
 *  drift out of sync via a typo'd string literal in either file. */
export const PLANNED_BLOCKS_STORAGE_KEY = "sc-planned-blocks";

/** A scheduled study block — local stand-in for the `planned_blocks` table (PLAN.md §5)
 *  until Phase 2's sync layer exists. [date] is an ISO yyyy-mm-dd string so grid lookups
 *  are a plain string match, no timezone arithmetic needed.
 *
 * [startTime] ("HH:MM", 24h) is optional — blocks added from the Week view's quick-add
 * or the week wizard don't set one, since those flows only ever dealt in day-level
 * totals. It only exists so the Day view (D2) can place blocks on a real hour-labeled
 * timeline instead of faking positions; a block without one renders in that view's
 * "unscheduled" bucket rather than being guessed at a fabricated time.
 */
export interface PlannedBlock {
  id: string;
  paperId: string;
  chapterId: string;
  activityType: ActivityType;
  date: string;
  startTime?: string;
  durationMinutes: number;
  completed: boolean;
}

export function newBlockId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function totalMinutes(blocks: PlannedBlock[]): number {
  return blocks.reduce((sum, b) => sum + b.durationMinutes, 0);
}

export function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

/** "HH:MM" -> minutes since midnight, for sorting/positioning on a timeline. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

