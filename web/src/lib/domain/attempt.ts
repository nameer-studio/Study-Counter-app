import { VALID_SESSIONS, type ExamSession, type IcaiLevel } from "@/lib/domain/types";
import { papersForAttempt, type GroupScope } from "@/lib/icai/levels";

/**
 * The student's target attempt, as captured by onboarding screen A5.
 *
 * Locked ICAI rules this encodes:
 *  - Foundation and Intermediate run 3 attempts/year (Jan/May/Sept); Final runs 2
 *    (May/Nov). `VALID_SESSIONS` is the single source of truth — a Final student must
 *    never be offered January.
 *  - Foundation has no groups: its 4 papers are cleared as one unit.
 *  - Exemptions exist at Inter/Final only (60+ carried forward), never at Foundation.
 */
export interface Attempt {
  level: IcaiLevel;
  group: GroupScope;
  session: ExamSession;
  year: number;
  /** ISO yyyy-mm-dd of the first paper — drives the primary countdown. Kept denormalised
   *  from [paperDates] so every consumer has one obvious field to read. */
  examDate: string;
  /** paperId -> ISO date. CA papers are staggered across roughly two weeks. */
  paperDates: Record<string, string>;
  /** paperId -> marks scored in a previous real attempt (60+ earns an exemption). */
  exemptions: Record<string, number>;
}

/** Approximate month each session sits in, used only to derive sensible defaults. */
const SESSION_MONTH: Record<ExamSession, number> = { jan: 0, may: 4, sep: 8, nov: 10 };

export function isoOf(d: Date): string {
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Next upcoming valid session for a level. Real ICAI dates come from a server-refreshed
 *  calendar table (PLAN.md §5); until that exists these are editable defaults. */
export function defaultSessionFor(
  level: IcaiLevel,
  now: Date = new Date(),
): { session: ExamSession; year: number } {
  const valid = VALID_SESSIONS[level];
  const year = now.getFullYear();
  for (const session of valid) {
    if (new Date(year, SESSION_MONTH[session], 13).getTime() > now.getTime()) {
      return { session, year };
    }
  }
  return { session: valid[0], year: year + 1 };
}

/** Staggers papers two days apart from the session's start, matching how ICAI actually
 *  schedules an attempt. Every date stays individually editable in A5. */
export function defaultPaperDates(
  level: IcaiLevel,
  group: GroupScope,
  session: ExamSession,
  year: number,
): Record<string, string> {
  const start = new Date(year, SESSION_MONTH[session], 13);
  const dates: Record<string, string> = {};
  papersForAttempt(level, group).forEach((paper, i) => {
    dates[paper.id] = isoOf(new Date(start.getTime() + i * 2 * 86_400_000));
  });
  return dates;
}

export function defaultAttempt(level: IcaiLevel = "foundation", now: Date = new Date()): Attempt {
  const { session, year } = defaultSessionFor(level, now);
  const group: GroupScope = level === "foundation" ? "none" : "both";
  const paperDates = defaultPaperDates(level, group, session, year);
  return {
    level,
    group,
    session,
    year,
    examDate: earliestDate(paperDates) ?? isoOf(new Date(year, SESSION_MONTH[session], 13)),
    paperDates,
    exemptions: {},
  };
}

export function earliestDate(paperDates: Record<string, string>): string | null {
  const values = Object.values(paperDates).sort();
  return values.length > 0 ? values[0] : null;
}

/** Whole days from [from] to the attempt's first paper. Negative once it has passed. */
export function daysUntilExam(attempt: Attempt, from: Date = new Date()): number {
  const exam = new Date(`${attempt.examDate}T00:00:00`);
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  return Math.round((exam.getTime() - start.getTime()) / 86_400_000);
}

/** Days to the next paper that hasn't happened yet — the deadline a student actually
 *  plans tomorrow around, which is often nearer than the attempt's start. */
export function daysUntilNextPaper(
  attempt: Attempt,
  from: Date = new Date(),
): { paperId: string; days: number } | null {
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  const upcoming = Object.entries(attempt.paperDates)
    .map(([paperId, iso]) => ({
      paperId,
      days: Math.round((new Date(`${iso}T00:00:00`).getTime() - today.getTime()) / 86_400_000),
    }))
    .filter((p) => p.days >= 0)
    .sort((a, b) => a.days - b.days);
  return upcoming[0] ?? null;
}

export function formatExamDate(attempt: Attempt): string {
  return new Date(`${attempt.examDate}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export const SESSION_SHORT_LABEL: Record<ExamSession, string> = {
  jan: "Jan",
  may: "May",
  sep: "Sept",
  nov: "Nov",
};
