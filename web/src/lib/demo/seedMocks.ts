import { FOUNDATION_PAPERS } from "@/lib/icai/foundation";
import { newMockId, type MockSource, type MockTest } from "@/lib/domain/mockTest";

/**
 * First-run sample mock results, so the aggregate gauge and marks trend have real data
 * before a student has sat any mocks themselves. Written through the same `MockTest`
 * shape the E5 log will use — not a separate chart dataset.
 *
 * Deliberately shaped as a *near-miss*: an improving trend that still lands just under
 * the 50% aggregate, with one paper under the 40-mark minimum. That's the state the
 * readiness screen most needs to communicate well, and a demo that always shows "you're
 * passing" would never exercise it.
 */
const SOURCES: MockSource[] = ["MTP", "RTP", "PYQ", "TEST_SERIES"];

export function generateDemoMocks(now: number = Date.now()): MockTest[] {
  const mocks: MockTest[] = [];

  // Per paper: an earlier weaker attempt, then a more recent improved one.
  const plan: { paperIndex: number; marks: number[] }[] = [
    { paperIndex: 0, marks: [42, 52] }, // Accounting — comfortable
    { paperIndex: 1, marks: [38, 47] }, // Business Laws — recovered above 40
    { paperIndex: 2, marks: [31, 36] }, // Quantitative Aptitude — still under 40
    { paperIndex: 3, marks: [44, 49] }, // Business Economics — fine
  ];

  plan.forEach(({ paperIndex, marks }) => {
    const paper = FOUNDATION_PAPERS[paperIndex];
    marks.forEach((score, attemptIndex) => {
      // Oldest ~40 days back, most recent ~8 days back.
      const daysAgo = 40 - attemptIndex * 32;
      const objective = paper.isObjective;
      const correct = objective ? Math.round(score / 1.5) : undefined;
      const wrong = objective ? Math.round((100 - score) / 4) : undefined;

      mocks.push({
        id: newMockId(),
        paperId: paper.id,
        date: now - daysAgo * 86_400_000,
        marksObtained: score,
        maxMarks: paper.maxMarks,
        source: SOURCES[(paperIndex + attemptIndex) % SOURCES.length],
        correctCount: correct,
        wrongCount: wrong,
        unattemptedCount: objective && correct !== undefined && wrong !== undefined
          ? Math.max(0, 100 - correct - wrong)
          : undefined,
      });
    });
  });

  return mocks.sort((a, b) => a.date - b.date);
}
