import type { LoggedSession } from "@/lib/domain/loggedSession";
import type { PaperSeed } from "@/lib/icai/foundation";
import { revisionRoundIndex, type RevisionRound, PAPER_CATEGORY_COLOR_VAR } from "@/lib/domain/types";
import { daysUntilExam, type Attempt } from "@/lib/domain/attempt";
import { isoDate } from "@/lib/domain/week";

/**
 * E4 Attempt-readiness engine — the burn-down, burn-up, per-paper readiness and
 * required-effort maths. Mirrors what `PaceCalculator` / `PassProjector` do in the
 * Kotlin domain layer (PLAN.md §6), kept as pure functions so the two clients can be
 * diffed against each other: a student must never see "10 days late" on the web and a
 * different number on their phone.
 *
 * ## Two modelling decisions worth knowing
 *
 * **Progress is weighted by revision round, not a binary done/not-done.** A chapter at
 * 2nd revision is 75% cleared (3 of 4 transitions), so counting it as fully remaining
 * would badly understate a student mid-revision. `chapterProgress` is the one place
 * that ratio is defined.
 *
 * **The historical "actual" line is an approximation.** Revision rounds are stored as
 * current state only — there are no per-round timestamps — so past progress cannot be
 * reconstructed exactly. It is inferred by distributing today's completion across
 * history in proportion to hours logged each day. `isApproximateHistory` flags this so
 * the UI can say so rather than implying precision it doesn't have. Storing a
 * round-changed timestamp is the real fix and belongs with the Phase 2 data layer.
 */

/** 0..1 completion for a single chapter, from its revision round. */
export function chapterProgress(round: RevisionRound): number {
  return revisionRoundIndex(round) / 4;
}

export interface BurnDownPoint {
  /** Days from the start of the tracked window. */
  dayOffset: number;
  remaining: number;
}

export interface BurnDownModel {
  totalChapters: number;
  completedNow: number;
  remainingNow: number;
  todayOffset: number;
  examOffset: number;
  /** Right edge of the chart — exam day, or the projected finish if that's later. */
  horizonOffset: number;
  actual: BurnDownPoint[];
  ideal: [BurnDownPoint, BurnDownPoint];
  projected: [BurnDownPoint, BurnDownPoint] | null;
  recovery: [BurnDownPoint, BurnDownPoint] | null;
  projectedFinishOffset: number | null;
  /** Positive = finishes this many days AFTER the exam. Null when no pace yet. */
  overshootDays: number | null;
  chaptersPerDayNow: number;
  chaptersPerDayRequired: number;
  isApproximateHistory: boolean;
  /**
   * False when there's too little recorded chapter progress to forecast from — e.g. a
   * student who logs hours faithfully but never ticks revision rounds. Dividing by that
   * near-zero rate yields a technically-correct but absurd figure ("finishes in 1,528
   * days"), which is worse than useless: it's alarming and wrong. When this is false the
   * UI must say the data is incomplete instead of showing a projection.
   */
  isProjectionReliable: boolean;
}

/** Below this much recorded completion, a pace forecast is noise, not signal. */
const MIN_CHAPTERS_FOR_PROJECTION = 1;
/** A forecast stretching beyond this multiple of the exam horizon is not worth drawing. */
const MAX_PROJECTION_HORIZON_MULTIPLE = 3;

function dailyHourTotals(sessions: LoggedSession[]): Map<string, number> {
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    const key = isoDate(new Date(s.endedAt));
    byDay.set(key, (byDay.get(key) ?? 0) + s.durationMs / 3_600_000);
  }
  return byDay;
}

