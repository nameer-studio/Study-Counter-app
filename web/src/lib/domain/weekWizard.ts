import type { PaperSeed } from "@/lib/icai/foundation";
import type { RevisionRound } from "@/lib/domain/types";
import type { LoggedSession } from "@/lib/domain/loggedSession";

/**
 * D5 Plan-your-week wizard's distribution engine — splits a day's available hours
 * across papers weighted by (a) how much ICAI-weighted syllabus is still outstanding in
 * that paper and (b) how neglected it's been, so the auto-generated table actually
 * points at what needs attention rather than splitting hours evenly by paper count.
 */

export interface PaperWeight {
  paperId: string;
  weight: number;
}

const NEGLECT_CAP_DAYS = 14;
const MAX_NEGLECT_BONUS = 1.5; // an untouched paper can weigh up to 2.5x its base weightage

/** Remaining ICAI weightage (as a 0..100-ish sum) across chapters not yet at final
 *  revision — a paper close to done contributes little, however many chapters it has. */
function remainingWeightage(paper: PaperSeed, rounds: Record<string, RevisionRound>): number {
  return paper.chapters
    .filter((c) => (rounds[c.id] ?? "notStarted") !== "finalRevision")
    .reduce((sum, c) => sum + c.weightage, 0);
}

function daysSinceLastStudied(paperId: string, sessions: LoggedSession[], now: number): number | null {
  const own = sessions.filter((s) => s.paperId === paperId);
  if (own.length === 0) return null;
  return Math.floor((now - Math.max(...own.map((s) => s.endedAt))) / 86_400_000);
}

export function computePaperWeights(
  papers: PaperSeed[],
  rounds: Record<string, RevisionRound>,
  sessions: LoggedSession[],
  now: number = Date.now(),
): PaperWeight[] {
  const raw = papers.map((paper) => {
    const remaining = remainingWeightage(paper, rounds);
    const daysSince = daysSinceLastStudied(paper.id, sessions, now);
    const neglectBonus =
      daysSince === null
        ? MAX_NEGLECT_BONUS
        : Math.min(MAX_NEGLECT_BONUS, (daysSince / NEGLECT_CAP_DAYS) * MAX_NEGLECT_BONUS);
    return { paperId: paper.id, raw: remaining * (1 + neglectBonus) };
  });

  const total = raw.reduce((s, r) => s + r.raw, 0);
  if (total <= 0) {
    // Nothing outstanding anywhere (or no data yet) — split evenly rather than divide by
    // zero into a table of NaNs.
    const even = 1 / papers.length;
    return raw.map((r) => ({ paperId: r.paperId, weight: even }));
  }
  return raw.map((r) => ({ paperId: r.paperId, weight: r.raw / total }));
}

export type WeekTable = Record<string, number[]>; // paperId -> 7 hour values, Mon..Sun
export type LockTable = Record<string, boolean[]>; // paperId -> 7 lock flags

/** Distributes each day's hours across papers by weight, rounded to the nearest
 *  quarter-hour so cells read as usable block lengths rather than raw decimals. */
export function distributeWeek(weights: PaperWeight[], hoursPerDay: number[]): WeekTable {
  const table: WeekTable = {};
  for (const w of weights) table[w.paperId] = new Array(7).fill(0);

  for (let day = 0; day < 7; day++) {
    const dayHours = hoursPerDay[day] ?? 0;
    for (const w of weights) {
      table[w.paperId][day] = roundQuarter(dayHours * w.weight);
    }
  }
  return table;
}

/** Recalculates only the unlocked cells for each day, holding locked cells fixed and
 *  splitting whatever's left of that day's target hours among the unlocked papers by
 *  their relative weight. */
export function recalculateUnlocked(
  weights: PaperWeight[],
  hoursPerDay: number[],
  current: WeekTable,
  locks: LockTable,
): WeekTable {
  const next: WeekTable = {};
  for (const w of weights) next[w.paperId] = [...current[w.paperId]];

  for (let day = 0; day < 7; day++) {
    const dayHours = hoursPerDay[day] ?? 0;
    const lockedTotal = weights.reduce((s, w) => s + (locks[w.paperId]?.[day] ? current[w.paperId][day] : 0), 0);
    const remaining = Math.max(0, dayHours - lockedTotal);
    const unlockedWeightSum = weights.reduce((s, w) => s + (locks[w.paperId]?.[day] ? 0 : w.weight), 0);

    for (const w of weights) {
      if (locks[w.paperId]?.[day]) continue; // held fixed
      next[w.paperId][day] = unlockedWeightSum > 0 ? roundQuarter((remaining * w.weight) / unlockedWeightSum) : 0;
    }
  }
  return next;
}

function roundQuarter(hours: number): number {
  return Math.round(hours * 4) / 4;
}

export function weekTableTotal(table: WeekTable): number {
  return Object.values(table).reduce((sum, row) => sum + row.reduce((s, h) => s + h, 0), 0);
}
