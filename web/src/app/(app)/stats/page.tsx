"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useSeedOnce } from "@/lib/hooks/useSeededLocalState";
import { useSyncedArrayState } from "@/lib/hooks/useSyncedArrayState";
import { useSyncedRecordState } from "@/lib/hooks/useSyncedRecordState";
import { LOGGED_SESSION_SYNC, REVISION_ROUNDS_SYNC } from "@/lib/sync/syncConfigs";
import { papersForAttempt } from "@/lib/icai/levels";
import { useLocalState } from "@/lib/hooks/useLocalState";
import type { Attempt } from "@/lib/domain/attempt";
import { PAPER_CATEGORY_COLOR_VAR } from "@/lib/domain/types";
import type { LoggedSession } from "@/lib/domain/loggedSession";
import { generateDemoSessions } from "@/lib/demo/seedSessions";
import type { RangeDays } from "@/lib/domain/stats";
import {
  activityMixByPaper,
  calculateKpis,
  calendarHeatmap,
  currentStreak,
  dailyHours,
  paperBreakdown,
  weeklyTrend,
} from "@/lib/domain/stats";
import type { RevisionRound } from "@/lib/domain/types";
import { paperReadiness } from "@/lib/domain/readiness";
import { BarChart } from "@/components/charts/BarChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { StackedActivityBar } from "@/components/charts/StackedActivityBar";
import { CalendarHeatmap } from "@/components/charts/CalendarHeatmap";

const LOG_KEY = "sc-logged-sessions";
const ROUNDS_KEY = "sc-foundation-rounds";

const RANGE_OPTIONS: { value: RangeDays; label: string }[] = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
  { value: 0, label: "All" },
];

/**
 * E1 Overview — KPI row + charts 1–5, all derived from the same `LoggedSession[]` the
 * Timer writes to `sc-logged-sessions` (lib/domain/stats.ts is the one aggregation
 * engine every chart reads through, so the KPIs and charts can never disagree).
 *
 * First-run only: seeds ~12 weeks of sample history if the log is empty, so the charts
 * aren't just empty grey rectangles before a student has logged anything themselves.
 * Real sessions logged via /timer show up here immediately, on top of or instead of
 * the seeded ones.
 */
export default function StatsPage() {
  const [attempt] = useLocalState<Attempt | null>("sc-attempt", null);
  // The sample history is Foundation-specific, so it's only offered to Foundation
  // students — seeding it for an Intermediate or Final student would show them fabricated
  // hours against papers they aren't studying, which reads as real logged data.
  const [sessions] = useSeedOnce<LoggedSession[]>(
    useSyncedArrayState<LoggedSession>(LOG_KEY, [], LOGGED_SESSION_SYNC),
    generateDemoSessions,
    (s) => s.length === 0 && attempt?.level === "foundation",
  );
  const [rounds] = useSyncedRecordState<RevisionRound>(ROUNDS_KEY, {}, REVISION_ROUNDS_SYNC);
  const [range, setRange] = useState<RangeDays>(30);

  // The student's own papers — the per-paper links and the syllabus-revised KPI both
  // used to be fixed to Foundation regardless of the registered level.
  const papers = attempt ? papersForAttempt(attempt.level, attempt.group) : [];

  const kpis = calculateKpis(sessions, range);
  const streak = currentStreak(sessions);
  // Same weighted-by-revision-round calculation used on Syllabus, Roadmap, the
  // Dashboard's pace, and Settings' profile stat (readiness.ts's chapterProgress) — a
  // chapter mid-revision carries partial credit here too, so this KPI can't quietly
  // disagree with every other screen about the same number. (It previously counted
  // only chapters at the strict final-revision round, which read as ~0% even when the
  // other screens correctly showed real partial progress.)
  const readiness = paperReadiness(papers, rounds);
  const revisedPercent =
    readiness.length > 0 ? Math.round(readiness.reduce((sum, r) => sum + r.percent, 0) / readiness.length) : 0;

  const daily = dailyHours(sessions, range === 0 ? 30 : Math.min(range, 30));
  const trend = weeklyTrend(sessions, 8);
  const donut = paperBreakdown(sessions, range);
  const activityRows = activityMixByPaper(sessions, range);
  const heatmap = calendarHeatmap(sessions, 12);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-title text-text">Statistics</h1>
          <Link
            href="/stats/readiness"
            className="rounded-lg border px-3 py-[6px] text-label font-semibold transition-colors"
            style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
          >
            Attempt readiness →
          </Link>
          <Link
            href="/stats/insights"
            className="rounded-lg border border-border px-3 py-[6px] text-label font-semibold text-dim transition-colors hover:border-primary hover:text-primary"
          >
            Insights →
          </Link>
          <Link
            href="/stats/mocks"
            className="rounded-lg border border-border px-3 py-[6px] text-label font-semibold text-dim transition-colors hover:border-primary hover:text-primary"
          >
            Mocks &amp; marks →
          </Link>
        </div>
        <div className="inline-flex gap-[3px] rounded-[11px] border border-border bg-surface2 p-[3px]">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRange(opt.value)}
              className={clsx(
                "rounded-lg px-3 py-[6px] text-label font-semibold transition-colors duration-150",
                range === opt.value ? "bg-primary text-primary-on" : "text-dim hover:text-text",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- KPI row ---- */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Kpi value={kpis.totalHours.toFixed(0)} suffix="h" label="Total hours" />
        <Kpi value={kpis.avgHoursPerDay.toFixed(1)} suffix="h" label="Avg / day" />
        <Kpi value={String(kpis.sessionCount)} label="Sessions" />
        <Kpi value={String(streak)} label="day streak" emoji="🔥" color="var(--streak)" />
        <Kpi value={String(revisedPercent)} suffix="%" label="Syllabus revised" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="01 · Hours per day">
          <BarChart data={daily} targetHours={8} />
        </ChartCard>

        <ChartCard title="02 · Weekly trend">
          <TrendChart data={trend} />
        </ChartCard>

        <ChartCard title="03 · Time by paper">
          <DonutChart slices={donut} totalHours={kpis.totalHours} />
        </ChartCard>

        <ChartCard title="04 · Activity mix by paper">
          <StackedActivityBar rows={activityRows} />
        </ChartCard>

        <ChartCard title="05 · Consistency · last 12 weeks" className="lg:col-span-2">
          <CalendarHeatmap weeks={heatmap} />
        </ChartCard>

        {/* Entry point to E2 — per-paper detail (charts 6–9). */}
        <ChartCard title="Per-paper detail" className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            {papers.map((paper) => (
              <Link
                key={paper.id}
                href={`/stats/paper/${paper.id}`}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-label font-semibold text-text transition-colors hover:border-primary"
              >
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ background: PAPER_CATEGORY_COLOR_VAR[paper.category] }}
                  aria-hidden
                />
                P{paper.paperNo} — {paper.name}
              </Link>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function Kpi({
  value,
  suffix,
  label,
  emoji,
  color = "var(--text)",
}: {
  value: string;
  suffix?: string;
  label: string;
  emoji?: string;
  color?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        {emoji && <span className="text-lg" aria-hidden>{emoji}</span>}
        <div className="tnum text-[22px] font-extrabold" style={{ color }}>
          {value}
          {suffix && <span className="text-[12px] font-semibold text-dim">{suffix}</span>}
        </div>
      </div>
      <div className="mt-[2px] text-caption text-dim">{label}</div>
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
