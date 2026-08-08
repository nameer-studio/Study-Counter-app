import type { SituationMode } from "@/lib/domain/types";

/** Captured by onboarding A4. Account-less by design — the app is fully usable offline,
 *  so a profile is local until a student chooses to sign in for sync (Phase 2). */
export interface Profile {
  displayName: string;
  username: string;
}

/**
 * Captured by A6. Drives the daily-hour target used across the Dashboard, planner and
 * readiness screens — the single biggest difference between a Foundation student in
 * college and a Final student surviving articleship.
 */
export interface Situation {
  mode: SituationMode;
  /** Articleship only — office hours the student studies around. */
  officeIn?: string;
  officeOut?: string;
  /** Study leave only — when the leave period begins. */
  leaveStartDate?: string;
}

export const SITUATION_OPTIONS: {
  mode: SituationMode;
  emoji: string;
  label: string;
  targetLabel: string;
  defaultHours: number;
}[] = [
  { mode: "schoolOrCollege", emoji: "🎓", label: "School / college", targetLabel: "Target: 3–4h/day", defaultHours: 3.5 },
  { mode: "fullTimeStudy", emoji: "📖", label: "Full-time study", targetLabel: "Target: 8–10h/day", defaultHours: 9 },
  { mode: "articleship", emoji: "💼", label: "Articleship", targetLabel: "Target: 3h/day around office", defaultHours: 3 },
  { mode: "studyLeave", emoji: "🏝️", label: "Study leave", targetLabel: "Target: 11–14h/day", defaultHours: 12 },
];

/** Per-situation daily-hour targets a student has customised in Settings (H3),
 *  overriding SITUATION_OPTIONS' defaults. Stored separately from `Situation` itself
 *  since the override set persists across a student switching modes (e.g. their
 *  study-leave target stays remembered even while they're currently in articleship). */
export type SituationHourOverrides = Partial<Record<SituationMode, number>>;
export const SITUATION_HOURS_STORAGE_KEY = "sc-situation-hours";

export function dailyTargetHours(
  situation: Situation | null,
  overrides: SituationHourOverrides = {},
): number {
  if (!situation) return 8;
  const override = overrides[situation.mode];
  if (override !== undefined) return override;
  return SITUATION_OPTIONS.find((o) => o.mode === situation.mode)?.defaultHours ?? 8;
}
