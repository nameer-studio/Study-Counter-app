import type { PaperSeed } from "@/lib/icai/foundation";
import { PAPER_CATEGORY_COLOR_VAR, type RevisionRound } from "@/lib/domain/types";
import type { LoggedSession } from "@/lib/domain/loggedSession";
import type { Attempt } from "@/lib/domain/attempt";
import { daysUntilExam } from "@/lib/domain/attempt";
import { completionBreakdown } from "@/lib/domain/chapterStats";
import { buildBurnDown, paperReadiness, type PaperReadiness } from "@/lib/domain/readiness";

/**
 * D4 Attempt roadmap — translates the burn-down's maths into a phase-by-phase strategic
 * view (first reading → revision 1 → revision 2 → locked final-revision window → exam
 * day), rather than reinventing scheduling logic: every number here is a reuse or
 * regrouping of the same engines E4/D7 already use (chapterStats, readiness), so this
 * screen can't disagree with Stats about where the student actually stands.
 *
 * The final-revision reservation defaults to 25% of the remaining days (PLAN.md's own
 * D4 description) and is a hard, visually locked window — chapters aren't scheduled into
 * it individually, it's blocked out as "everything gets one more pass here".
 */

export const FINAL_REVISION_SHARE = 0.25;

export interface PhasePaperCount {
  paperId: string;
  name: string;
  color: string;
  count: number;
}

export interface RoadmapPhase {
  key: "firstReading" | "revision1" | "revision2" | "finalRevision";
  label: string;
  locked: boolean;
  totalChapters: number;
  byPaper: PhasePaperCount[];
}

export interface FinalRevisionWindow {
  startOffsetDays: number; // days from today
  lengthDays: number;
  startDate: string; // ISO
  endDate: string; // ISO
}

export interface PaperPace {
  paperId: string;
  name: string;
  color: string;
  percent: number;
  idealPercent: number;
  status: "onTrack" | "behind" | "notStarted";
}

export interface RoadmapModel {
  daysLeft: number;
  finalRevisionWindow: FinalRevisionWindow | null;
  phases: RoadmapPhase[];
  perPaper: PaperPace[];
  overshootDays: number | null;
  isProjectionReliable: boolean;
}

function isoOffset(days: number, from: Date): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildRoadmap(
  papers: PaperSeed[],
  rounds: Record<string, RevisionRound>,
  sessions: LoggedSession[],
  attempt: Attempt,
  now: Date = new Date(),
): RoadmapModel {
  const daysLeft = Math.max(0, daysUntilExam(attempt, now));
  const finalRevisionDays = Math.round(daysLeft * FINAL_REVISION_SHARE);
  const studyDays = daysLeft - finalRevisionDays;

  const finalRevisionWindow: FinalRevisionWindow | null =
    daysLeft > 0
      ? {
          startOffsetDays: studyDays,
          lengthDays: finalRevisionDays,
          startDate: isoOffset(studyDays, now),
          endDate: isoOffset(daysLeft, now),
        }
      : null;

  // ---- Phases: regroup completionBreakdown per paper into one aggregate view ----
  const perPaperBreakdown = papers.map((p) => ({ paper: p, breakdown: completionBreakdown(p, rounds) }));

  const phases: RoadmapPhase[] = [
    {
      key: "firstReading",
      label: "First reading",
      locked: false,
      totalChapters: perPaperBreakdown.reduce((s, p) => s + p.breakdown.notStarted, 0),
      byPaper: perPaperBreakdown
        .map(({ paper, breakdown }) => ({ paperId: paper.id, name: paper.name, color: colorFor(paper), count: breakdown.notStarted }))
        .filter((p) => p.count > 0),
    },
    {
      key: "revision1",
      label: "Revision round 1",
      locked: false,
      totalChapters: perPaperBreakdown.reduce(
        (s, p) => s + countAtRound(papers.find((x) => x.id === p.paper.id)!, rounds, "firstReading"),
        0,
      ),
      byPaper: perPaperBreakdown
        .map(({ paper }) => ({
          paperId: paper.id,
          name: paper.name,
          color: colorFor(paper),
          count: countAtRound(paper, rounds, "firstReading"),
        }))
        .filter((p) => p.count > 0),
    },
    {
      key: "revision2",
      label: "Revision round 2",
      locked: false,
      totalChapters: perPaperBreakdown.reduce(
        (s, p) => s + countAtRound(papers.find((x) => x.id === p.paper.id)!, rounds, "firstRevision"),
        0,
      ),
      byPaper: perPaperBreakdown
        .map(({ paper }) => ({
          paperId: paper.id,
          name: paper.name,
          color: colorFor(paper),
          count: countAtRound(paper, rounds, "firstRevision"),
        }))
        .filter((p) => p.count > 0),
    },
    {
      key: "finalRevision",
      label: "Final revision",
      locked: true,
      // Every chapter gets one more pass here, not just the ones currently mid-revision —
      // that's the whole point of a reserved window.
      totalChapters: papers.reduce((s, p) => s + p.chapters.length, 0),
      byPaper: perPaperBreakdown.map(({ paper }) => ({
        paperId: paper.id,
        name: paper.name,
        color: colorFor(paper),
        count: paper.chapters.length,
      })),
    },
  ];

  // ---- Per-paper pace: actual readiness vs a straight-line "ideal by now" ----
  const readiness = paperReadiness(papers, rounds);
  const totalSpanDays = daysLeft + estimateDaysElapsed(sessions, now);
  const idealPercentByNow = totalSpanDays > 0 ? Math.min(100, Math.round((estimateDaysElapsed(sessions, now) / totalSpanDays) * 100)) : 0;

  const perPaper: PaperPace[] = readiness.map((r: PaperReadiness) => {
    const paper = papers.find((p) => p.id === r.paperId)!;
    const status: PaperPace["status"] = r.percent === 0 ? "notStarted" : r.percent + 5 >= idealPercentByNow ? "onTrack" : "behind";
    return { paperId: r.paperId, name: r.name, color: colorFor(paper), percent: r.percent, idealPercent: idealPercentByNow, status };
  });

  // ---- Overall pace, reused straight from the burn-down engine ----
  const burnDown = buildBurnDown(papers, rounds, sessions, attempt, now);

  return {
    daysLeft,
    finalRevisionWindow,
    phases,
    perPaper,
    overshootDays: burnDown.isProjectionReliable ? burnDown.overshootDays : null,
    isProjectionReliable: burnDown.isProjectionReliable,
  };
}

function countAtRound(paper: PaperSeed, rounds: Record<string, RevisionRound>, round: RevisionRound): number {
  return paper.chapters.filter((c) => (rounds[c.id] ?? "notStarted") === round).length;
}

function estimateDaysElapsed(sessions: LoggedSession[], now: Date): number {
  if (sessions.length === 0) return 1;
  const earliest = Math.min(...sessions.map((s) => s.endedAt));
  return Math.max(1, Math.round((now.getTime() - earliest) / 86_400_000));
}

function colorFor(paper: PaperSeed): string {
  return PAPER_CATEGORY_COLOR_VAR[paper.category] ?? "var(--dim)";
}
