"use client";

import Link from "next/link";
import clsx from "clsx";
import { FOUNDATION_PAPERS } from "@/lib/icai/foundation";
import { useSeedOnce } from "@/lib/hooks/useSeededLocalState";
import { useSyncedArrayState } from "@/lib/hooks/useSyncedArrayState";
import { useSyncedRecordState } from "@/lib/hooks/useSyncedRecordState";
import { useSyncedLocalState } from "@/lib/hooks/useSyncedLocalState";
import {
  LOGGED_SESSION_SYNC,
  MOCK_TEST_SYNC,
  REVISION_ROUNDS_SYNC,
  ATTEMPT_SYNC,
} from "@/lib/sync/syncConfigs";
import type { LoggedSession } from "@/lib/domain/loggedSession";
import { generateDemoSessions } from "@/lib/demo/seedSessions";
import { generateDemoMocks } from "@/lib/demo/seedMocks";
import { generateDemoRounds } from "@/lib/demo/seedRounds";
import { projectPass, type MockTest } from "@/lib/domain/mockTest";
import { defaultAttempt, daysUntilExam, formatExamDate, type Attempt } from "@/lib/domain/attempt";
import {
  buildBurnDown,
  buildBurnUp,
  paperReadiness,
  requiredEffort,
  weakestPaper,
} from "@/lib/domain/readiness";
import type { RevisionRound } from "@/lib/domain/types";
import { BurnDownChart } from "@/components/charts/BurnDownChart";
import { BurnUpChart } from "@/components/charts/BurnUpChart";
import { AggregateGauge } from "@/components/charts/AggregateGauge";
import { ReadinessBars } from "@/components/charts/ReadinessBars";

const LOG_KEY = "sc-logged-sessions";
const ROUNDS_KEY = "sc-foundation-rounds";
const MOCKS_KEY = "sc-mock-tests";
const ATTEMPT_KEY = "sc-attempt";

/**
 * E4 Attempt readiness — charts 12–15. The design calls chart 12 the most important
 * diagram in the app, and the whole screen is built around its brief: state the bad news
 * honestly, then immediately hand back an achievable next step. Nothing here is allowed
 * to leave a student with a red line and no answer.
 */
