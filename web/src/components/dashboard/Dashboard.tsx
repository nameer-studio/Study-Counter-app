"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { paceColorVar } from "@/lib/domain/pace";
import {
  ACTIVITY_EMOJI,
  PAPER_CATEGORY_COLOR_VAR,
} from "@/lib/domain/types";
import type { DashboardData } from "@/lib/fixtures/dashboard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { PaceBadge } from "@/components/ui/PaceBadge";
import { useSyncedArrayState } from "@/lib/hooks/useSyncedArrayState";
import { PLANNED_BLOCK_SYNC } from "@/lib/sync/syncConfigs";
import {
  newBlockId,
  PLANNED_BLOCKS_STORAGE_KEY,
  type PlannedBlock,
} from "@/lib/domain/plannedBlock";
import { isoDate } from "@/lib/domain/week";

/**
 * B1 Dashboard — the hero screen, ported from `Dashboard.dc.html`.
 *
 * Responsive per WEB_PLAN.md §2.2: single column on mobile (matching the design's
 * 390px phone frame), two columns from `lg` up — countdown/ring/CTA left, plan and
 * charts right. The dual countdown stays the largest type on the page in both layouts.
 */
export function Dashboard({ data }: { data: DashboardData }) {
  const paceColor = paceColorVar(data.pace);
  const pct = data.targetHours > 0 ? data.doneHours / data.targetHours : 0;
  const paperColor = PAPER_CATEGORY_COLOR_VAR[data.paperCategory];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Greeting data={data} />

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr] lg:items-start">
        {/* ---- Left column ---- */}
        <div className="flex flex-col gap-3">
          <CountdownCard data={data} paperColor={paperColor} />
          <TodayRingCard data={data} pct={pct} paceColor={paceColor} />
          <StartCta data={data} />
          {data.alert && <NeglectAlertCard alert={data.alert} />}
        </div>

        {/* ---- Right column ---- */}
        <div className="flex flex-col gap-3">
          <TodayPlanCard data={data} />
          <WeekChartCard data={data} paceColor={paceColor} />
          <StudyingNowStrip data={data} />
        </div>
      </div>
    </div>
  );
}

function Greeting({ data }: { data: DashboardData }) {
  const streakOn = data.streakCount > 0;
  const streakColor = streakOn ? "var(--streak)" : "var(--grey)";
  return (
    <div className="flex items-start justify-between px-[2px]">
      <div>
        <div className="text-label text-dim">{data.greeting}</div>
        <div className="text-[20px] font-bold tracking-[-0.01em] text-text">{data.name}</div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="tnum inline-flex items-center gap-[5px] rounded-full px-[10px] py-[5px] text-label font-bold"
          style={{ color: streakColor, backgroundColor: `color-mix(in srgb, ${streakColor} 16%, transparent)` }}
          title={streakOn ? `${data.streakCount}-day streak` : "No active streak"}
        >
          <span aria-hidden>🔥</span>
          {data.streakCount}
        </span>
        {/* The sidebar covers desktop; mobile has no header/drawer, so this is the one
            reachable entry point to Settings on a narrow viewport. */}
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-dim lg:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V19a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.6 17.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4 13H3.9a2 2 0 1 1 0-4H4a1.6 1.6 0 0 0 1.5-2.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 4.6V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 20 11h.1a2 2 0 1 1 0 4z" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function CountdownCard({
  data,
  paperColor,
}: {
  data: DashboardData;
  paperColor: string;
}) {
  return (
    <section className="rounded-card-lg border border-border bg-surface px-[18px] py-5">
      <div className="flex items-center justify-between">
        <span className="text-overline uppercase text-dim">Days to attempt</span>
        <Link href="/attempt" className="text-[10px] font-semibold" style={{ color: "var(--primary)" }}>
          My attempt →
        </Link>
      </div>
      <div className="mt-[6px] flex items-baseline gap-3">
        <div className="tnum text-hero text-text sm:text-[92px]">{data.daysToAttempt}</div>
        <div className="pb-[6px]">
          <div className="text-[14px] font-semibold text-text">days</div>
          <div className="mt-[2px] text-caption text-dim">{data.attemptLabel}</div>
        </div>
      </div>

      {/* Second countdown — the paper actually sitting next, which is what a student
          plans tomorrow around. */}
      <div className="mt-[14px] flex items-center gap-2 border-t border-border pt-[14px]">
        <span className="h-2 w-2 flex-none rounded-sm" style={{ background: paperColor }} aria-hidden />
        <span className="tnum text-[15px] font-bold text-text">{data.daysToPaper} days</span>
        <span className="text-label text-dim">
          to Paper 1 · {data.paperName}
        </span>
      </div>

      <div className="mt-4">
        <PaceBadge state={data.pace} />
      </div>
      <p className="mt-3 text-label leading-[1.5]" style={{ color: "color-mix(in srgb, var(--text) 78%, transparent)" }}>
        {data.reframe}
      </p>
    </section>
  );
}

