import type { LoggedSession } from "@/lib/domain/loggedSession";
import type { ActivityType, PaperCategory } from "@/lib/domain/types";
import { ACTIVITY_TYPES, PAPER_CATEGORY_COLOR_VAR, PAPER_CATEGORY_LABEL } from "@/lib/domain/types";
import type { PaperSeed } from "@/lib/icai/foundation";
import { ALL_PAPERS, paperById } from "@/lib/icai/levels";
import { isoDate } from "@/lib/domain/week";

/**
 * E1 Overview's aggregation engine — pure functions over `LoggedSession[]`, mirroring
 * what `StatsRollup` does in the Kotlin domain layer (PLAN.md §6). Every chart on the
 * stats page is a projection of this module, not its own bespoke query, so the KPIs and
 * the charts can never disagree with each other.
 */

export type RangeDays = 7 | 30 | 90 | 0; // 0 = All

function paperFor(paperId: string): PaperSeed | undefined {
  return paperById(paperId);
}

function inRange(session: LoggedSession, days: RangeDays, now: number): boolean {
  if (days === 0) return true;
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return session.endedAt >= cutoff;
}

export interface Kpis {
  totalHours: number;
  avgHoursPerDay: number;
  sessionCount: number;
}

export function calculateKpis(
  sessions: LoggedSession[],
  days: RangeDays,
  now: number = Date.now(),
): Kpis {
  const filtered = sessions.filter((s) => inRange(s, days, now));
  const totalMs = filtered.reduce((sum, s) => sum + s.durationMs, 0);
  const totalHours = totalMs / 3_600_000;
  const spanDays = days === 0 ? distinctDaySpan(filtered, now) : days;
  return {
    totalHours,
    avgHoursPerDay: spanDays > 0 ? totalHours / spanDays : 0,
    sessionCount: filtered.length,
  };
}

function distinctDaySpan(sessions: LoggedSession[], now: number): number {
  if (sessions.length === 0) return 1;
  const earliest = Math.min(...sessions.map((s) => s.endedAt));
  return Math.max(1, Math.ceil((now - earliest) / 86_400_000));
}

/** Longest run of consecutive days (ending today or yesterday) with at least one
 *  logged session. */