export default function ReadinessPage() {
  const [sessions] = useSeedOnce<LoggedSession[]>(
    useSyncedArrayState<LoggedSession>(LOG_KEY, [], LOGGED_SESSION_SYNC),
    generateDemoSessions,
    (s) => s.length === 0,
  );
  const [mocks] = useSeedOnce<MockTest[]>(
    useSyncedArrayState<MockTest>(MOCKS_KEY, [], MOCK_TEST_SYNC),
    generateDemoMocks,
    (m) => m.length === 0,
  );
  // Derived from the same deterministic session generator, so hours and recorded
  // progress tell one story — see generateDemoRounds for why it can't read the
  // sessions store directly here.
  const [rounds] = useSeedOnce<Record<string, RevisionRound>>(
    useSyncedRecordState<RevisionRound>(ROUNDS_KEY, {}, REVISION_ROUNDS_SYNC),
    () => generateDemoRounds(),
    (r) => Object.keys(r).length === 0,
  );
  const [attempt, setAttempt] = useSeedOnce<Attempt | null>(
    useSyncedLocalState<Attempt | null>(ATTEMPT_KEY, null, ATTEMPT_SYNC),
    () => defaultAttempt("foundation"),
    (a) => a === null,
  );

  if (!attempt) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center sm:px-6">
        <p className="text-body text-dim">Setting up your attempt…</p>
      </div>
    );
  }

  const daysLeft = daysUntilExam(attempt);
  const burnDown = buildBurnDown(FOUNDATION_PAPERS, rounds, sessions, attempt);
  const burnUp = buildBurnUp(FOUNDATION_PAPERS, sessions, attempt);
  const readiness = paperReadiness(FOUNDATION_PAPERS, rounds);
  const weakest = weakestPaper(readiness);
  const effort = requiredEffort(FOUNDATION_PAPERS, rounds, sessions, attempt);
  const projection = projectPass(mocks);

  const overshoot = burnDown.overshootDays;
  const isBehind = overshoot !== null && overshoot > 0;
  const cannotProject = !burnDown.isProjectionReliable;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      {/* ---- Header: the countdown is the hero, per the design principles ---- */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title text-text">Attempt readiness</h1>
          <div className="mt-[2px] text-caption text-dim">
            CA Foundation · {attempt.session.toUpperCase()} {attempt.year} ·{" "}
            <span className="tnum font-semibold" style={{ color: daysLeft < 30 ? "var(--red)" : "var(--text)" }}>
              {daysLeft} days left
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-caption text-dim" htmlFor="exam-date">
            Exam date
          </label>
          <input
            id="exam-date"
            type="date"
            value={attempt.examDate}
            onChange={(e) => setAttempt({ ...attempt, examDate: e.target.value })}
            className="tnum rounded-lg border border-border bg-surface2 px-3 py-[6px] text-label text-text"
          />
          <Link
            href="/stats"
            className="rounded-lg border border-border px-3 py-[6px] text-label font-semibold text-dim transition-colors hover:border-primary hover:text-primary"
          >
            ← Overview
          </Link>
        </div>
      </div>

      {/* ---- Chart 12: the hero ---- */}
      <section className="mb-4 rounded-card-lg border border-border bg-surface p-4">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-body font-bold text-text">12 · Syllabus burn-down</span>
          {overshoot !== null && (
            <span
              className="tnum text-[10px] font-semibold"
              style={{ color: isBehind ? "var(--red)" : "var(--green)" }}
            >
              {isBehind
                ? `projected finish +${overshoot} days`
                : `projected finish ${Math.abs(overshoot)} days early`}
            </span>
          )}
          {cannotProject && burnDown.remainingNow > 0 && (
            <span className="text-[10px] font-semibold text-dim">not enough progress to project</span>
          )}
        </div>
        <p className="mb-3 text-[10px] text-dim">
          Chapters remaining vs days, weighted by revision round.{" "}
          {burnDown.isApproximateHistory && "Past progress is estimated from hours logged."}
        </p>

        <BurnDownChart model={burnDown} examLabel={formatExamDate(attempt)} />

        {/* The answer. Never leave the red projection unresolved on screen. */}
        <div
          className="mt-3 flex items-start gap-[10px] rounded-[13px] p-[13px]"
          style={{
            background: "color-mix(in srgb, var(--primary) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--primary) 35%, transparent)",
          }}
        >
          <span className="text-[15px]" aria-hidden>
            {cannotProject && burnDown.remainingNow > 0 ? "◑" : isBehind ? "↗" : "✓"}
          </span>
          <div className="text-caption leading-[1.5] text-text">
            {cannotProject && burnDown.remainingNow > 0 ? (
              <>
                You&rsquo;ve logged{" "}
                <b>{Math.round(burnUp.todayHours)}h</b> but marked very little chapter
                progress, so there&rsquo;s nothing solid to forecast from. Update revision
                rounds on the{" "}
                <Link href="/syllabus" className="font-semibold" style={{ color: "var(--primary)" }}>
                  syllabus screen
                </Link>{" "}
                and this becomes a real projection. Meanwhile{" "}
                <b style={{ color: "var(--primary)" }}>
                  {effort.requiredHoursPerDay === Infinity ? "—" : `${effort.requiredHoursPerDay.toFixed(1)}h/day`}
                </b>{" "}
                is what the remaining syllabus needs.
              </>
            ) : isBehind ? (
              <>
                At today&rsquo;s pace you clear the syllabus{" "}
                <b>~{overshoot} days after</b> your exam.{" "}
                <b style={{ color: "var(--primary)" }}>
                  {effort.requiredHoursPerDay.toFixed(1)}h/day
                </b>{" "}
                closes it — that&rsquo;s the whole gap, nothing more
                {weakest && <>, and {weakest.name} is where it&rsquo;s cheapest to find</>}.
              </>
            ) : burnDown.remainingNow <= 0 ? (
              <>Syllabus complete. Hold the revision cycles and protect the streak.</>
            ) : (
              <>
                You&rsquo;re on or ahead of the line.{" "}
                <b style={{ color: "var(--primary)" }}>
                  {effort.requiredHoursPerDay.toFixed(1)}h/day
                </b>{" "}
                keeps it that way — bank the lead, don&rsquo;t coast on it.
              </>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="13 · Cumulative hours (burn-up)">
          <BurnUpChart model={burnUp} />
          <p className="tnum mt-2 text-[10px] text-dim">
            {Math.round(burnUp.todayHours)}h logged of {Math.round(burnUp.targetHours)}h estimated
            for the full syllabus.
          </p>
        </ChartCard>

        <ChartCard title="14 · Projected aggregate">
          <AggregateGauge
            percent={projection.aggregatePercent}
            papersCounted={projection.papersCounted}
          />
          {projection.papersUnderMinimum.length > 0 && (
            <p className="mt-3 text-caption leading-[1.5]" style={{ color: "var(--red)" }}>
              {projection.papersUnderMinimum.length}{" "}
              {projection.papersUnderMinimum.length === 1 ? "paper is" : "papers are"} under the
              40-mark minimum:{" "}
              {projection.papersUnderMinimum
                .map((p) => {
                  const paper = FOUNDATION_PAPERS.find((fp) => fp.id === p.paperId);
                  return `${paper ? paper.name : p.paperId} (${p.marks})`;
                })
                .join(", ")}
              . Each one fails the group on its own, whatever the aggregate says.
            </p>
          )}
        </ChartCard>

        <ChartCard title="15 · Per-paper readiness">
          <ReadinessBars readiness={readiness} />
        </ChartCard>

        <ChartCard title="Required effort">
          <div className="flex gap-2">
            <div className="flex-1 rounded-[14px] border border-border bg-surface2 p-[14px]">
              <div className="text-caption text-dim">Required from today</div>
              <div
                className="tnum mt-1 text-[24px] font-extrabold"
                style={{ color: effort.isUnrealistic ? "var(--red)" : "var(--amber)" }}
              >
                {effort.requiredHoursPerDay === Infinity
                  ? "—"
                  : effort.requiredHoursPerDay.toFixed(1)}
                <span className="text-[13px] font-semibold text-dim">h/day</span>
              </div>
              <div className="tnum mt-[2px] text-[10px] text-dim">
                {effort.currentAvgHoursPerDay > 0
                  ? `up from ${effort.currentAvgHoursPerDay.toFixed(1)}h avg`
                  : "no history yet"}
              </div>
              {effort.isUnrealistic && (
                <div className="mt-2 text-[10px] leading-[1.4]" style={{ color: "var(--red)" }}>
                  That&rsquo;s past what anyone sustains. Consider dropping a group rather
                  than planning to fail both.
                </div>
              )}
            </div>
            <div className="flex-1 rounded-[14px] border border-border bg-surface2 p-[14px]">
              <div className="text-caption text-dim">Weakest link</div>
              {weakest ? (
                <>
                  <div className="mt-[6px] flex items-center gap-[6px]">
                    <span
                      className="h-[9px] w-[9px] rounded-sm"
                      style={{ background: weakest.color }}
                      aria-hidden
                    />
                    <span className="text-[16px] font-extrabold text-text">{weakest.name}</span>
                  </div>
                  <div className="tnum mt-1 text-[10px]" style={{ color: "var(--red)" }}>
                    {weakest.percent}% ready · start here
                  </div>
                </>
              ) : (
                <div className="mt-2 text-caption text-dim">No papers yet</div>
              )}
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-card-lg border border-border bg-surface p-4", className)}>
      <div className="mb-3 text-overline uppercase text-dim">{title}</div>
      {children}
    </div>
  );
}
