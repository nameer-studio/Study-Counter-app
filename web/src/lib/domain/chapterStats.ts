import type { LoggedSession } from "@/lib/domain/loggedSession";
import type { PaperSeed } from "@/lib/icai/foundation";
import { REVISION_ROUNDS, revisionRoundIndex, type RevisionRound } from "@/lib/domain/types";

/**
 * E2 Paper-detail aggregations (charts 6–9). Per-chapter rollups over the same
 * `LoggedSession[]` everything else reads, so E1's paper totals and E2's chapter
 * totals are guaranteed to reconcile.
 */

export type ConfidenceMap = Record<string, number>; // chapterId -> 1..5

/** The chapter a paper should be studied at next — first one not yet at final
 *  revision, or its first chapter if everything's finished (nothing left to suggest but
 *  revisiting). Shared by the Dashboard's Start CTA and the week wizard's auto-schedule
 *  so "what's next" is answered the same way in both places. */
export function nextChapterToStudy(
  paper: PaperSeed,
  rounds: Record<string, RevisionRound>,
) {
  return (
    paper.chapters.find((c) => (rounds[c.id] ?? "notStarted") !== "finalRevision") ?? paper.chapters[0]
  );
}

/** Chart 06 buckets, exactly as the design legends them. */
export interface CompletionBreakdown {
  finalRev: number;
  inRevision: number; // 1st or 2nd revision
  firstReading: number;
  notStarted: number;
  total: number;
}

export function completionBreakdown(
  paper: PaperSeed,
  rounds: Record<string, RevisionRound>,
): CompletionBreakdown {
  const counts: CompletionBreakdown = {
    finalRev: 0,
    inRevision: 0,
    firstReading: 0,
    notStarted: 0,
    total: paper.chapters.length,
  };
  for (const chapter of paper.chapters) {
    switch (rounds[chapter.id] ?? "notStarted") {
      case "finalRevision":
        counts.finalRev += 1;
        break;
      case "secondRevision":
      case "firstRevision":
        counts.inRevision += 1;
        break;
      case "firstReading":
        counts.firstReading += 1;
        break;
      default:
        counts.notStarted += 1;
    }
  }
  return counts;
}

export interface RoundCoverage {
  round: RevisionRound;
  name: string;
  percent: number;
  color: string;
}

/**
 * Chart 07 — cumulative coverage: what share of the paper's chapters have reached
 * *at least* each round. Cumulative (not per-bucket) is the reading that matters,
 * because "80% have had a first reading but only 10% have had a second revision" is
 * the sentence a CA student actually needs before an attempt.
 */
export function revisionRoundCoverage(
  paper: PaperSeed,
  rounds: Record<string, RevisionRound>,
): RoundCoverage[] {
  const total = paper.chapters.length;
  const labels: Record<string, string> = {
    firstReading: "1st reading",
    firstRevision: "1st revision",
    secondRevision: "2nd revision",
    finalRevision: "Final revision",
  };
  const colors: Record<string, string> = {
    firstReading: "var(--amber)",
    firstRevision: "var(--primary)",
    secondRevision: "var(--paper-costing)",
    finalRevision: "var(--green)",
  };

  return REVISION_ROUNDS.filter((r) => r !== "notStarted").map((round) => {
    const threshold = revisionRoundIndex(round);
    const reached = paper.chapters.filter(
      (c) => revisionRoundIndex(rounds[c.id] ?? "notStarted") >= threshold,
    ).length;
    return {
      round,
      name: labels[round],
      percent: total > 0 ? Math.round((reached / total) * 100) : 0,
      color: colors[round],
    };
  });
}

export interface ChapterTime {
  chapterId: string;
  name: string;
  hours: number;
  sessionCount: number;
}

/** Charts 08 + 09 base — time and session count per chapter, descending by time. */
export function chapterTimes(
  paper: PaperSeed,
  sessions: LoggedSession[],
): ChapterTime[] {
  const paperSessions = sessions.filter((s) => s.paperId === paper.id);
  return paper.chapters
    .map((chapter) => {
      const own = paperSessions.filter((s) => s.chapterId === chapter.id);
      return {
        chapterId: chapter.id,
        name: chapter.name,
        hours: own.reduce((sum, s) => sum + s.durationMs, 0) / 3_600_000,
        sessionCount: own.length,
      };
    })
    .sort((a, b) => b.hours - a.hours);
}

export interface ScatterPoint {
  chapterId: string;
  name: string;
  hours: number;
  confidence: number;
  sessionCount: number;
}

/**
 * Chart 08 — only chapters with BOTH time logged and an explicit confidence rating.
 * Deliberately does not invent a confidence value from the revision round: that would
 * make confidence a pure function of progress, and the whole point of this chart is to
 * surface chapters where those two things *disagree* (lots of hours, still shaky).
 */
export function confidenceVsTime(
  paper: PaperSeed,
  sessions: LoggedSession[],
  confidence: ConfidenceMap,
): ScatterPoint[] {
  return chapterTimes(paper, sessions)
    .filter((c) => c.hours > 0 && confidence[c.chapterId] !== undefined)
    .map((c) => ({
      chapterId: c.chapterId,
      name: c.name,
      hours: c.hours,
      confidence: confidence[c.chapterId],
      sessionCount: c.sessionCount,
    }));
}

/** How many chapters in this paper still need a confidence rating before chart 08
 *  can say anything useful. */
export function unratedChapterCount(
  paper: PaperSeed,
  sessions: LoggedSession[],
  confidence: ConfidenceMap,
): number {
  return chapterTimes(paper, sessions).filter(
    (c) => c.hours > 0 && confidence[c.chapterId] === undefined,
  ).length;
}

export function paperHours(paper: PaperSeed, sessions: LoggedSession[]): number {
  return sessions
    .filter((s) => s.paperId === paper.id)
    .reduce((sum, s) => sum + s.durationMs, 0) / 3_600_000;
}
