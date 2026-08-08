import type { LoggedSession } from "@/lib/domain/loggedSession";
import { FOUNDATION_PAPERS } from "@/lib/icai/foundation";
import { REVISION_ROUNDS, type RevisionRound } from "@/lib/domain/types";
import { generateDemoSessions } from "@/lib/demo/seedSessions";

/**
 * Derives first-run revision rounds from the seeded session history, so the demo tells
 * one coherent story: chapters with more hours behind them sit further along. Seeding
 * rounds independently of sessions produced a contradictory dataset — dozens of hours
 * logged against almost no recorded progress — which made the burn-down's pace forecast
 * meaningless.
 *
 * [sessions] defaults to a freshly generated set rather than being read from the
 * sessions store: both stores hydrate in the same render pass, so reading the store here
 * would see an empty array and silently seed nothing. `generateDemoSessions` is
 * deterministic (fixed-seed PRNG), so the locally generated set has identical
 * chapter/hour distribution to the one actually persisted.
 *
 * Only ever used to populate an empty store; a real student's own rounds are never touched.
 */
export function generateDemoRounds(
  sessions: LoggedSession[] = generateDemoSessions(),
): Record<string, RevisionRound> {
  const hoursByChapter = new Map<string, number>();
  for (const s of sessions) {
    hoursByChapter.set(
      s.chapterId,
      (hoursByChapter.get(s.chapterId) ?? 0) + s.durationMs / 3_600_000,
    );
  }

  const rounds: Record<string, RevisionRound> = {};
  for (const paper of FOUNDATION_PAPERS) {
    for (const chapter of paper.chapters) {
      const hours = hoursByChapter.get(chapter.id) ?? 0;
      if (hours <= 0) continue;
      // Roughly: each ~40% of a chapter's estimated hours advances it one round.
      const ratio = chapter.estHours > 0 ? hours / (chapter.estHours * 0.4) : 0;
      const index = Math.min(REVISION_ROUNDS.length - 1, Math.max(1, Math.round(ratio)));
      rounds[chapter.id] = REVISION_ROUNDS[index];
    }
  }
  return rounds;
}
