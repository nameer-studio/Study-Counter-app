import { FOUNDATION_PAPERS } from "@/lib/icai/foundation";
import { ACTIVITY_TYPES } from "@/lib/domain/types";
import { newSessionId, type LoggedSession } from "@/lib/domain/loggedSession";

/**
 * First-run sample history so the stats charts have something real to render before a
 * student has logged their own sessions — generated through the exact same
 * `LoggedSession` shape the Timer writes, not a separate hardcoded chart dataset. Only
 * ever used to seed `sc-logged-sessions` when it's empty; once a student logs a real
 * session, this has no further effect. Deterministic (seeded PRNG) so the shape looks
 * the same across reloads until real data arrives.
 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateDemoSessions(now: number = Date.now()): LoggedSession[] {
  const rand = mulberry32(20260726);
  const sessions: LoggedSession[] = [];

  for (let dayOffset = 83; dayOffset >= 0; dayOffset--) {
    // Roughly 70% of days have activity, a bit sparser on weekends.
    const date = new Date(now - dayOffset * 86_400_000);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const studyChance = isWeekend ? 0.45 : 0.75;
    if (rand() > studyChance) continue;

    const sessionsToday = 1 + Math.floor(rand() * 2);
    for (let n = 0; n < sessionsToday; n++) {
      const paper = FOUNDATION_PAPERS[Math.floor(rand() * FOUNDATION_PAPERS.length)];
      const chapter = paper.chapters[Math.floor(rand() * paper.chapters.length)];
      const activityType = ACTIVITY_TYPES[Math.floor(rand() * ACTIVITY_TYPES.length)];
      const durationMinutes = 30 + Math.floor(rand() * 6) * 15; // 30..120min
      const endedAt = date.getTime() - Math.floor(rand() * 6) * 3_600_000;
      sessions.push({
        id: newSessionId(),
        paperId: paper.id,
        chapterId: chapter.id,
        activityType,
        durationMs: durationMinutes * 60_000,
        endedAt,
      });
    }
  }

  return sessions.sort((a, b) => a.endedAt - b.endedAt);
}
