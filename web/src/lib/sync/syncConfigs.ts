import type { Profile, Situation, SituationHourOverrides } from "@/lib/domain/profile";
import type { Attempt } from "@/lib/domain/attempt";
import type { LoggedSession } from "@/lib/domain/loggedSession";
import type { MockTest } from "@/lib/domain/mockTest";
import type { PlannedBlock } from "@/lib/domain/plannedBlock";
import type { RevisionRound } from "@/lib/domain/types";
import type { SingletonSync } from "@/lib/hooks/useSyncedLocalState";
import type { ArraySync } from "@/lib/hooks/useSyncedArrayState";
import type { RecordSync } from "@/lib/hooks/useSyncedRecordState";

/**
 * The Supabase row mapping for each of the 8 M3 sync keys, defined once here so domain
 * files (attempt.ts, profile.ts, loggedSession.ts, mockTest.ts) stay backend-agnostic —
 * page files import whichever config they need instead of redefining toRow/fromRow.
 */

export const PROFILE_SYNC: SingletonSync<Profile | null> = {
  table: "profiles",
  isEmpty: (v) => v == null || (!v.displayName && !v.username),
  toRow: (v, userId) => ({ user_id: userId, display_name: v!.displayName, username: v!.username }),
  fromRow: (row) => ({
    displayName: (row.display_name as string) ?? "",
    username: (row.username as string) ?? "",
  }),
};

export const ATTEMPT_SYNC: SingletonSync<Attempt | null> = {
  table: "attempts",
  isEmpty: (v) => v == null,
  toRow: (v, userId) => ({
    user_id: userId,
    level: v!.level,
    group_scope: v!.group,
    session: v!.session,
    year: v!.year,
    exam_date: v!.examDate || null,
    paper_dates: v!.paperDates,
    exemptions: v!.exemptions,
  }),
  fromRow: (row) => ({
    level: row.level as Attempt["level"],
    group: row.group_scope as Attempt["group"],
    session: row.session as Attempt["session"],
    year: row.year as number,
    examDate: (row.exam_date as string) ?? "",
    paperDates: (row.paper_dates as Record<string, string>) ?? {},
    exemptions: (row.exemptions as Record<string, number>) ?? {},
  }),
};

export const SITUATION_SYNC: SingletonSync<Situation | null> = {
  table: "situations",
  isEmpty: (v) => v == null,
  toRow: (v, userId) => ({
    user_id: userId,
    mode: v!.mode,
    office_in: v!.officeIn ?? null,
    office_out: v!.officeOut ?? null,
    leave_start_date: v!.leaveStartDate ?? null,
  }),
  fromRow: (row) => ({
    mode: row.mode as Situation["mode"],
    officeIn: (row.office_in as string) ?? undefined,
    officeOut: (row.office_out as string) ?? undefined,
    leaveStartDate: (row.leave_start_date as string) ?? undefined,
  }),
};

export const SITUATION_HOURS_SYNC: SingletonSync<SituationHourOverrides> = {
  table: "situation_hour_overrides",
  isEmpty: (v) => Object.keys(v).length === 0,
  toRow: (v, userId) => ({ user_id: userId, overrides: v }),
  fromRow: (row) => (row.overrides as SituationHourOverrides) ?? {},
};

export const LOGGED_SESSION_SYNC: ArraySync<LoggedSession> = {
  table: "logged_sessions",
  toRow: (s, userId) => ({
    id: s.id,
    user_id: userId,
    paper_id: s.paperId,
    chapter_id: s.chapterId,
    activity_type: s.activityType,
    duration_ms: s.durationMs,
    ended_at: s.endedAt,
  }),
  fromRow: (row) => ({
    id: row.id as string,
    paperId: row.paper_id as string,
    chapterId: row.chapter_id as string,
    activityType: row.activity_type as LoggedSession["activityType"],
    durationMs: row.duration_ms as number,
    endedAt: row.ended_at as number,
  }),
};

export const MOCK_TEST_SYNC: ArraySync<MockTest> = {
  table: "mock_tests",
  toRow: (m, userId) => ({
    id: m.id,
    user_id: userId,
    paper_id: m.paperId,
    date: m.date,
    marks_obtained: m.marksObtained,
    max_marks: m.maxMarks,
    source: m.source,
    correct_count: m.correctCount ?? null,
    wrong_count: m.wrongCount ?? null,
    unattempted_count: m.unattemptedCount ?? null,
  }),
  fromRow: (row) => ({
    id: row.id as string,
    paperId: row.paper_id as string,
    date: row.date as number,
    marksObtained: row.marks_obtained as number,
    maxMarks: row.max_marks as number,
    source: row.source as MockTest["source"],
    correctCount: (row.correct_count as number) ?? undefined,
    wrongCount: (row.wrong_count as number) ?? undefined,
    unattemptedCount: (row.unattempted_count as number) ?? undefined,
  }),
};

export const REVISION_ROUNDS_SYNC: RecordSync<RevisionRound> = {
  table: "revision_rounds",
  toRow: (chapterId, round, userId) => ({ user_id: userId, chapter_id: chapterId, round }),
  fromRow: (row) => [row.chapter_id as string, row.round as RevisionRound],
};

export const CHAPTER_CONFIDENCE_SYNC: RecordSync<number> = {
  table: "chapter_confidence",
  toRow: (chapterId, confidence, userId) => ({ user_id: userId, chapter_id: chapterId, confidence }),
  fromRow: (row) => [row.chapter_id as string, row.confidence as number],
};

export const PLANNED_BLOCK_SYNC: ArraySync<PlannedBlock> = {
  table: "planned_blocks",
  toRow: (b, userId) => ({
    id: b.id,
    user_id: userId,
    paper_id: b.paperId,
    chapter_id: b.chapterId,
    activity_type: b.activityType,
    date: b.date,
    start_time: b.startTime ?? null,
    duration_minutes: b.durationMinutes,
    completed: b.completed,
  }),
  fromRow: (row) => ({
    id: row.id as string,
    paperId: row.paper_id as string,
    chapterId: row.chapter_id as string,
    activityType: row.activity_type as PlannedBlock["activityType"],
    date: row.date as string,
    startTime: (row.start_time as string) ?? undefined,
    durationMinutes: row.duration_minutes as number,
    completed: row.completed as boolean,
  }),
};