export function currentStreak(sessions: LoggedSession[], now: number = Date.now()): number {
  const daysWithSessions = new Set(sessions.map((s) => isoDate(new Date(s.endedAt))));
  let streak = 0;
  const cursor = new Date(now);
  // A streak "in progress" tolerates today having no session yet (it isn't over).
  if (!daysWithSessions.has(isoDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (daysWithSessions.has(isoDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Longest run of consecutive study days across the whole history — H1's "best streak",
 *  distinct from [currentStreak] which only measures the trailing run. */
export function longestStreak(sessions: LoggedSession[]): number {
  if (sessions.length === 0) return 0;
  const days = Array.from(new Set(sessions.map((s) => isoDate(new Date(s.endedAt))))).sort();

  let longest = 1;
  let running = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(`${days[i - 1]}T00:00:00`);
    const curr = new Date(`${days[i]}T00:00:00`);
    const gap = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    running = gap === 1 ? running + 1 : 1;
    longest = Math.max(longest, running);
  }
  return longest;
}

export interface DailyBar {
  dateIso: string;
  label: string;
  hours: number;
}

/** Last [count] days, oldest first, for the "hours per day" bar chart. */
export function dailyHours(sessions: LoggedSession[], count: number, now: number = Date.now()): DailyBar[] {
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    const key = isoDate(new Date(s.endedAt));
    byDay.set(key, (byDay.get(key) ?? 0) + s.durationMs / 3_600_000);
  }
  const bars: DailyBar[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = isoDate(d);
    bars.push({
      dateIso: key,
      label: d.toLocaleDateString("en-IN", { weekday: "narrow" }),
      hours: byDay.get(key) ?? 0,
    });
  }
  return bars;
}

export interface WeekPoint {
  weekStartIso: string;
  label: string;
  hours: number;
}

/** Last [weeks] full weeks, oldest first, for the weekly-trend line chart. */
export function weeklyTrend(sessions: LoggedSession[], weeks: number, now: number = Date.now()): WeekPoint[] {
  const points: WeekPoint[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const end = new Date(now);
    end.setDate(end.getDate() - w * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    const startMs = start.setHours(0, 0, 0, 0);
    const endMs = new Date(end).setHours(23, 59, 59, 999);
    const hours = sessions
      .filter((s) => s.endedAt >= startMs && s.endedAt <= endMs)
      .reduce((sum, s) => sum + s.durationMs / 3_600_000, 0);
    points.push({
      weekStartIso: isoDate(new Date(startMs)),
      label: new Date(startMs).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      hours,
    });
  }
  return points;
}

export interface PaperSlice {
  category: PaperCategory;
  name: string;
  color: string;
  hours: number;
  percent: number;
}

/** Time-by-paper breakdown for the donut chart. */
export function paperBreakdown(sessions: LoggedSession[], days: RangeDays, now: number = Date.now()): PaperSlice[] {
  const filtered = sessions.filter((s) => inRange(s, days, now));
  const totalMs = filtered.reduce((sum, s) => sum + s.durationMs, 0);
  const byPaper = new Map<string, number>();
  for (const s of filtered) {
    byPaper.set(s.paperId, (byPaper.get(s.paperId) ?? 0) + s.durationMs);
  }
  // All levels, not just Foundation — zero-hour papers are filtered out below, so this
  // surfaces exactly the papers the student actually logged against, whatever level.
  return ALL_PAPERS.map((paper) => {
    const ms = byPaper.get(paper.id) ?? 0;
    return {
      category: paper.category,
      name: paper.name,
      color: PAPER_CATEGORY_COLOR_VAR[paper.category],
      hours: ms / 3_600_000,
      percent: totalMs > 0 ? (ms / totalMs) * 100 : 0,
    };
  }).filter((slice) => slice.hours > 0);
}

export interface ActivityRow {
  paperId: string;
  paperLabel: string;
  segments: { activityType: ActivityType; percent: number }[];
}

const ACTIVITY_MIX_COLOR: Record<ActivityType, string> = {
  concept: "var(--primary)",
  practice: "var(--green)",
  revision: "var(--amber)",
  mockTest: "var(--red)",
  lecture: "var(--paper-tax)",
};

export function activityMixByPaper(sessions: LoggedSession[], days: RangeDays, now: number = Date.now()): ActivityRow[] {
  const filtered = sessions.filter((s) => inRange(s, days, now));
  const rows: ActivityRow[] = [];
  for (const paper of ALL_PAPERS) {
    const paperSessions = filtered.filter((s) => s.paperId === paper.id);
    const totalMs = paperSessions.reduce((sum, s) => sum + s.durationMs, 0);
    if (totalMs === 0) continue;
    const segments = ACTIVITY_TYPES.map((type) => {
      const ms = paperSessions.filter((s) => s.activityType === type).reduce((sum, s) => sum + s.durationMs, 0);
      return { activityType: type, percent: (ms / totalMs) * 100 };
    }).filter((seg) => seg.percent > 0);
    rows.push({ paperId: paper.id, paperLabel: `P${paper.paperNo}`, segments });
  }
  return rows;
}

export function activityMixColor(type: ActivityType): string {
  return ACTIVITY_MIX_COLOR[type];
}

export interface HeatCell {
  dateIso: string;
  intensity: 0 | 1 | 2 | 3 | 4; // 0 = none .. 4 = heaviest
}

/** 12 weeks x 7 days, oldest-first, for the consistency heatmap. Intensity is bucketed
 *  by hours logged that day, relative to the busiest day in the window. */
export function calendarHeatmap(sessions: LoggedSession[], weeks: number, now: number = Date.now()): HeatCell[][] {
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    const key = isoDate(new Date(s.endedAt));
    byDay.set(key, (byDay.get(key) ?? 0) + s.durationMs);
  }
  const maxMs = Math.max(1, ...byDay.values());

  const totalDays = weeks * 7;
  const cells: HeatCell[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = isoDate(d);
    const ms = byDay.get(key) ?? 0;
    const ratio = ms / maxMs;
    const intensity: HeatCell["intensity"] = ms === 0 ? 0 : ratio > 0.75 ? 4 : ratio > 0.5 ? 3 : ratio > 0.25 ? 2 : 1;
    cells.push({ dateIso: key, intensity });
  }

  // Group into columns of 7 (weeks), oldest week first.
  const grid: HeatCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    grid.push(cells.slice(i, i + 7));
  }
  return grid;
}

export { PAPER_CATEGORY_LABEL };
export function paperName(paperId: string): string {
  return paperFor(paperId)?.name ?? paperId;
}