function TodayRingCard({
  data,
  pct,
  paceColor,
}: {
  data: DashboardData;
  pct: number;
  paceColor: string;
}) {
  return (
    <section className="flex items-center gap-[18px] rounded-card-lg border border-border bg-surface px-[18px] py-4">
      <ProgressRing
        progress={pct}
        color={paceColor}
        centerLabel={String(data.doneHours)}
        centerSub={`/ ${data.targetHours}h`}
      />
      <div className="flex-1">
        <div className="text-overline uppercase text-dim">Today</div>
        <div className="mt-1 text-[17px] font-bold text-text">
          {data.doneHours}h of {data.targetHours}h done
        </div>
        <div className="mt-[6px] text-caption text-dim">{data.situationLabel}</div>
        <div className="tnum mt-[2px] text-caption font-semibold" style={{ color: paceColor }}>
          {Math.round(pct * 100)}% of today&rsquo;s target
        </div>
      </div>
    </section>
  );
}

function StartCta({ data }: { data: DashboardData }) {
  const href = `/timer?paper=${data.ctaPaperId}&chapter=${data.ctaChapterId}&activity=${data.ctaActivityType}`;
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-center gap-[10px] rounded-card bg-primary p-4 text-primary-on transition-[filter] duration-150 hover:brightness-110"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M8 5v14l11-7z" />
      </svg>
      <span className="text-left">
        <span className="block text-[15px] font-bold">{data.ctaTitle}</span>
        <span className="block text-[11px] font-medium opacity-70">{data.ctaSub}</span>
      </span>
    </Link>
  );
}

