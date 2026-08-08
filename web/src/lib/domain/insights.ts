import type { LoggedSession } from "@/lib/domain/loggedSession";
import type { PaperSeed } from "@/lib/icai/foundation";
import { ALL_PAPERS } from "@/lib/icai/levels";
import { ACTIVITY_LABEL, type ActivityType } from "@/lib/domain/types";

/**
 * E3 Insights — behavioural patterns and the plain-language findings derived from them.
 *
 * Every finding here is computed from the student's own sessions. None are hardcoded:
 * a canned "78% of your DT time is reading" that fires regardless of the data would be
 * worse than showing nothing, because a student would act on it.
 */

/** Sessions only record when they ended, so the start hour is derived. */
function startHour(session: LoggedSession): number {
  return new Date(session.endedAt - session.durationMs).getHours();
}

export interface TimeOfDayCell {
  weekday: number; // 0 = Monday
  hour: number;
  hours: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

/** Chart 10 — hour × weekday grid. Hours are bucketed to the session's start hour. */
export function timeOfDayHeatmap(
  sessions: LoggedSession[],
  fromHour = 5,
  toHour = 23,
): { grid: TimeOfDayCell[][]; fromHour: number; toHour: number } {
  const span = toHour - fromHour + 1;
  const totals: number[][] = Array.from({ length: 7 }, () => Array(span).fill(0));

  for (const session of sessions) {
    const started = new Date(session.endedAt - session.durationMs);
    // JS weeks start Sunday; the app's grid starts Monday.
    const weekday = (started.getDay() + 6) % 7;
    const hour = started.getHours();
    if (hour < fromHour || hour > toHour) continue;
    totals[weekday][hour - fromHour] += session.durationMs / 3_600_000;
  }

  const max = Math.max(1, ...totals.flat());
  const grid = totals.map((row, weekday) =>
    row.map((hours, i) => {
      const ratio = hours / max;
      const intensity: TimeOfDayCell["intensity"] =
        hours === 0 ? 0 : ratio > 0.75 ? 4 : ratio > 0.5 ? 3 : ratio > 0.25 ? 2 : 1;
      return { weekday, hour: fromHour + i, hours, intensity };
    }),
  );

  return { grid, fromHour, toHour };
}

/** The contiguous 3-hour window with the most logged time — "peak focus". */
export function peakFocusWindow(sessions: LoggedSession[]): { start: number; end: number; hours: number } | null {
  if (sessions.length === 0) return null;
  const byHour = Array(24).fill(0) as number[];
  for (const s of sessions) byHour[startHour(s)] += s.durationMs / 3_600_000;

  let best = { start: 0, end: 2, hours: -1 };
  for (let h = 0; h <= 21; h++) {
    const total = byHour[h] + byHour[h + 1] + byHour[h + 2];
    if (total > best.hours) best = { start: h, end: h + 2, hours: total };
  }
  return best.hours > 0 ? best : null;
}

export interface HistogramBucket {
  label: string;
  minMinutes: number;
  maxMinutes: number;
  count: number;
}

/** Chart 11 — session-length distribution. */
export function sessionLengthHistogram(sessions: LoggedSession[]): HistogramBucket[] {
  const buckets: HistogramBucket[] = [
    { label: "<15m", minMinutes: 0, maxMinutes: 15, count: 0 },
    { label: "15–30", minMinutes: 15, maxMinutes: 30, count: 0 },
    { label: "30–60", minMinutes: 30, maxMinutes: 60, count: 0 },
    { label: "60–90", minMinutes: 60, maxMinutes: 90, count: 0 },
    { label: "90–120", minMinutes: 90, maxMinutes: 120, count: 0 },
    { label: "120m+", minMinutes: 120, maxMinutes: Infinity, count: 0 },
  ];
  for (const s of sessions) {
    const minutes = s.durationMs / 60_000;
    const bucket = buckets.find((b) => minutes >= b.minMinutes && minutes < b.maxMinutes);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export type FindingTone = "critical" | "warning" | "good";

export interface Finding {
  id: string;
  tone: FindingTone;
  /** Rendered as a sentence; `emphasis` fragments are bolded by the UI. */
  text: string;
}

const READING_ACTIVITIES: ActivityType[] = ["concept", "lecture"];
const PRACTICE_ACTIVITIES: ActivityType[] = ["practice", "mockTest"];

/**
 * Generates findings from actual behaviour. Returns only what the data supports —
 * an empty list is a valid, honest result for a student with little history.
 */
export function generateFindings(
  sessions: LoggedSession[],
  /** The student's own papers. The "never touched this paper" finding names every paper
   *  in this list, so passing a level the student isn't sitting would invent advice about
   *  papers they'll never take. Defaults to every paper for the ratio checks, which are
   *  driven by logged sessions rather than by the list itself. */
  papers: PaperSeed[] = ALL_PAPERS,
  now: number = Date.now(),
): Finding[] {
  const findings: Finding[] = [];
  if (sessions.length === 0) return findings;

  // ---- 1. Reading-vs-practice ratio, per paper ----
  // A paper studied almost entirely by reading is the classic way CA students fail:
  // recognition feels like knowledge until you have to write it under time pressure.
  for (const paper of papers) {
    const own = sessions.filter((s) => s.paperId === paper.id);
    const total = own.reduce((sum, s) => sum + s.durationMs, 0);
    if (total < 3 * 3_600_000) continue; // too little to judge

    const readingMs = own
      .filter((s) => READING_ACTIVITIES.includes(s.activityType))
      .reduce((sum, s) => sum + s.durationMs, 0);
    const practiceMs = own
      .filter((s) => PRACTICE_ACTIVITIES.includes(s.activityType))
      .reduce((sum, s) => sum + s.durationMs, 0);

    const readingPct = Math.round((readingMs / total) * 100);
    const practicePct = Math.round((practiceMs / total) * 100);

    if (readingPct >= 65 && practicePct < 25) {
      findings.push({
        id: `ratio-${paper.id}`,
        tone: "critical",
        text: `${readingPct}% of your ${paper.name} time is reading, only ${practicePct}% question practice. That ratio fails papers — flip it toward problems.`,
      });
    }
  }

  // ---- 2. Neglected papers ----
  for (const paper of papers) {
    const own = sessions.filter((s) => s.paperId === paper.id);
    if (own.length === 0) {
      findings.push({
        id: `untouched-${paper.id}`,
        tone: "critical",
        text: `${paper.name} has no logged study time at all. It carries the same 100 marks as everything else.`,
      });
      continue;
    }
    const lastStudied = Math.max(...own.map((s) => s.endedAt));
    const daysSince = Math.floor((now - lastStudied) / 86_400_000);
    if (daysSince >= 10) {
      findings.push({
        id: `neglect-${paper.id}`,
        tone: "warning",
        text: `${paper.name} untouched for ${daysSince} days. A short revision keeps it warm — cold papers cost far more to restart.`,
      });
    }
  }

  // ---- 3. Peak focus window (praise, so the screen isn't only bad news) ----
  const peak = peakFocusWindow(sessions);
  if (peak) {
    findings.push({
      id: "peak-window",
      tone: "good",
      text: `Your strongest window is ${formatHour(peak.start)}–${formatHour(peak.end + 1)}, with ${peak.hours.toFixed(1)}h logged there. Protect it — schedule your hardest paper into it.`,
    });
  }

  // ---- 4. Session-length quality ----
  const histogram = sessionLengthHistogram(sessions);
  const shortCount = histogram[0].count + histogram[1].count;
  const deepCount = histogram[3].count + histogram[4].count + histogram[5].count;
  if (sessions.length >= 10) {
    if (shortCount > deepCount * 2) {
      findings.push({
        id: "fragmented",
        tone: "warning",
        text: `Most of your sessions are under 30 minutes. Fragmented study suits revision, but practical papers need unbroken 60–90 minute blocks to build speed.`,
      });
    } else if (deepCount >= shortCount) {
      findings.push({
        id: "deep-work",
        tone: "good",
        text: `Your sessions cluster in the 60–90 minute range — good deep-work length, and few panic-cram sessions.`,
      });
    }
  }

  return findings;
}

function formatHour(hour: number): string {
  const h = hour % 24;
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

export function activityLabel(type: ActivityType): string {
  return ACTIVITY_LABEL[type];
}
