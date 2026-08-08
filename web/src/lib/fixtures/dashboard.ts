import type { PaceState } from "@/lib/domain/pace";
import type { ActivityType, PaperCategory, SituationMode } from "@/lib/domain/types";

/**
 * Sample data lifted verbatim from `Dashboard.dc.html`'s three `variant` configs, so the
 * ported screen can be compared against the design side by side. Replaced by real
 * IndexedDB-backed state in Phase 1 — the copy strings, though, are final-intent and
 * worth keeping: they carry the "honest, not harsh" tone the whole product depends on.
 */

export type PaceVariant = "behind" | "onpace" | "ahead";

export interface PlanBlock {
  activity: ActivityType;
  label: string;
  paper: PaperCategory;
  durationLabel: string;
  done: boolean;
  urgent?: boolean;
}

export interface NeglectAlert {
  text: string;
  sub: string;
  action: string;
  /** Which theme colour the alert is toned in. */
  tone: "amber" | "red";
  /** What "Schedule" actually books — a real, seeded Foundation paper/chapter, same
   *  rule as the Start CTA's target fields. */
  paperId: string;
  chapterId: string;
  activityType: ActivityType;
  durationMinutes: number;
}

export interface DashboardData {
  clock: string;
  greeting: string;
  name: string;
  daysToAttempt: number;
  attemptLabel: string;
  daysToPaper: number;
  paperName: string;
  paperCategory: PaperCategory;
  pace: PaceState;
  /** The one-line honest reframe under the countdown. */
  reframe: string;
  targetHours: number;
  doneHours: number;
  situation: SituationMode;
  situationLabel: string;
  ctaTitle: string;
  ctaSub: string;
  /** What the Start CTA actually opens in the timer — must be a real, seeded Foundation
   *  paper/chapter (see foundation.ts), not just flavour text. */
  ctaPaperId: string;
  ctaChapterId: string;
  ctaActivityType: ActivityType;
  alert: NeglectAlert | null;
  streakCount: number;
  blocks: PlanBlock[];
  /** Hours logged Mon–Sun; last entry is today. */
  week: number[];
  friends: { initials: string; name: string; detail: string; paper: PaperCategory }[];
}

const FRIENDS: DashboardData["friends"] = [
  { initials: "PR", name: "Priya", detail: "Tax · 1h 20m", paper: "tax" },
  { initials: "RK", name: "Rohan", detail: "Audit · 45m", paper: "audit" },
  { initials: "SN", name: "Sneha", detail: "FR · 2h 05m", paper: "accounts" },
];

export const DASHBOARD_FIXTURES: Record<PaceVariant, DashboardData> = {
  behind: {
    clock: "05:02",
    greeting: "Good morning",
    name: "Aditya",
    daysToAttempt: 20,
    attemptLabel: "CA Final · Nov 2026",
    daysToPaper: 6,
    paperName: "Financial Reporting",
    paperCategory: "accounts",
    pace: { status: "behind", dayDelta: -34 },
    reframe:
      "Behind, but recoverable. Two focused blocks today starts closing the gap — start with the one that hurts.",
    targetHours: 11,
    doneHours: 0.5,
    situation: "studyLeave",
    situationLabel: "Study leave · 11h target",
    ctaTitle: "Start now — Quant Aptitude",
    ctaSub: "2h revision · your weakest paper",
    ctaPaperId: "fnd-p3",
    ctaChapterId: "fnd-p3-c4",
    ctaActivityType: "revision",
    alert: {
      text: "Business Laws untouched for 11 days",
      sub: "Schedule it first, before anything easier.",
      action: "Schedule 2h",
      tone: "red",
      paperId: "fnd-p2",
      chapterId: "fnd-p2-c1",
      activityType: "revision",
      durationMinutes: 120,
    },
    streakCount: 0,
    blocks: [
      { activity: "revision", label: "Costing — full revision", paper: "costing", durationLabel: "2h", done: false, urgent: true },
      { activity: "concept", label: "FR — Ind AS 115", paper: "accounts", durationLabel: "1.5h", done: false },
      { activity: "practice", label: "Audit — SA 700 MCQs", paper: "audit", durationLabel: "1h", done: false },
    ],
    week: [1, 0, 2, 0.5, 1, 0, 0.5],
    friends: FRIENDS,
  },

  onpace: {
    clock: "18:24",
    greeting: "Good evening",
    name: "Aditya",
    daysToAttempt: 68,
    attemptLabel: "CA Inter · Nov 2026",
    daysToPaper: 12,
    paperName: "Cost & Management",
    paperCategory: "costing",
    pace: { status: "onPace", dayDelta: 0 },
    reframe: "On pace. Hold the rhythm — one more block clears today's target.",
    targetHours: 8,
    doneHours: 3.2,
    situation: "articleship",
    situationLabel: "Articleship · 8h target",
    ctaTitle: "Continue — Accounting Process",
    ctaSub: "~2h to finish the chapter",
    ctaPaperId: "fnd-p1",
    ctaChapterId: "fnd-p1-c2",
    ctaActivityType: "concept",
    alert: {
      text: "Business Laws untouched for 5 days",
      sub: "A short revision keeps it warm.",
      action: "Add 1h",
      tone: "amber",
      paperId: "fnd-p2",
      chapterId: "fnd-p2-c2",
      activityType: "revision",
      durationMinutes: 60,
    },
    streakCount: 9,
    blocks: [
      { activity: "practice", label: "FR — question practice", paper: "accounts", durationLabel: "1.5h", done: true },
      { activity: "concept", label: "Costing — Process costing", paper: "costing", durationLabel: "2h", done: false },
      { activity: "revision", label: "Law — revision round 2", paper: "law", durationLabel: "1h", done: false },
    ],
    week: [3, 4, 2.5, 5, 3, 4, 3.2],
    friends: FRIENDS,
  },

  ahead: {
    clock: "21:10",
    greeting: "Good evening",
    name: "Aditya",
    daysToAttempt: 96,
    attemptLabel: "CA Final · Nov 2026",
    daysToPaper: 20,
    paperName: "Financial Reporting",
    paperCategory: "accounts",
    pace: { status: "ahead", dayDelta: 4 },
    reframe:
      "Ahead by 4 days. Bank it — keep the momentum, don't coast into a false sense of safety.",
    targetHours: 8,
    doneHours: 5.6,
    situation: "studyLeave",
    situationLabel: "Study leave · 8h target",
    ctaTitle: "Start today's session — Business Economics",
    ctaSub: "Lecture + MCQ practice",
    ctaPaperId: "fnd-p4",
    ctaChapterId: "fnd-p4-c2",
    ctaActivityType: "lecture",
    alert: null,
    streakCount: 23,
    blocks: [
      { activity: "concept", label: "FR — Ind AS 116 Leases", paper: "accounts", durationLabel: "2h", done: true },
      { activity: "revision", label: "Costing — final revision", paper: "costing", durationLabel: "1.5h", done: true },
      { activity: "lecture", label: "Audit — lecture 14", paper: "audit", durationLabel: "1h", done: false },
    ],
    week: [6, 5.5, 7, 6, 8, 5, 5.6],
    friends: FRIENDS,
  },
};
