/**
 * Domain enums mirroring the Kotlin models in `domain/model/`. Kept as string unions
 * (not TS enums) so they serialise cleanly to IndexedDB and Supabase without a mapping
 * layer.
 */

// ---- Revision rounds (RevisionRound.kt) ----

export const REVISION_ROUNDS = [
  "notStarted",
  "firstReading",
  "firstRevision",
  "secondRevision",
  "finalRevision",
] as const;

export type RevisionRound = (typeof REVISION_ROUNDS)[number];

/** Number of filled pips (0–4) — drives the indicator component. */
export function revisionRoundIndex(round: RevisionRound): number {
  return REVISION_ROUNDS.indexOf(round);
}

export const REVISION_ROUND_SHORT_LABEL: Record<RevisionRound, string> = {
  notStarted: "—",
  firstReading: "1st read",
  firstRevision: "1st rev",
  secondRevision: "2nd rev",
  finalRevision: "final",
};

/** Cycles a chapter forward one round, wrapping from finalRevision back to notStarted.
 *  Used by the syllabus screen's tap-to-advance interaction. */
export function advanceRevisionRound(round: RevisionRound): RevisionRound {
  const next = (revisionRoundIndex(round) + 1) % REVISION_ROUNDS.length;
  return REVISION_ROUNDS[next];
}

// ---- Paper categories (PaperCategory.kt) ----
// Every ICAI paper across all three levels maps to exactly one of these six; the enum
// decides only which fixed colour it renders in, never what the user sees as its name.

export const PAPER_CATEGORIES = [
  "accounts",
  "law",
  "tax",
  "costing",
  "audit",
  "fmsm",
] as const;

export type PaperCategory = (typeof PAPER_CATEGORIES)[number];

export const PAPER_CATEGORY_COLOR_VAR: Record<PaperCategory, string> = {
  accounts: "var(--paper-accounts)",
  law: "var(--paper-law)",
  tax: "var(--paper-tax)",
  costing: "var(--paper-costing)",
  audit: "var(--paper-audit)",
  fmsm: "var(--paper-fmsm)",
};

export const PAPER_CATEGORY_LABEL: Record<PaperCategory, string> = {
  accounts: "Accounts",
  law: "Law & Corp",
  tax: "Taxation",
  costing: "Costing",
  audit: "Audit",
  fmsm: "FM / SM",
};

// ---- Activity types (ActivityType.kt) ----
// What lets the app distinguish "read a chapter" from "actually practised questions" —
// which predicts passing far better than raw hours.

export const ACTIVITY_TYPES = [
  "concept",
  "revision",
  "practice",
  "mockTest",
  "lecture",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  concept: "Read",
  revision: "Revise",
  practice: "Practice",
  mockTest: "Mock test",
  lecture: "Lecture",
};

export const ACTIVITY_EMOJI: Record<ActivityType, string> = {
  concept: "📖",
  revision: "🔁",
  practice: "✍️",
  mockTest: "📝",
  lecture: "🎧",
};

export const ACTIVITY_DOT_COLOR_VAR: Record<ActivityType, string> = {
  concept: "var(--paper-accounts)",
  revision: "var(--paper-costing)",
  practice: "var(--paper-tax)",
  mockTest: "var(--paper-law)",
  lecture: "var(--paper-accounts)",
};

// ---- Situation mode (SituationMode.kt) ----
// Drives the daily-hour target. Foundation students are usually school/college; Final
// students cycle articleship → study leave as the attempt approaches.

export const SITUATION_MODES = [
  "schoolOrCollege",
  "fullTimeStudy",
  "articleship",
  "studyLeave",
] as const;

export type SituationMode = (typeof SITUATION_MODES)[number];

export const SITUATION_LABEL: Record<SituationMode, string> = {
  schoolOrCollege: "School / college",
  fullTimeStudy: "Full-time study",
  articleship: "Articleship",
  studyLeave: "Study leave",
};

// ---- ICAI levels ----
// Confirmed attempt calendar: Foundation and Inter run 3x/year (Jan/May/Sept);
// Final runs 2x/year (May/Nov). Session validity is level-dependent — a Final student
// must never be offered January.

export type IcaiLevel = "foundation" | "intermediate" | "final";

export type ExamSession = "jan" | "may" | "sep" | "nov";

export const VALID_SESSIONS: Record<IcaiLevel, ExamSession[]> = {
  foundation: ["jan", "may", "sep"],
  intermediate: ["jan", "may", "sep"],
  final: ["may", "nov"],
};

export const LEVEL_HAS_GROUPS: Record<IcaiLevel, boolean> = {
  foundation: false, // 4 papers cleared as a single unit
  intermediate: true,
  final: true,
};

export const SESSION_LABEL: Record<ExamSession, string> = {
  jan: "January",
  may: "May–June",
  sep: "September",
  nov: "November",
};
