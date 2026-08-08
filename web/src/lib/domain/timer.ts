import type { ActivityType } from "@/lib/domain/types";

/**
 * Wall-clock session state — the web equivalent of Android's foreground-Service timer
 * (WEB_PLAN.md §2.1). There is no background-tab guarantee on the web: a throttled or
 * closed tab must never lose time, so elapsed duration is ALWAYS derived from
 * timestamps (`startedAt`, `pausedAt`, `pausedTotalMs`), never accumulated by a ticking
 * counter. A `setInterval` may force a re-render every second; it must never add to a
 * running total itself. Get this backwards and a student loses a real study session
 * the moment their laptop sleeps — the single worst bug this screen could ship.
 */
export interface TimerSession {
  paperId: string;
  chapterId: string;
  activityType: ActivityType;
  startedAt: number; // epoch ms
  pausedAt: number | null; // epoch ms, or null while running
  pausedTotalMs: number; // sum of all completed pause spans
}

export function startSession(
  paperId: string,
  chapterId: string,
  activityType: ActivityType,
  now: number = Date.now(),
): TimerSession {
  return { paperId, chapterId, activityType, startedAt: now, pausedAt: null, pausedTotalMs: 0 };
}

export function pauseSession(session: TimerSession, now: number = Date.now()): TimerSession {
  if (session.pausedAt !== null) return session; // already paused
  return { ...session, pausedAt: now };
}

export function resumeSession(session: TimerSession, now: number = Date.now()): TimerSession {
  if (session.pausedAt === null) return session; // already running
  return {
    ...session,
    pausedAt: null,
    pausedTotalMs: session.pausedTotalMs + (now - session.pausedAt),
  };
}

/** The only place elapsed time is computed — always from timestamps, so a session
 *  resumed after the tab was closed for an hour is exactly as accurate as one that
 *  never left the screen. */
export function elapsedMs(session: TimerSession, now: number = Date.now()): number {
  const end = session.pausedAt ?? now;
  return Math.max(0, end - session.startedAt - session.pausedTotalMs);
}

export function isPaused(session: TimerSession): boolean {
  return session.pausedAt !== null;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
