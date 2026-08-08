"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FOUNDATION_PAPERS } from "@/lib/icai/foundation";
import { useLocalState } from "@/lib/hooks/useLocalState";
import { useSyncedArrayState } from "@/lib/hooks/useSyncedArrayState";
import { LOGGED_SESSION_SYNC } from "@/lib/sync/syncConfigs";
import { ActivityChip } from "@/components/ui/Chips";
import { ProgressRing } from "@/components/ui/ProgressRing";
import {
  ACTIVITY_TYPES,
  PAPER_CATEGORY_COLOR_VAR,
  type ActivityType,
} from "@/lib/domain/types";
import {
  elapsedMs,
  formatDuration,
  isPaused,
  pauseSession,
  resumeSession,
  startSession,
  type TimerSession,
} from "@/lib/domain/timer";
import { newSessionId, type LoggedSession } from "@/lib/domain/loggedSession";

const SESSION_KEY = "sc-active-session";
const LOG_KEY = "sc-logged-sessions";

/**
 * C1 Timer setup + C2 Active session, combined on one route per WEB_PLAN.md's route
 * table. The session persists across reloads via localStorage (`sc-active-session`) —
 * refreshing mid-session resumes exactly where it left off, which is the actual proof
 * that the wall-clock model in lib/domain/timer.ts works (see that file's header
 * comment for why this matters more here than almost anywhere else in the app).
 *
 * Accepts `?paper=&chapter=&activity=` so the Dashboard's Start CTA (and any future
 * "jump straight into X" link) can open the timer pre-configured rather than dumping
 * the student back at generic defaults. `useSearchParams` requires a Suspense boundary
 * in the App Router, hence the wrapper below.
 */
export default function TimerPage() {
  return (
    <Suspense fallback={null}>
      <TimerPageInner />
    </Suspense>
  );
}

function TimerPageInner() {
  const [session, setSession] = useLocalState<TimerSession | null>(SESSION_KEY, null);
  const [, setLog] = useSyncedArrayState<LoggedSession>(LOG_KEY, [], LOGGED_SESSION_SYNC);

  if (!session) {
    return <TimerSetup onStart={(s) => setSession(s)} />;
  }

  return (
    <ActiveSession
      session={session}
      onPause={() => setSession(pauseSession(session))}
      onResume={() => setSession(resumeSession(session))}
      onStop={() => {
        const duration = elapsedMs(session);
        setLog((prev) => [
          ...prev,
          {
            id: newSessionId(),
            paperId: session.paperId,
            chapterId: session.chapterId,
            activityType: session.activityType,
            durationMs: duration,
            endedAt: Date.now(),
          },
        ]);
        setSession(null);
      }}
    />
  );
}

function TimerSetup({ onStart }: { onStart: (session: TimerSession) => void }) {
  const params = useSearchParams();

  // Query params only apply if they actually resolve to real seeded data — a stale or
  // malformed link (e.g. pointing at an unseeded Inter/Final paper) falls back to the
  // ordinary defaults rather than crashing or opening an inconsistent state.
  const requestedPaper = FOUNDATION_PAPERS.find((p) => p.id === params.get("paper"));
  const initialPaper = requestedPaper ?? FOUNDATION_PAPERS[0];
  const requestedChapterId = params.get("chapter");
  const initialChapterId =
    requestedPaper?.chapters.find((c) => c.id === requestedChapterId)?.id ??
    initialPaper.chapters[0].id;
  const requestedActivity = params.get("activity");
  const initialActivity: ActivityType = (ACTIVITY_TYPES as readonly string[]).includes(
    requestedActivity ?? "",
  )
    ? (requestedActivity as ActivityType)
    : "concept";

  const [paperId, setPaperId] = useState(initialPaper.id);
  const paper = FOUNDATION_PAPERS.find((p) => p.id === paperId)!;
  const [chapterId, setChapterId] = useState(initialChapterId);
  const [activity, setActivity] = useState<ActivityType>(initialActivity);

  function handlePaperChange(nextId: string) {
    setPaperId(nextId);
    const nextPaper = FOUNDATION_PAPERS.find((p) => p.id === nextId)!;
    setChapterId(nextPaper.chapters[0].id);
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-8 sm:px-6">
      <h1 className="text-title text-text">Start a session</h1>

      <div>
        <label className="mb-2 block text-overline uppercase text-dim" htmlFor="paper-select">
          Paper
        </label>
        <select
          id="paper-select"
          value={paperId}
          onChange={(e) => handlePaperChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface2 px-4 py-3 text-body text-text"
        >
          {FOUNDATION_PAPERS.map((p) => (
            <option key={p.id} value={p.id}>
              Paper {p.paperNo} — {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-overline uppercase text-dim" htmlFor="chapter-select">
          Chapter
        </label>
        <select
          id="chapter-select"
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface2 px-4 py-3 text-body text-text"
        >
          {paper.chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-2 text-overline uppercase text-dim">Activity</div>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_TYPES.map((t) => (
            <ActivityChip key={t} type={t} selected={activity === t} onClick={() => setActivity(t)} />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onStart(startSession(paperId, chapterId, activity))}
        className="mt-2 flex w-full items-center justify-center gap-[10px] rounded-card bg-primary p-4 text-primary-on transition-[filter] duration-150 hover:brightness-110"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
        <span className="text-[15px] font-bold">Start</span>
      </button>
    </div>
  );
}

function ActiveSession({
  session,
  onPause,
  onResume,
  onStop,
}: {
  session: TimerSession;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}) {
  // The tick is purely a re-render pulse — it never touches elapsed math. All timing
  // truth comes from elapsedMs(session, now), computed fresh on every render.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (isPaused(session)) return; // no need to tick while paused — the value is frozen
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [session]);

  const paper = FOUNDATION_PAPERS.find((p) => p.id === session.paperId)!;
  const chapter = paper.chapters.find((c) => c.id === session.chapterId)!;
  const paused = isPaused(session);
  const elapsed = elapsedMs(session);
  const color = PAPER_CATEGORY_COLOR_VAR[paper.category];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 py-10 sm:px-6">
      <ProgressRing
        progress={1}
        color={paused ? "var(--grey)" : color}
        diameter={220}
        strokeWidth={12}
        centerLabel={formatDuration(elapsed)}
        breathing={!paused}
      />

      <div className="text-center">
        <div className="text-subtitle text-text">{chapter.name}</div>
        <div className="mt-1 text-caption text-dim">
          Paper {paper.paperNo} — {paper.name}
        </div>
        {paused && (
          <div className="mt-2 text-label font-semibold" style={{ color: "var(--amber)" }}>
            Paused
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {paused ? (
          <button
            type="button"
            onClick={onResume}
            className="rounded-card bg-primary px-8 py-3 text-[15px] font-bold text-primary-on"
          >
            Resume
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            className="rounded-card border border-border bg-surface2 px-8 py-3 text-[15px] font-bold text-text"
          >
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={onStop}
          className="rounded-card border px-8 py-3 text-[15px] font-bold"
          style={{ borderColor: "var(--red)", color: "var(--red)" }}
        >
          End
        </button>
      </div>
    </div>
  );
}
