"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useLocalState } from "@/lib/hooks/useLocalState";
import { useSyncedArrayState } from "@/lib/hooks/useSyncedArrayState";
import { PLANNED_BLOCK_SYNC } from "@/lib/sync/syncConfigs";
import type { PaperSeed } from "@/lib/icai/foundation";
import { papersForAttempt } from "@/lib/icai/levels";
import {
  newBlockId,
  totalMinutes,
  formatHours,
  timeToMinutes,
  PLANNED_BLOCKS_STORAGE_KEY,
  type PlannedBlock,
} from "@/lib/domain/plannedBlock";
import {
  addWeeks,
  formatDayLabel,
  formatWeekRange,
  isToday,
  isoDate,
  startOfWeek,
  weekDates,
  weekdayShort,
} from "@/lib/domain/week";
import {
  ACTIVITY_EMOJI,
  ACTIVITY_TYPES,
  PAPER_CATEGORY_COLOR_VAR,
  type ActivityType,
} from "@/lib/domain/types";
import type { LoggedSession } from "@/lib/domain/loggedSession";
import type { Attempt } from "@/lib/domain/attempt";
import type { Situation } from "@/lib/domain/profile";

const LOG_KEY = "sc-logged-sessions";
const ATTEMPT_KEY = "sc-attempt";
const SITUATION_KEY = "sc-situation";

type ViewMode = "week" | "day" | "month";

/**
 * D1–D3 Planner — week grid (D1), a genuine hour-labeled day timeline (D2), and a
 * month intensity calendar (D3), sharing one `PlannedBlock` store. Real add/complete/
 * delete against localStorage, not fixture data.
 */
export default function PlannerPage() {
  const [blocks, setBlocks] = useSyncedArrayState<PlannedBlock>(PLANNED_BLOCKS_STORAGE_KEY, [], PLANNED_BLOCK_SYNC);
  const [sessions] = useLocalState<LoggedSession[]>(LOG_KEY, []);
  const [attempt] = useLocalState<Attempt | null>(ATTEMPT_KEY, null);
  const [situation] = useLocalState<Situation | null>(SITUATION_KEY, null);

  // The paper picker (and every paper/chapter lookup below) tracks whatever level and
  // group the student actually registered for — a Final student must never see
  // Foundation's Accounting chapters in the add-block form just because that's the
  // only level with real chapter data seeded so far.
  const papers = attempt ? papersForAttempt(attempt.level, attempt.group) : [];

  const [view, setView] = useState<ViewMode>("week");
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  function addBlock(date: string, block: Omit<PlannedBlock, "id" | "date" | "completed">) {
    setBlocks((prev) => [...prev, { ...block, id: newBlockId(), date, completed: false }]);
  }
  function toggleComplete(id: string) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b)));
  }
  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function jumpToDay(date: Date) {
    setSelectedDate(date);
    setView("day");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title text-text">Planner</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Link href="/planner/roadmap" className="text-caption font-semibold" style={{ color: "var(--primary)" }}>
              Attempt roadmap →
            </Link>
            <Link href="/planner/week-wizard" className="text-caption font-semibold" style={{ color: "var(--primary)" }}>
              Plan my week →
            </Link>
          </div>
        </div>
        <ViewSwitcher view={view} onChange={setView} />
      </div>

      {view === "week" && (
        <WeekView
          blocks={blocks}
          papers={papers}
          weekAnchor={weekAnchor}
          onWeekAnchor={setWeekAnchor}
          onAdd={addBlock}
          onToggle={toggleComplete}
          onRemove={removeBlock}
        />
      )}

      {view === "day" && (
        <DayView
          blocks={blocks}
          sessions={sessions}
          papers={papers}
          date={selectedDate}
          onDateChange={setSelectedDate}
          onAdd={addBlock}
          onToggle={toggleComplete}
          onRemove={removeBlock}
        />
      )}

      {view === "month" && (
        <MonthView
          blocks={blocks}
          sessions={sessions}
          attempt={attempt}
          situation={situation}
          onSelectDay={jumpToDay}
        />
      )}
    </div>
  );
}