function NeglectAlertCard({ alert }: { alert: NonNullable<DashboardData["alert"]> }) {
  const tone = alert.tone === "red" ? "var(--red)" : "var(--amber)";
  const [blocks, setBlocks] = useSyncedArrayState<PlannedBlock>(PLANNED_BLOCKS_STORAGE_KEY, [], PLANNED_BLOCK_SYNC);
  const [justScheduled, setJustScheduled] = useState(false);

  // "Schedule 2h" / "Add 1h" writes a real block onto today in the same store the
  // Planner reads — this used to be a bare <button> with no handler at all, so nothing
  // happened when clicked. Guards against double-adding on a second click without
  // navigating away (`blocks` still holds it after the first write).
  const today = isoDate(new Date());
  const alreadyScheduledToday = blocks.some(
    (b) => b.date === today && b.paperId === alert.paperId && b.chapterId === alert.chapterId,
  );

  function scheduleNow() {
    if (alreadyScheduledToday) return;
    setBlocks((prev) => [
      ...prev,
      {
        id: newBlockId(),
        paperId: alert.paperId,
        chapterId: alert.chapterId,
        activityType: alert.activityType,
        date: today,
        durationMinutes: alert.durationMinutes,
        completed: false,
      },
    ]);
    setJustScheduled(true);
  }

  const scheduled = justScheduled || alreadyScheduledToday;

  return (
    <section
      className="flex items-start gap-3 rounded-card p-[14px]"
      style={{
        backgroundColor: `color-mix(in srgb, ${tone} 8%, transparent)`,
        border: `1px solid color-mix(in srgb, ${tone} 27%, transparent)`,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth="2" className="mt-[1px] flex-none" aria-hidden>
        <path d="M12 9v4M12 17h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      </svg>
      <div className="flex-1">
        <div className="text-body font-bold text-text">{alert.text}</div>
        <div className="mt-[2px] text-caption leading-[1.4] text-dim">{alert.sub}</div>
      </div>
      <button
        type="button"
        onClick={scheduleNow}
        disabled={scheduled}
        className="flex-none whitespace-nowrap rounded-[10px] border px-3 py-[7px] text-caption font-semibold disabled:opacity-60"
        style={{ borderColor: tone, color: tone }}
      >
        {scheduled ? "Scheduled ✓" : alert.action}
      </button>
    </section>
  );
}

function TodayPlanCard({ data }: { data: DashboardData }) {
  const doneCount = data.blocks.filter((b) => b.done).length;
  const totalHours = data.blocks.reduce((sum, b) => sum + parseFloat(b.durationLabel), 0);

  return (
    <section className="rounded-card-lg border border-border bg-surface px-[18px] py-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-body font-bold text-text">Today&rsquo;s plan</span>
        <span className="tnum text-caption text-dim">
          {doneCount} of {data.blocks.length} · {totalHours}h
        </span>
      </div>
      {data.blocks.length === 0 && (
        <p className="text-caption text-dim">
          Nothing planned for today yet.{" "}
          <Link href="/planner" className="font-semibold" style={{ color: "var(--primary)" }}>
            Add a block
          </Link>
          .
        </p>
      )}
      <ul className="-mx-2">
        {data.blocks.map((block, i) => (
          <li
            key={i}
            className={clsx(
              "flex items-center gap-3 rounded-xl px-2 py-[9px]",
              block.urgent && "bg-red/[0.08]",
            )}
            style={block.urgent ? { backgroundColor: "color-mix(in srgb, var(--red) 8%, transparent)" } : undefined}
          >
            <span
              className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-[11px] font-bold"
              style={{
                border: `2px solid ${block.done ? "var(--green)" : block.urgent ? "var(--red)" : "#3A4050"}`,
                background: block.done ? "var(--green)" : "transparent",
                color: "var(--primary-on)",
              }}
              aria-hidden
            >
              {block.done ? "✓" : ""}
            </span>
            <span className="flex-none text-base" aria-hidden>
              {ACTIVITY_EMOJI[block.activity]}
            </span>
            <span
              className={clsx("flex-1 text-body font-semibold", block.done && "line-through")}
              style={{ color: block.done ? "var(--dim)" : "var(--text)" }}
            >
              {block.label}
            </span>
            <span
              className="h-[7px] w-[7px] flex-none rounded-sm"
              style={{ background: PAPER_CATEGORY_COLOR_VAR[block.paper] }}
              aria-hidden
            />
            <span
              className="tnum flex-none text-caption font-semibold"
              style={{ color: block.urgent ? "var(--red)" : "var(--dim)" }}
            >
              {block.durationLabel}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WeekChartCard({ data, paceColor }: { data: DashboardData; paceColor: string }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const chartHeight = 64;
  const scaleMax = 12; // hours — matches the design's fixed 12h ceiling
  const targetY = Math.round((chartHeight * data.targetHours) / scaleMax);

  return (
    <section className="rounded-card-lg border border-border bg-surface px-[18px] py-4">
      <div className="mb-[14px] flex items-baseline justify-between">
        <span className="text-body font-bold text-text">This week</span>
        <span className="tnum text-caption text-dim">target {data.targetHours}h/day</span>
      </div>
      <div className="relative flex items-end justify-between" style={{ height: chartHeight }}>
        {/* Target line — dashed, so a bar clearing it reads instantly. */}
        <div
          className="absolute left-0 right-0 border-t border-dashed"
          style={{ bottom: targetY, borderColor: "#3A4050" }}
          aria-hidden
        />
        {data.week.map((hours, i) => {
          const isToday = i === data.week.length - 1;
          const h = Math.max(3, Math.round((chartHeight * hours) / scaleMax));
          return (
            <div key={i} className="flex w-3 items-end" style={{ height: chartHeight }}>
              <div
                className="w-3 rounded-[3px]"
                style={{ height: h, background: isToday ? paceColor : "var(--border)" }}
                title={`${days[i]}: ${hours}h`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between">
        {days.map((d, i) => (
          <span key={i} className="w-3 text-center text-[10px] font-semibold text-dim">
            {d}
          </span>
        ))}
      </div>
    </section>
  );
}

function StudyingNowStrip({ data }: { data: DashboardData }) {
  // Friends/presence is a Phase 3 feature — no backend exists yet to actually know who's
  // studying. An honest empty state here, not a bare header over nothing.
  if (data.friends.length === 0) {
    return (
      <section className="rounded-card-lg border border-dashed border-border px-4 py-3 text-center">
        <p className="text-caption text-dim">
          Friends &amp; live status are coming in a future update.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-[10px] text-overline uppercase text-dim">Studying now</div>
      <div className="flex gap-[10px]">
        {data.friends.map((f) => (
          <div
            key={f.name}
            className="flex flex-1 flex-col items-center gap-[7px] rounded-[14px] border border-border bg-surface px-[10px] py-3"
          >
            <div className="relative">
              <div
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-caption font-bold"
                style={{ background: PAPER_CATEGORY_COLOR_VAR[f.paper], color: "var(--primary-on)" }}
              >
                {f.initials}
              </div>
              <span
                className="absolute -bottom-[1px] -right-[1px] h-[10px] w-[10px] rounded-full border-2"
                style={{ background: "var(--green)", borderColor: "var(--surface)" }}
                aria-label="studying now"
              />
            </div>
            <span className="text-caption font-semibold text-text">{f.name}</span>
            <span className="tnum text-center text-[10px] text-dim">{f.detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