export function buildBurnDown(
  papers: PaperSeed[],
  rounds: Record<string, RevisionRound>,
  sessions: LoggedSession[],
  attempt: Attempt,
  now: Date = new Date(),
): BurnDownModel {
  const chapters = papers.flatMap((p) => p.chapters);
  const totalChapters = chapters.length;
  const completedNow = chapters.reduce(
    (sum, c) => sum + chapterProgress(rounds[c.id] ?? "notStarted"),
    0,
  );
  const remainingNow = Math.max(0, totalChapters - completedNow);

  // Window starts at the first logged session, or 30 days back when there's no history.
  const earliest = sessions.length > 0 ? Math.min(...sessions.map((s) => s.endedAt)) : now.getTime() - 30 * 86_400_000;
  const startDate = new Date(earliest);
  startDate.setHours(0, 0, 0, 0);

  const todayOffset = Math.max(1, Math.round((now.getTime() - startDate.getTime()) / 86_400_000));
  const daysLeft = daysUntilExam(attempt, now);
  const examOffset = todayOffset + Math.max(0, daysLeft);

  // ---- Actual line (approximate; see file header) ----
  const byDay = dailyHourTotals(sessions);
  const totalHours = Array.from(byDay.values()).reduce((a, b) => a + b, 0);
  const actual: BurnDownPoint[] = [];
  let cumulativeHours = 0;
  // Starts at offset 0 (== startDate itself) so hours logged on the very first tracked
  // day aren't silently dropped from the cumulative share — a prior off-by-one here
  // undercounted every "hours logged" figure derived from this loop.
  for (let offset = 0; offset <= todayOffset; offset++) {
    const d = new Date(startDate.getTime() + offset * 86_400_000);
    cumulativeHours += byDay.get(isoDate(d)) ?? 0;
    const share = totalHours > 0 ? cumulativeHours / totalHours : 0;
    actual.push({ dayOffset: offset, remaining: totalChapters - completedNow * share });
  }

  // ---- Ideal pace: whole syllabus cleared exactly by exam day ----
  const ideal: [BurnDownPoint, BurnDownPoint] = [
    { dayOffset: 0, remaining: totalChapters },
    { dayOffset: examOffset, remaining: 0 },
  ];

  // ---- Current pace, projection, and the recovery line ----
  const chaptersPerDayNow = todayOffset > 0 ? completedNow / todayOffset : 0;
  const chaptersPerDayRequired = daysLeft > 0 ? remainingNow / daysLeft : Infinity;

  let projected: BurnDownModel["projected"] = null;
  let projectedFinishOffset: number | null = null;
  let overshootDays: number | null = null;

  const hasEnoughProgress = completedNow >= MIN_CHAPTERS_FOR_PROJECTION && chaptersPerDayNow > 0;
  let isProjectionReliable = false;

  if (hasEnoughProgress && remainingNow > 0) {
    const daysNeeded = remainingNow / chaptersPerDayNow;
    const finish = todayOffset + daysNeeded;
    // Reject forecasts that run so far past the exam they'd squash the chart and tell
    // the student nothing they can act on.
    if (finish <= examOffset * MAX_PROJECTION_HORIZON_MULTIPLE) {
      isProjectionReliable = true;
      projectedFinishOffset = finish;
      overshootDays = Math.round(finish - examOffset);
      projected = [
        { dayOffset: todayOffset, remaining: remainingNow },
        { dayOffset: finish, remaining: 0 },
      ];
    }
  } else if (remainingNow <= 0) {
    // Syllabus already cleared — nothing to project, and that's a reliable answer.
    isProjectionReliable = true;
  }

  // The calm answer: a straight line from where you are to zero on exam day. Shown
  // whenever there's ground left to cover and the current pace isn't already closing it.
  const recovery: BurnDownModel["recovery"] =
    daysLeft > 0 && remainingNow > 0 && (overshootDays === null || overshootDays > 0)
      ? [
          { dayOffset: todayOffset, remaining: remainingNow },
          { dayOffset: examOffset, remaining: 0 },
        ]
      : null;

  const horizonOffset = Math.max(examOffset, projectedFinishOffset ?? examOffset) * 1.02;

  return {
    totalChapters,
    completedNow,
    remainingNow,
    todayOffset,
    examOffset,
    horizonOffset,
    actual,
    ideal,
    projected,
    recovery,
    projectedFinishOffset,
    overshootDays,
    chaptersPerDayNow,
    chaptersPerDayRequired,
    isApproximateHistory: true,
    isProjectionReliable,
  };
}

export interface BurnUpModel {
  /** Total estimated hours for the whole syllabus — the plan line. */
  targetHours: number;
  actual: { dayOffset: number; hours: number }[];
  todayHours: number;
  todayOffset: number;
  examOffset: number;
  horizonOffset: number;
}

