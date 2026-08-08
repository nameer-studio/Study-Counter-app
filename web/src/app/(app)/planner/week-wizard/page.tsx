"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useLocalState } from "@/lib/hooks/useLocalState";
import { useSyncedArrayState } from "@/lib/hooks/useSyncedArrayState";
import { PLANNED_BLOCK_SYNC } from "@/lib/sync/syncConfigs";
import { papersForAttempt, hasSyllabusData } from "@/lib/icai/levels";
import { nextChapterToStudy } from "@/lib/domain/chapterStats";
import { PAPER_CATEGORY_COLOR_VAR } from "@/lib/domain/types";
import type { Attempt } from "@/lib/domain/attempt";
import { SITUATION_HOURS_STORAGE_KEY, dailyTargetHours, type Situation, type SituationHourOverrides } from "@/lib/domain/profile";
import type { LoggedSession } from "@/lib/domain/loggedSession";
import type { RevisionRound } from "@/lib/domain/types";
import { weekDates, weekdayShort, isoDate, formatDayLabel } from "@/lib/domain/week";
import {
  computePaperWeights,
  distributeWeek,
  recalculateUnlocked,
  weekTableTotal,
  type WeekTable,
  type LockTable,
} from "@/lib/domain/weekWizard";
import { newBlockId, PLANNED_BLOCKS_STORAGE_KEY, type PlannedBlock } from "@/lib/domain/plannedBlock";

const ATTEMPT_KEY = "sc-attempt";
const LOG_KEY = "sc-logged-sessions";
const ROUNDS_KEY = "sc-foundation-rounds";
const SITUATION_KEY = "sc-situation";

/**
 * D5 Plan-your-week wizard — 3 steps: available hours per day → auto-distribution table
 * (paper × day, weighted by outstanding ICAI weightage and neglect — see
 * weekWizard.ts) → lock/adjust → Apply, which writes real PlannedBlocks for the
 * current week via the same store the Planner reads.
 */