function ViewSwitcher({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const options: { key: ViewMode; label: string }[] = [
    { key: "day", label: "Day" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
  ];
  return (
    <div className="inline-flex gap-[3px] rounded-[11px] border border-border bg-surface2 p-[3px]">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={clsx(
            "rounded-lg px-4 py-2 text-label font-semibold transition-colors duration-150",
            view === o.key ? "bg-primary text-primary-on" : "text-dim hover:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* =========================================================================
 * D1 · Week view
 * ========================================================================= */

function WeekView({
  blocks,
  papers,
  weekAnchor,
  onWeekAnchor,
  onAdd,
  onToggle,
  onRemove,
}: {
  blocks: PlannedBlock[];
  papers: PaperSeed[];
  weekAnchor: Date;
  onWeekAnchor: (updater: (d: Date) => Date) => void;
  onAdd: (date: string, block: Omit<PlannedBlock, "id" | "date" | "completed">) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [addingForDate, setAddingForDate] = useState<string | null>(null);
  const days = weekDates(weekAnchor);
  const weekStart = startOfWeek(weekAnchor);
  const weekIsos = days.map(isoDate);
  const weekBlocks = blocks.filter((b) => weekIsos.includes(b.date));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="tnum text-caption text-dim">{formatWeekRange(weekStart)}</p>
        <div className="flex items-center gap-2">
          <span className="tnum rounded-full border border-border bg-surface2 px-3 py-[6px] text-label font-semibold text-text">
            {formatHours(totalMinutes(weekBlocks))} planned this week
          </span>
          <button
            type="button"
            onClick={() => onWeekAnchor((d) => addWeeks(d, -1))}
            className="rounded-lg border border-border bg-surface2 px-3 py-[6px] text-label font-semibold text-text hover:bg-surface"
            aria-label="Previous week"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => onWeekAnchor(() => new Date())}
            className="rounded-lg border border-border bg-surface2 px-3 py-[6px] text-label font-semibold text-text hover:bg-surface"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onWeekAnchor((d) => addWeeks(d, 1))}
            className="rounded-lg border border-border bg-surface2 px-3 py-[6px] text-label font-semibold text-text hover:bg-surface"
            aria-label="Next week"
          >
            →
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-3 lg:overflow-x-auto lg:pb-2">
        {days.map((day, i) => {
          const dateIso = isoDate(day);
          const dayBlocks = blocks.filter((b) => b.date === dateIso);
          return (
            <DayColumn
              key={dateIso}
              date={dateIso}
              label={`${weekdayShort(i)} ${formatDayLabel(day)}`}
              today={isToday(day)}
              blocks={dayBlocks}
              papers={papers}
              isAdding={addingForDate === dateIso}
              onStartAdd={() => setAddingForDate(dateIso)}
              onCancelAdd={() => setAddingForDate(null)}
              onAdd={(block) => {
                onAdd(dateIso, block);
                setAddingForDate(null);
              }}
              onToggle={onToggle}
              onRemove={onRemove}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayColumn({
  date,
  label,
  today,
  blocks,
  papers,
  isAdding,
  onStartAdd,
  onCancelAdd,
  onAdd,
  onToggle,
  onRemove,
}: {
  date: string;
  label: string;
  today: boolean;
  blocks: PlannedBlock[];
  papers: PaperSeed[];
  isAdding: boolean;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onAdd: (block: Omit<PlannedBlock, "id" | "date" | "completed">) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2 rounded-card-lg border border-border bg-surface p-3 lg:w-[180px] lg:flex-none">
      <div className="flex items-center justify-between">
        <span className={clsx("text-label font-bold", today ? "text-primary" : "text-text")}>{label}</span>
        {blocks.length > 0 && <span className="tnum text-caption text-dim">{formatHours(totalMinutes(blocks))}</span>}
      </div>

      <div className="flex flex-col gap-1">
        {blocks.map((block) => (
          <BlockRow key={block.id} block={block} papers={papers} onToggle={() => onToggle(block.id)} onRemove={() => onRemove(block.id)} />
        ))}
      </div>

      {isAdding ? (
        <AddBlockForm papers={papers} onAdd={onAdd} onCancel={onCancelAdd} />
      ) : (
        <button
          type="button"
          onClick={onStartAdd}
          className="rounded-lg border border-dashed border-border px-2 py-[6px] text-caption font-semibold text-dim hover:border-primary hover:text-primary"
        >
          + Add block
        </button>
      )}
    </div>
  );
}

function BlockRow({
  block,
  papers,
  onToggle,
  onRemove,
}: {
  block: PlannedBlock;
  papers: PaperSeed[];
  onToggle: () => void;
  onRemove: () => void;
}) {
  const paper = papers.find((p) => p.id === block.paperId);
  const chapter = paper?.chapters.find((c) => c.id === block.chapterId);
  const color = paper ? PAPER_CATEGORY_COLOR_VAR[paper.category] : "var(--grey)";

  return (
    <div className="group flex items-start gap-2 rounded-lg bg-surface2 px-2 py-[6px]">
      <button
        type="button"
        onClick={onToggle}
        aria-label={block.completed ? "Mark incomplete" : "Mark complete"}
        className="mt-[2px] flex h-4 w-4 flex-none items-center justify-center rounded-full border-2"
        style={{
          borderColor: block.completed ? "var(--green)" : color,
          background: block.completed ? "var(--green)" : "transparent",
        }}
      >
        {block.completed && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--primary-on)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div
          className={clsx("truncate text-caption font-semibold", block.completed && "line-through")}
          style={{ color: block.completed ? "var(--dim)" : "var(--text)" }}
        >
          <span aria-hidden>{ACTIVITY_EMOJI[block.activityType]}</span> {chapter?.name ?? "Chapter"}
          {block.startTime && <span className="tnum ml-1 text-[9px] text-dim">{block.startTime}</span>}
        </div>
        <div className="tnum text-[10px] text-dim">
          {paper ? `P${paper.paperNo}` : ""} · {formatHours(block.durationMinutes)}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove block"
        className="flex-none text-dim opacity-0 transition-opacity group-hover:opacity-100 hover:text-red"
      >
        ×
      </button>
    </div>
  );
}

function AddBlockForm({
  papers,
  onAdd,
  onCancel,
  defaultStartTime,
}: {
  papers: PaperSeed[];
  onAdd: (block: Omit<PlannedBlock, "id" | "date" | "completed">) => void;
  onCancel: () => void;
  defaultStartTime?: string;
}) {
  // Only papers with chapter data are selectable — Intermediate and Final currently
  // carry paper identity but no chapters (see icai/levels.ts), so offering them here
  // would either crash on `chapters[0]` or silently let a block point at nothing.
  const schedulable = papers.filter((p) => p.chapters.length > 0);
  const [paperId, setPaperId] = useState(schedulable[0]?.id ?? "");
  const paper = schedulable.find((p) => p.id === paperId);
  const [chapterId, setChapterId] = useState(paper?.chapters[0]?.id ?? "");
  const [activityType, setActivityType] = useState<ActivityType>("concept");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startTime, setStartTime] = useState(defaultStartTime ?? "");

  function handlePaperChange(nextId: string) {
    setPaperId(nextId);
    setChapterId(schedulable.find((p) => p.id === nextId)?.chapters[0]?.id ?? "");
  }

  if (schedulable.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface2 p-2">
        <p className="text-[10px] leading-[1.4] text-dim">
          Chapter data isn&rsquo;t loaded for your level yet, so a block can&rsquo;t be
          scheduled against a specific chapter.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border py-1 text-[11px] font-semibold text-dim"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd({ paperId, chapterId, activityType, durationMinutes, startTime: startTime || undefined });
      }}
      className="flex flex-col gap-2 rounded-lg border border-border bg-surface2 p-2"
    >
      <select
        value={paperId}
        onChange={(e) => handlePaperChange(e.target.value)}
        className="w-full rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-text"
      >
        {schedulable.map((p) => (
          <option key={p.id} value={p.id}>
            P{p.paperNo} — {p.name}
          </option>
        ))}
      </select>
      <select
        value={chapterId}
        onChange={(e) => setChapterId(e.target.value)}
        className="w-full rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-text"
      >
        {paper?.chapters.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-1">
        {ACTIVITY_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActivityType(t)}
            className={clsx(
              "rounded-full px-2 py-[3px] text-[10px] font-semibold",
              activityType === t ? "bg-primary text-primary-on" : "border border-border text-dim",
            )}
          >
            {ACTIVITY_EMOJI[t]}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={15}
          step={15}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Math.max(15, Number(e.target.value) || 15))}
          className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-text"
          aria-label="Duration in minutes"
        />
        <span className="text-[10px] text-dim">min at</span>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="tnum flex-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-text"
          aria-label="Start time (optional)"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-md bg-primary py-1 text-[11px] font-bold text-primary-on">
          Add
        </button>
        <button type="button" onClick={onCancel} className="flex-1 rounded-md border border-border py-1 text-[11px] font-semibold text-dim">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* =========================================================================
 * D2 · Day view — a real hour-labeled timeline
 * ========================================================================= */

const DAY_START_HOUR = 5;
const DAY_END_HOUR = 23;

function DayView({
  blocks,
  sessions,
  papers,
  date,
  onDateChange,
  onAdd,
  onToggle,
  onRemove,
}: {
  blocks: PlannedBlock[];
  sessions: LoggedSession[];
  papers: PaperSeed[];
  date: Date;
  onDateChange: (d: Date) => void;
  onAdd: (date: string, block: Omit<PlannedBlock, "id" | "date" | "completed">) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [addingHour, setAddingHour] = useState<number | null>(null);
  const dateIso = isoDate(date);

  const dayBlocks = blocks.filter((b) => b.date === dateIso);
  const scheduled = dayBlocks.filter((b) => b.startTime);
  const unscheduled = dayBlocks.filter((b) => !b.startTime);
  const daySessions = sessions.filter((s) => isoDate(new Date(s.endedAt)) === dateIso);

  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);

  const gap = findLargestGap(scheduled, daySessions, DAY_START_HOUR, DAY_END_HOUR);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onDateChange(addDays(date, -1))}
          className="rounded-lg border border-border bg-surface2 px-3 py-[6px] text-label font-semibold text-text hover:bg-surface"
          aria-label="Previous day"
        >
          ←
        </button>
        <div className="text-center">
          <div className={clsx("text-label font-bold", isToday(date) ? "text-primary" : "text-text")}>
            {weekdayShort((date.getDay() + 6) % 7)} {formatDayLabel(date)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDateChange(addDays(date, 1))}
          className="rounded-lg border border-border bg-surface2 px-3 py-[6px] text-label font-semibold text-text hover:bg-surface"
          aria-label="Next day"
        >
          →
        </button>
      </div>

      {unscheduled.length > 0 && (
        <div className="mb-4 rounded-card-lg border border-border bg-surface p-3">
          <div className="mb-2 text-overline uppercase text-dim">Unscheduled today</div>
          <div className="flex flex-col gap-1">
            {unscheduled.map((block) => (
              <BlockRow key={block.id} block={block} papers={papers} onToggle={() => onToggle(block.id)} onRemove={() => onRemove(block.id)} />
            ))}
          </div>
        </div>
      )}

      {gap && (
        <div
          className="mb-4 flex items-center justify-between gap-3 rounded-card p-3"
          style={{ background: "color-mix(in srgb, var(--amber) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--amber) 30%, transparent)" }}
        >
          <span className="text-caption text-text">
            {gap.hours}h free between {formatHour(gap.startHour)} and {formatHour(gap.endHour)}.
          </span>
          <button
            type="button"
            onClick={() => setAddingHour(gap.startHour)}
            className="flex-none rounded-lg border px-3 py-[6px] text-[11px] font-semibold"
            style={{ borderColor: "var(--amber)", color: "var(--amber)" }}
          >
            Schedule it
          </button>
        </div>
      )}

      <div className="rounded-card-lg border border-border bg-surface">
        {hours.map((hour) => {
          const items = [
            ...scheduled
              .filter((b) => Math.floor(timeToMinutes(b.startTime!) / 60) === hour)
              .map((b) => ({ kind: "block" as const, block: b })),
            ...daySessions
              .filter((s) => new Date(s.endedAt - s.durationMs).getHours() === hour)
              .map((s) => ({ kind: "session" as const, session: s })),
          ];
          return (
            <div key={hour} className="flex min-h-[52px] items-stretch gap-3 border-b border-border px-3 py-2 last:border-0">
              <span className="tnum w-12 flex-none pt-1 text-[11px] text-dim">{formatHour(hour)}</span>
              <div className="flex flex-1 flex-col gap-1 py-[2px]">
                {items.map((item, i) =>
                  item.kind === "block" ? (
                    <BlockRow
                      key={`b-${i}`}
                      block={item.block}
                      papers={papers}
                      onToggle={() => onToggle(item.block.id)}
                      onRemove={() => onRemove(item.block.id)}
                    />
                  ) : (
                    <LoggedSessionChip key={`s-${i}`} session={item.session} papers={papers} />
                  ),
                )}
                {items.length === 0 && addingHour !== hour && (
                  <button
                    type="button"
                    onClick={() => setAddingHour(hour)}
                    className="self-start rounded-md px-2 py-[2px] text-[10px] font-semibold text-dim opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
                  >
                    + add
                  </button>
                )}
                {addingHour === hour && (
                  <AddBlockForm
                    papers={papers}
                    defaultStartTime={`${hour.toString().padStart(2, "0")}:00`}
                    onAdd={(block) => {
                      onAdd(dateIso, block);
                      setAddingHour(null);
                    }}
                    onCancel={() => setAddingHour(null)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoggedSessionChip({ session, papers }: { session: LoggedSession; papers: PaperSeed[] }) {
  const paper = papers.find((p) => p.id === session.paperId);
  const chapter = paper?.chapters.find((c) => c.id === session.chapterId);
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-[6px]" style={{ background: "color-mix(in srgb, var(--green) 10%, transparent)" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span className="truncate text-caption font-semibold" style={{ color: "var(--dim)", textDecoration: "line-through" }}>
        {chapter?.name ?? "Session"}
      </span>
      <span className="tnum ml-auto flex-none text-[10px] text-dim">{(session.durationMs / 3_600_000).toFixed(1)}h</span>
    </div>
  );
}

function findLargestGap(
  scheduled: PlannedBlock[],
  sessions: LoggedSession[],
  startHour: number,
  endHour: number,
): { startHour: number; endHour: number; hours: number } | null {
  const occupied = new Set<number>();
  for (const b of scheduled) {
    if (!b.startTime) continue;
    const start = Math.floor(timeToMinutes(b.startTime) / 60);
    const span = Math.ceil(b.durationMinutes / 60);
    for (let h = start; h < start + span; h++) occupied.add(h);
  }
  for (const s of sessions) {
    const start = new Date(s.endedAt - s.durationMs).getHours();
    const span = Math.ceil(s.durationMs / 3_600_000);
    for (let h = start; h < start + span; h++) occupied.add(h);
  }

  let best: { startHour: number; endHour: number; hours: number } | null = null;
  let runStart: number | null = null;
  for (let h = startHour; h <= endHour + 1; h++) {
    const free = h <= endHour && !occupied.has(h);
    if (free && runStart === null) runStart = h;
    if (!free && runStart !== null) {
      const length = h - runStart;
      if (length >= 2 && (!best || length > best.hours)) best = { startHour: runStart, endHour: h, hours: length };
      runStart = null;
    }
  }
  return best;
}

function formatHour(hour: number): string {
  const h = hour % 24;
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/* =========================================================================
 * D3 · Month view
 * ========================================================================= */

function MonthView({
  blocks,
  sessions,
  attempt,
  situation,
  onSelectDay,
}: {
  blocks: PlannedBlock[];
  sessions: LoggedSession[];
  attempt: Attempt | null;
  situation: Situation | null;
  onSelectDay: (d: Date) => void;
}) {
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const examDates = new Set(Object.values(attempt?.paperDates ?? {}));
  const leaveStart = situation?.leaveStartDate;

  const minutesByDate = new Map<string, number>();
  for (const b of blocks) minutesByDate.set(b.date, (minutesByDate.get(b.date) ?? 0) + b.durationMinutes);
  for (const s of sessions) {
    const d = isoDate(new Date(s.endedAt));
    minutesByDate.set(d, (minutesByDate.get(d) ?? 0) + s.durationMs / 60_000);
  }
  const maxMinutes = Math.max(1, ...minutesByDate.values());

  const cells: (Date | null)[] = [...Array(startWeekday).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthAnchor(new Date(year, month - 1, 1))}
          className="rounded-lg border border-border bg-surface2 px-3 py-[6px] text-label font-semibold text-text hover:bg-surface"
        >
          ←
        </button>
        <div className="text-label font-bold text-text">
          {firstOfMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </div>
        <button
          type="button"
          onClick={() => setMonthAnchor(new Date(year, month + 1, 1))}
          className="rounded-lg border border-border bg-surface2 px-3 py-[6px] text-label font-semibold text-text hover:bg-surface"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-dim">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const iso = isoDate(date);
          const minutes = minutesByDate.get(iso) ?? 0;
          const intensity = minutes / maxMinutes;
          const isExam = examDates.has(iso);
          const isLeaveStart = leaveStart === iso;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDay(date)}
              className={clsx(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border text-[11px]",
                isToday(date) ? "border-primary" : "border-border",
              )}
            >
              <span className="tnum text-text">{date.getDate()}</span>
              <span
                className="h-[6px] w-[6px] rounded-full"
                style={{ background: minutes > 0 ? `color-mix(in srgb, var(--primary) ${Math.round(30 + intensity * 70)}%, transparent)` : "transparent" }}
                aria-hidden
              />
              {isExam && (
                <span className="text-[8px] font-bold" style={{ color: "var(--red)" }}>
                  EXAM
                </span>
              )}
              {isLeaveStart && (
                <span className="text-[8px] font-bold" style={{ color: "var(--green)" }}>
                  LEAVE
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
