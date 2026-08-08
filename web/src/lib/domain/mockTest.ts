/**
 * Mock-test results. Shared by E4's aggregate-projection gauge and E5's marks trend, so
 * the two screens can never disagree about whether a student is on track to pass.
 *
 * Locked ICAI pass rule: **40 marks minimum in every paper AND 50% aggregate across the
 * group**. Both thresholds are hard gates — clearing the aggregate while failing one
 * paper is still a fail, which is exactly why `projectPass` reports them separately
 * rather than collapsing to one number.
 */

export const PASS_MARKS_PER_PAPER = 40;
export const PASS_AGGREGATE_PERCENT = 50;

export type MockSource = "MTP" | "RTP" | "PYQ" | "TEST_SERIES" | "SELF";

export interface MockTest {
  id: string;
  paperId: string;
  /** epoch ms */
  date: number;
  marksObtained: number;
  maxMarks: number;
  source: MockSource;
  /** Objective papers only (Foundation P3/P4) — enables negative-marking analysis. */
  correctCount?: number;
  wrongCount?: number;
  unattemptedCount?: number;
}

export function newMockId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Most recent mock per paper — the fairest single basis for a projection, since an
 *  average would drag a improving student down by their earliest attempts. */
export function latestMockByPaper(mocks: MockTest[]): Map<string, MockTest> {
  const latest = new Map<string, MockTest>();
  for (const mock of mocks) {
    const existing = latest.get(mock.paperId);
    if (!existing || mock.date > existing.date) latest.set(mock.paperId, mock);
  }
  return latest;
}

export interface PassProjection {
  /** Aggregate % across papers that have at least one mock. Null when none logged. */
  aggregatePercent: number | null;
  aggregateClears: boolean;
  /** Papers scoring under 40 — each one is an independent fail. */
  papersUnderMinimum: { paperId: string; marks: number }[];
  papersCounted: number;
  clearsOverall: boolean;
}

export function projectPass(mocks: MockTest[]): PassProjection {
  const latest = latestMockByPaper(mocks);
  if (latest.size === 0) {
    return {
      aggregatePercent: null,
      aggregateClears: false,
      papersUnderMinimum: [],
      papersCounted: 0,
      clearsOverall: false,
    };
  }

  let obtained = 0;
  let max = 0;
  const under: { paperId: string; marks: number }[] = [];

  for (const mock of latest.values()) {
    obtained += mock.marksObtained;
    max += mock.maxMarks;
    if (mock.marksObtained < PASS_MARKS_PER_PAPER) {
      under.push({ paperId: mock.paperId, marks: mock.marksObtained });
    }
  }

  const aggregatePercent = max > 0 ? (obtained / max) * 100 : 0;
  const aggregateClears = aggregatePercent >= PASS_AGGREGATE_PERCENT;

  return {
    aggregatePercent,
    aggregateClears,
    papersUnderMinimum: under,
    papersCounted: latest.size,
    // Both gates, not either — see the pass rule in this file's header.
    clearsOverall: aggregateClears && under.length === 0,
  };
}

/** Net marks after negative marking, for objective papers. */
export function netMarksAfterNegative(
  mock: MockTest,
  markPerCorrect: number,
  penaltyPerWrong: number,
): number | null {
  if (mock.correctCount === undefined || mock.wrongCount === undefined) return null;
  return mock.correctCount * markPerCorrect - mock.wrongCount * penaltyPerWrong;
}
