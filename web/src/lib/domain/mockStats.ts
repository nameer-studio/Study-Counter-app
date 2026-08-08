import type { PaperSeed } from "@/lib/icai/foundation";
import { ALL_PAPERS, paperById } from "@/lib/icai/levels";
import { PAPER_CATEGORY_COLOR_VAR } from "@/lib/domain/types";
import {
  PASS_MARKS_PER_PAPER,
  latestMockByPaper,
  type MockTest,
} from "@/lib/domain/mockTest";

/** E5 aggregations — the marks trend, MCQ/negative-marking analysis, and the exemption
 *  tracker. Shares `MockTest` with E4's projection gauge, so the two screens can never
 *  disagree about whether a student is passing. */

export interface MockSeries {
  paperId: string;
  name: string;
  color: string;
  points: { date: number; marks: number }[];
}

export function mockSeries(mocks: MockTest[]): MockSeries[] {
  // All levels — papers with no logged mocks are dropped below, so only papers the
  // student actually sat a mock for appear, whichever level they're registered at.
  return ALL_PAPERS.map((paper) => ({
    paperId: paper.id,
    name: paper.name,
    color: PAPER_CATEGORY_COLOR_VAR[paper.category],
    points: mocks
      .filter((m) => m.paperId === paper.id)
      .sort((a, b) => a.date - b.date)
      .map((m) => ({ date: m.date, marks: m.marksObtained })),
  })).filter((s) => s.points.length > 0);
}

export interface McqAnalysis {
  paperId: string;
  paperName: string;
  /** Correct ÷ attempted. */
  accuracy: number;
  correct: number;
  wrong: number;
  unattempted: number;
  marksLostToNegatives: number;
  /** Marks the student would have kept by leaving the wrong ones blank. */
  marksRecoverableBySkipping: number;
  date: number;
}

/**
 * Negative-marking analysis for the most recent mock on each objective paper
 * (Foundation P3/P4 only). This is the CA-specific signal nothing else surfaces: a
 * student who guesses freely is bleeding marks invisibly, because the raw score alone
 * never shows what the guessing cost.
 */
export function mcqAnalysis(mocks: MockTest[]): McqAnalysis[] {
  const latest = latestMockByPaper(mocks);
  const out: McqAnalysis[] = [];

  for (const paper of ALL_PAPERS) {
    if (!paper.isObjective || !paper.hasNegativeMarking) continue;
    const mock = latest.get(paper.id);
    if (!mock || mock.correctCount === undefined || mock.wrongCount === undefined) continue;

    const penalty = paper.negativeMarkPerWrong ?? 0.25;
    const attempted = mock.correctCount + mock.wrongCount;
    const marksLost = mock.wrongCount * penalty;

    out.push({
      paperId: paper.id,
      paperName: paper.name,
      accuracy: attempted > 0 ? mock.correctCount / attempted : 0,
      correct: mock.correctCount,
      wrong: mock.wrongCount,
      unattempted: mock.unattemptedCount ?? 0,
      marksLostToNegatives: marksLost,
      // Skipping a wrong answer forfeits nothing and avoids the penalty, so the whole
      // deduction is recoverable.
      marksRecoverableBySkipping: marksLost,
      date: mock.date,
    });
  }

  return out;
}

export interface ExemptionStatus {
  paperId: string;
  name: string;
  color: string;
  bestMarks: number | null;
  /** ICAI grants an exemption at 60+ in an actual attempt. Mocks only indicate it. */
  qualifiesOnMocks: boolean;
  clearsMinimum: boolean;
}

/**
 * Exemption tracker. Foundation itself has no exemption scheme — this reads as an
 * "on track for 60+" indicator, and becomes a real carry-forward tracker at Inter/Final
 * where exemptions actually exist. Deliberately labelled as mock-based, never as a
 * granted exemption.
 */
export function exemptionStatus(mocks: MockTest[], papers: PaperSeed[]): ExemptionStatus[] {
  // Unlike the other aggregations here, this emits a row for every paper whether or not
  // a mock exists — so it has to be the student's own papers, not a fixed list.
  return papers.map((paper: PaperSeed) => {
    const own = mocks.filter((m) => m.paperId === paper.id);
    const best = own.length > 0 ? Math.max(...own.map((m) => m.marksObtained)) : null;
    return {
      paperId: paper.id,
      name: paper.name,
      color: PAPER_CATEGORY_COLOR_VAR[paper.category],
      bestMarks: best,
      qualifiesOnMocks: best !== null && best >= 60,
      clearsMinimum: best !== null && best >= PASS_MARKS_PER_PAPER,
    };
  });
}

export function paperNameFor(paperId: string): string {
  return paperById(paperId)?.name ?? paperId;
}

export function paperColorFor(paperId: string): string {
  const paper = paperById(paperId);
  return paper ? PAPER_CATEGORY_COLOR_VAR[paper.category] : "var(--grey)";
}
