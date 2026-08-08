import type { LoggedSession } from "@/lib/domain/loggedSession";
import { paperById } from "@/lib/icai/levels";

/** H6 Data — CSV/JSON export and full local reset. Purely client-side: generates a
 *  Blob from the student's own already-local data and triggers a browser download,
 *  no network involved. */

function paperName(paperId: string): string {
  return paperById(paperId)?.name ?? paperId;
}

function chapterName(paperId: string, chapterId: string): string {
  return paperById(paperId)?.chapters.find((c) => c.id === chapterId)?.name ?? chapterId;
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function sessionsToCsv(sessions: LoggedSession[]): string {
  const header = ["Date", "Time", "Paper", "Chapter", "Activity", "Duration (minutes)"];
  const rows = [...sessions]
    .sort((a, b) => a.endedAt - b.endedAt)
    .map((s) => {
      const ended = new Date(s.endedAt);
      return [
        ended.toISOString().slice(0, 10),
        ended.toTimeString().slice(0, 5),
        paperName(s.paperId),
        chapterName(s.paperId, s.chapterId),
        s.activityType,
        Math.round(s.durationMs / 60_000).toString(),
      ].map(csvEscape);
    });
  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadSessionsCsv(sessions: LoggedSession[]) {
  const dateStamp = new Date().toISOString().slice(0, 10);
  downloadBlob(sessionsToCsv(sessions), `study-counter-sessions-${dateStamp}.csv`, "text/csv");
}

/** Every `sc-*` key this app writes — kept as one explicit list rather than scanning
 *  all of localStorage, so an unrelated key some other app/extension left in the same
 *  origin never ends up in a student's exported backup or gets nuked by "reset all". */
export const ALL_STORAGE_KEYS = [
  "sc-onboarded",
  "sc-profile",
  "sc-attempt",
  "sc-situation",
  "sc-situation-hours",
  "sc-logged-sessions",
  "sc-active-session",
  "sc-foundation-rounds",
  "sc-chapter-confidence",
  "sc-planned-blocks",
  "sc-mock-tests",
  "sc-spom-progress",
  "sc-trainings",
  "sc-notification-prefs",
  "sc-theme",
] as const;

export function downloadFullBackupJson() {
  const backup: Record<string, unknown> = {};
  for (const key of ALL_STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        backup[key] = JSON.parse(raw);
      } catch {
        backup[key] = raw;
      }
    }
  }
  const dateStamp = new Date().toISOString().slice(0, 10);
  downloadBlob(JSON.stringify(backup, null, 2), `study-counter-backup-${dateStamp}.json`, "application/json");
}

export function resetAllData() {
  for (const key of ALL_STORAGE_KEYS) localStorage.removeItem(key);
}