export default function WeekWizardPage() {
  const router = useRouter();
  const [attempt, , attemptHydrated] = useLocalState<Attempt | null>(ATTEMPT_KEY, null);
  const [situation, , situationHydrated] = useLocalState<Situation | null>(SITUATION_KEY, null);
  const [hourOverrides] = useLocalState<SituationHourOverrides>(SITUATION_HOURS_STORAGE_KEY, {});
  const [sessions] = useLocalState<LoggedSession[]>(LOG_KEY, []);
  const [rounds] = useLocalState<Record<string, RevisionRound>>(ROUNDS_KEY, {});
  const [, setBlocks] = useSyncedArrayState<PlannedBlock>(PLANNED_BLOCKS_STORAGE_KEY, [], PLANNED_BLOCK_SYNC);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [hoursPerDay, setHoursPerDay] = useState<number[]>(new Array(7).fill(8));
  // `situation` reads null until localStorage hydrates, so the useState initializer
  // above always locks in the 8h fallback rather than the real per-situation target —
  // this effect corrects it exactly once, the same hydration-gating pattern used for
  // "attempt missing" checks elsewhere, just applied to a derived default instead of a
  // redirect.
  const [defaultsApplied, setDefaultsApplied] = useState(false);
  useEffect(() => {
    if (situationHydrated && !defaultsApplied) {
      setHoursPerDay(new Array(7).fill(dailyTargetHours(situation, hourOverrides)));
      setDefaultsApplied(true);
    }
  }, [situationHydrated, defaultsApplied, situation, hourOverrides]);
  const [table, setTable] = useState<WeekTable | null>(null);
  const [locks, setLocks] = useState<LockTable>({});
  const [applied, setApplied] = useState(false);

  if (!attemptHydrated) return null;

  if (!attempt) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
        <div className="text-title text-text">No attempt set up yet</div>
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
        <p className="text-body text-dim">Only Foundation has chapter data seeded right now.</p>
      </div>
    );
  }

  const papers = papersForAttempt(attempt.level, attempt.group);
  const weights = computePaperWeights(papers, rounds, sessions);
  const days = weekDates(new Date());
  const dayLabels = days.map((d, i) => `${weekdayShort(i)} ${formatDayLabel(d)}`);

  function goToStep2() {
    setTable(distributeWeek(weights, hoursPerDay));
    const emptyLocks: LockTable = {};
    for (const w of weights) emptyLocks[w.paperId] = new Array(7).fill(false);
    setLocks(emptyLocks);
    setStep(2);
  }

  function setCell(paperId: string, day: number, hours: number) {
    setTable((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [paperId]: [...prev[paperId]] };
      next[paperId][day] = hours;
      return next;
    });
    setLocks((prev) => ({ ...prev, [paperId]: prev[paperId].map((v, i) => (i === day ? true : v)) }));
  }

  function toggleLock(paperId: string, day: number) {
    setLocks((prev) => ({ ...prev, [paperId]: prev[paperId].map((v, i) => (i === day ? !v : v)) }));
  }

  function recalculate() {
    if (!table) return;
    setTable(recalculateUnlocked(weights, hoursPerDay, table, locks));
  }

  function apply() {
    if (!table) return;
    const newBlocks: PlannedBlock[] = [];
    for (const paper of papers) {
      const chapter = nextChapterToStudy(paper, rounds);
      const round = rounds[chapter.id] ?? "notStarted";
      for (let day = 0; day < 7; day++) {
        const hours = table[paper.id][day];
        if (hours < 0.25) continue; // skip near-zero slivers
        newBlocks.push({
          id: newBlockId(),
          paperId: paper.id,
          chapterId: chapter.id,
          activityType: round === "notStarted" ? "concept" : "revision",
          date: isoDate(days[day]),
          durationMinutes: Math.round(hours * 60),
          completed: false,
        });
      }
    }
    setBlocks((prev) => [...prev, ...newBlocks]);
    setApplied(true);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title text-text">Plan your week</h1>
        <Link href="/planner" className="text-caption font-semibold" style={{ color: "var(--primary)" }}>
          ← Planner
        </Link>
      </div>
      <StepDots current={step} />

      {step === 1 && (
        <Step1
          hoursPerDay={hoursPerDay}
          dayLabels={dayLabels}
          onChange={setHoursPerDay}
          onNext={goToStep2}
        />
      )}

      {step === 2 && table && (
        <Step2
          papers={papers}
          dayLabels={dayLabels}
          table={table}
          locks={locks}
          onCell={setCell}
          onToggleLock={toggleLock}
          onRecalculate={recalculate}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && table && (
        <Step3
          papers={papers}
          rounds={rounds}
          table={table}
          applied={applied}
          onBack={() => setStep(2)}
          onApply={apply}
          onDone={() => router.push("/planner")}
        />
      )}
    </div>
  );
}

function StepDots({ current }: { current: number }) {
  return (
    <div className="mb-6 flex gap-[6px]">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="h-1 flex-1 rounded-full"
          style={{ background: i <= current ? "var(--primary)" : "var(--surface2)" }}
        />
      ))}
    </div>
  );
}