export function buildBurnUp(
  papers: PaperSeed[],
  sessions: LoggedSession[],
  attempt: Attempt,
  now: Date = new Date(),
): BurnUpModel {
  const targetHours = papers.flatMap((p) => p.chapters).reduce((sum, c) => sum + c.estHours, 0);

  const earliest = sessions.length > 0 ? Math.min(...sessions.map((s) => s.endedAt)) : now.getTime() - 30 * 86_400_000;
  const startDate = new Date(earliest);
  startDate.setHours(0, 0, 0, 0);

  const todayOffset = Math.max(1, Math.round((now.getTime() - startDate.getTime()) / 86_400_000));
  const examOffset = todayOffset + Math.max(0, daysUntilExam(attempt, now));

  const byDay = dailyHourTotals(sessions);
  const actual: { dayOffset: number; hours: number }[] = [];
  let cumulative = 0;
  // See buildBurnDown above — start at offset 0 so the first tracked day's hours count.
  for (let offset = 0; offset <= todayOffset; offset++) {
    const d = new Date(startDate.getTime() + offset * 86_400_000);
    cumulative += byDay.get(isoDate(d)) ?? 0;
    actual.push({ dayOffset: offset, hours: cumulative });
  }

  return {
    targetHours,
    actual,
    todayHours: cumulative,
    todayOffset,
    examOffset,
    horizonOffset: examOffset * 1.02,
  };
}

export interface PaperReadiness {
  paperId: string;
  paperNo: number;
  name: string;
  shortName: string;
  percent: number;
  color: string;
}

export function paperReadiness(
  papers: PaperSeed[],
  rounds: Record<string, RevisionRound>,
): PaperReadiness[] {
  return papers.map((paper) => {
    const total = paper.chapters.length;
    const done = paper.chapters.reduce(
      (sum, c) => sum + chapterProgress(rounds[c.id] ?? "notStarted"),
      0,
    );
    return {
      paperId: paper.id,
      paperNo: paper.paperNo,
      name: paper.name,
      shortName: `P${paper.paperNo}`,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
      color: PAPER_CATEGORY_COLOR_VAR[paper.category],
    };
  });
}

export function weakestPaper(readiness: PaperReadiness[]): PaperReadiness | null {
  if (readiness.length === 0) return null;
  return readiness.reduce((min, r) => (r.percent < min.percent ? r : min));
}

export interface RequiredEffort {
  remainingEstHours: number;
  daysLeft: number;
  requiredHoursPerDay: number;
  currentAvgHoursPerDay: number;
  /** True when the required rate exceeds what a person can plausibly sustain. */
  isUnrealistic: boolean;
}

export function requiredEffort(
  papers: PaperSeed[],
  rounds: Record<string, RevisionRound>,
  sessions: LoggedSession[],
  attempt: Attempt,
  now: Date = new Date(),
): RequiredEffort {
  // Remaining hours are pro-rated by how far each chapter already is, so a chapter at
  // 2nd revision only carries its last quarter of estimated effort.
  const remainingEstHours = papers
    .flatMap((p) => p.chapters)
    .reduce((sum, c) => sum + c.estHours * (1 - chapterProgress(rounds[c.id] ?? "notStarted")), 0);

  const daysLeft = Math.max(0, daysUntilExam(attempt, now));

  const byDay = dailyHourTotals(sessions);
  const totalHours = Array.from(byDay.values()).reduce((a, b) => a + b, 0);
  const earliest = sessions.length > 0 ? Math.min(...sessions.map((s) => s.endedAt)) : now.getTime();
  const daysElapsed = Math.max(1, Math.round((now.getTime() - earliest) / 86_400_000));
  const currentAvgHoursPerDay = totalHours / daysElapsed;

  const requiredHoursPerDay = daysLeft > 0 ? remainingEstHours / daysLeft : Infinity;

  return {
    remainingEstHours,
    daysLeft,
    requiredHoursPerDay,
    currentAvgHoursPerDay,
    isUnrealistic: requiredHoursPerDay > 14,
  };
}
