"use client";

import Link from "next/link";
import clsx from "clsx";
import { useLocalState } from "@/lib/hooks/useLocalState";
import { papersForAttempt, hasSyllabusData } from "@/lib/icai/levels";
import type { Attempt } from "@/lib/domain/attempt";
import type { LoggedSession } from "@/lib/domain/loggedSession";
import type { RevisionRound } from "@/lib/domain/types";
import { buildRoadmap, type RoadmapPhase } from "@/lib/domain/roadmap";

const ATTEMPT_KEY = "sc-attempt";
const LOG_KEY = "sc-logged-sessions";
const ROUNDS_KEY = "sc-foundation-rounds";

/**
 * D4 Attempt roadmap — a long, scrollable strategic view: first reading → revision
 * round 1 → revision round 2 → a locked final-revision window → exam day. Every count
 * here is regrouped from the same engines D7/E4 use (see roadmap.ts), so it can't tell
 * a different story than Stats does about where the student stands.
 */
export default function RoadmapPage() {
  const [attempt, , hydrated] = useLocalState<Attempt | null>(ATTEMPT_KEY, null);
  const [sessions] = useLocalState<LoggedSession[]>(LOG_KEY, []);
  const [rounds] = useLocalState<Record<string, RevisionRound>>(ROUNDS_KEY, {});

  if (!hydrated) return null;

  if (!attempt) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
        <div className="text-title text-text">No attempt set up yet</div>
        <p className="text-body text-dim">The roadmap needs your attempt and exam dates first.</p>
        <Link href="/onboarding" className="mt-2 rounded-card bg-primary px-6 py-3 text-[15px] font-bold text-primary-on">
          Set up now
        </Link>
      </div>
    );
  }

  if (!hasSyllabusData(attempt.level)) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
        <div className="text-title text-text">Syllabus not loaded for this level</div>
        <p className="text-body text-dim">
          The roadmap needs chapter data to schedule against — only Foundation is seeded
          right now.
        </p>
      </div>
    );
  }

  const papers = papersForAttempt(attempt.level, attempt.group);
  const model = buildRoadmap(papers, rounds, sessions, attempt);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title text-text">Attempt roadmap</h1>
        <Link
          href="/attempt"
          className="rounded-lg border border-border px-3 py-[6px] text-label font-semibold text-dim transition-colors hover:border-primary hover:text-primary"
        >
          My attempt →
        </Link>
      </div>
      <p className="tnum mb-5 text-caption text-dim">{model.daysLeft} days to your first paper</p>

      {model.isProjectionReliable && model.overshootDays !== null && (
        <div
          className="mb-5 rounded-card p-4"
          style={{
            background: `color-mix(in srgb, ${model.overshootDays > 0 ? "var(--red)" : "var(--green)"} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${model.overshootDays > 0 ? "var(--red)" : "var(--green)"} 30%, transparent)`,
          }}
        >
          <p className="text-body text-text">
            {model.overshootDays > 0
              ? `At today's pace, the full syllabus finishes ~${model.overshootDays} days after your exam.`
              : "At today's pace, you clear the syllabus in time — the schedule below is achievable, not aspirational."}
          </p>
        </div>
      )}

      {/* ---- Per-paper pace ---- */}
      <section className="mb-6 rounded-card-lg border border-border bg-surface p-5">
        <div className="mb-3 text-overline uppercase text-dim">Per-paper pace</div>
        <div className="flex flex-col gap-3">
          {model.perPaper.map((p) => (
            <div key={p.paperId} className="flex items-center gap-3">
              <span className="h-2 w-2 flex-none rounded-sm" style={{ background: p.color }} aria-hidden />
              <span className="w-40 flex-none truncate text-label font-semibold text-text">{p.name}</span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${p.percent}%`,
                    background: p.status === "behind" ? "var(--amber)" : p.status === "onTrack" ? "var(--green)" : "var(--grey)",
                  }}
                />
                <span
                  className="absolute -top-[1px] -bottom-[1px] w-[2px] opacity-70"
                  style={{ left: `${p.idealPercent}%`, background: "var(--text)" }}
                  title={`Ideal-by-now: ${p.idealPercent}%`}
                />
              </div>
              <span
                className="w-16 flex-none text-right text-caption font-semibold"
                style={{ color: p.status === "behind" ? "var(--amber)" : p.status === "onTrack" ? "var(--green)" : "var(--dim)" }}
              >
                {p.status === "notStarted" ? "—" : `${p.percent}%`}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-dim">
          Bar = actual readiness · marker = where a straight-line pace would have you by
          today.
        </p>
      </section>

      {/* ---- Phase timeline ---- */}
      <div className="flex flex-col gap-4">
        {model.phases.map((phase, i) => (
          <PhaseCard key={phase.key} phase={phase} isLast={i === model.phases.length - 1} />
        ))}

        {model.finalRevisionWindow && (
          <div className="ml-4 border-l-2 border-dashed border-border pl-4 text-caption text-dim">
            Reserved window: {formatRange(model.finalRevisionWindow.startDate, model.finalRevisionWindow.endDate)} (
            {model.finalRevisionWindow.lengthDays} days)
          </div>
        )}

        <div className="ml-4 flex items-center gap-3 border-l-2 border-red pl-4" style={{ borderColor: "var(--red)" }}>
          <span
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[13px] font-bold"
            style={{ background: "var(--red)", color: "var(--primary-on)" }}
          >
            🎯
          </span>
          <span className="text-label font-bold text-text">Exam day</span>
        </div>
      </div>
    </div>
  );
}

function PhaseCard({ phase, isLast }: { phase: RoadmapPhase; isLast: boolean }) {
  return (
    <div className={clsx("ml-4 border-l-2 pl-4", !isLast && "pb-2")} style={{ borderColor: phase.locked ? "var(--border)" : "var(--primary)" }}>
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11px] font-bold"
          style={{
            background: phase.locked ? "var(--surface2)" : phase.totalChapters === 0 ? "var(--green)" : "var(--primary)",
            color: phase.locked ? "var(--dim)" : "var(--primary-on)",
          }}
        >
          {phase.locked ? "🔒" : phase.totalChapters === 0 ? "✓" : phase.totalChapters}
        </span>
        <div>
          <div className="text-label font-bold text-text">{phase.label}</div>
          <div className="tnum text-[10px] text-dim">
            {phase.locked
              ? `${phase.totalChapters} chapters get one more pass here`
              : phase.totalChapters === 0
                ? "Nothing waiting here"
                : `${phase.totalChapters} chapter${phase.totalChapters === 1 ? "" : "s"} remaining`}
          </div>
        </div>
      </div>
      {phase.byPaper.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-[6px]">
          {phase.byPaper.map((p) => (
            <span
              key={p.paperId}
              className="inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-[10px] font-semibold"
              style={{ background: `color-mix(in srgb, ${p.color} 16%, transparent)`, color: p.color }}
            >
              {p.name} · {p.count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const start = new Date(`${startIso}T00:00:00`).toLocaleDateString("en-IN", opts);
  const end = new Date(`${endIso}T00:00:00`).toLocaleDateString("en-IN", opts);
  return `${start} – ${end}`;
}