function Step1({
  hoursPerDay,
  dayLabels,
  onChange,
  onNext,
}: {
  hoursPerDay: number[];
  dayLabels: string[];
  onChange: (next: number[]) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <p className="mb-4 text-body text-dim">How many hours can you study each day this week?</p>
      <div className="flex flex-col gap-2">
        {dayLabels.map((label, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface2 px-4 py-[10px]">
            <span className="flex-1 text-label font-semibold text-text">{label}</span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={hoursPerDay[i]}
              onChange={(e) => {
                const next = [...hoursPerDay];
                next[i] = Math.max(0, Number(e.target.value) || 0);
                onChange(next);
              }}
              aria-label={`Hours available ${label}`}
              className="tnum w-20 rounded-lg border border-border bg-surface px-2 py-1 text-label text-text"
            />
            <span className="text-caption text-dim">h</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onNext}
        className="mt-6 w-full rounded-card bg-primary py-4 text-[15px] font-bold text-primary-on"
      >
        Generate distribution
      </button>
    </div>
  );
}

function Step2({
  papers,
  dayLabels,
  table,
  locks,
  onCell,
  onToggleLock,
  onRecalculate,
  onBack,
  onNext,
}: {
  papers: ReturnType<typeof papersForAttempt>;
  dayLabels: string[];
  table: WeekTable;
  locks: LockTable;
  onCell: (paperId: string, day: number, hours: number) => void;
  onToggleLock: (paperId: string, day: number) => void;
  onRecalculate: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <p className="mb-1 text-body text-dim">
        Auto-distributed by outstanding syllabus weightage and neglect. Edit any cell to
        lock it, then recalculate to redistribute the rest.
      </p>
      <p className="tnum mb-4 text-caption text-dim">{weekTableTotal(table).toFixed(1)}h planned this week</p>

      <div className="overflow-x-auto rounded-card-lg border border-border">
        <table className="w-full min-w-[560px] border-collapse text-caption">
          <thead>
            <tr className="border-b border-border bg-surface2">
              <th className="px-3 py-2 text-left font-semibold text-dim">Paper</th>
              {dayLabels.map((label) => (
                <th key={label} className="px-2 py-2 text-center font-semibold text-dim">
                  {label.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {papers.map((paper) => (
              <tr key={paper.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 flex-none rounded-sm"
                      style={{ background: PAPER_CATEGORY_COLOR_VAR[paper.category] }}
                      aria-hidden
                    />
                    <span className="font-semibold text-text">P{paper.paperNo}</span>
                  </span>
                </td>
                {dayLabels.map((_, day) => {
                  const locked = locks[paper.id]?.[day];
                  return (
                    <td key={day} className="px-1 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleLock(paper.id, day)}
                        title={locked ? "Locked — click to unlock" : "Click to lock"}
                        className={clsx(
                          "tnum mx-auto flex h-9 w-14 items-center justify-center rounded-lg border text-[12px] font-semibold",
                          locked ? "border-primary" : "border-border",
                        )}
                        style={locked ? { background: "color-mix(in srgb, var(--primary) 12%, transparent)" } : undefined}
                      >
                        <input
                          type="number"
                          min={0}
                          step={0.25}
                          value={table[paper.id][day]}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onCell(paper.id, day, Math.max(0, Number(e.target.value) || 0))}
                          aria-label={`${paper.name} hours on ${dayLabels[day]}`}
                          className="tnum w-full bg-transparent text-center text-text outline-none"
                        />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={onRecalculate}
        className="mt-3 rounded-lg border border-border px-4 py-2 text-label font-semibold text-dim hover:border-primary hover:text-primary"
      >
        Recalculate unlocked cells
      </button>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-card border border-border py-3 text-[15px] font-semibold text-text"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-card bg-primary py-3 text-[15px] font-bold text-primary-on"
        >
          Review
        </button>
      </div>
    </div>
  );
}

function Step3({
  papers,
  rounds,
  table,
  applied,
  onBack,
  onApply,
  onDone,
}: {
  papers: ReturnType<typeof papersForAttempt>;
  rounds: Record<string, RevisionRound>;
  table: WeekTable;
  applied: boolean;
  onBack: () => void;
  onApply: () => void;
  onDone: () => void;
}) {
  const total = weekTableTotal(table);

  if (applied) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="text-title text-text">Week planned ✓</div>
        <p className="tnum text-body text-dim">{total.toFixed(1)}h added across this week.</p>
        <button
          type="button"
          onClick={onDone}
          className="mt-2 rounded-card bg-primary px-6 py-3 text-[15px] font-bold text-primary-on"
        >
          Go to Planner
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-body text-dim">
        This applies as {papers.filter((p) => table[p.id].some((h) => h >= 0.25)).length} papers&rsquo;
        worth of blocks onto your current week — each scheduled against the next chapter
        due for that paper.
      </p>
      <div className="flex flex-col gap-2">
        {papers.map((paper) => {
          const chapter = nextChapterToStudy(paper, rounds);
          const paperTotal = table[paper.id].reduce((s, h) => s + h, 0);
          if (paperTotal < 0.25) return null;
          return (
            <div key={paper.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface2 px-4 py-3">
              <span
                className="h-2 w-2 flex-none rounded-sm"
                style={{ background: PAPER_CATEGORY_COLOR_VAR[paper.category] }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-label font-semibold text-text">
                P{paper.paperNo} · {chapter.name}
              </span>
              <span className="tnum text-caption font-semibold text-dim">{paperTotal.toFixed(1)}h</span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-card border border-border py-3 text-[15px] font-semibold text-text"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex-1 rounded-card bg-primary py-3 text-[15px] font-bold text-primary-on"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
