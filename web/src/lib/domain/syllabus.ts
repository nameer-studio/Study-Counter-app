import type { PaperSeed } from "@/lib/icai/foundation";
import { revisionRoundIndex, type RevisionRound } from "@/lib/domain/types";

/** Per-paper progress, driven by wherever each chapter's revision round currently sits.
 *  "% revised" on the D7 paper header card = chapters at FinalRevision ÷ total. */
export function paperProgress(
  paper: PaperSeed,
  roundsByChapterId: Record<string, RevisionRound>,
): { completed: number; total: number; percent: number } {
  const total = paper.chapters.length;
  const completed = paper.chapters.filter(
    (c) => roundsByChapterId[c.id] === "finalRevision",
  ).length;
  return { completed, total, percent: total > 0 ? completed / total : 0 };
}

/** Weighted-average revision progress across all four fillable rounds (0..1), used for
 *  the paper card's progress bar — a chapter mid-revision still counts partial credit,
 *  unlike [paperProgress] which only counts fully-finished chapters. */
export function paperWeightedProgress(
  paper: PaperSeed,
  roundsByChapterId: Record<string, RevisionRound>,
): number {
  if (paper.chapters.length === 0) return 0;
  const sum = paper.chapters.reduce((acc, c) => {
    const round = roundsByChapterId[c.id] ?? "notStarted";
    return acc + revisionRoundIndex(round) / 4;
  }, 0);
  return sum / paper.chapters.length;
}
