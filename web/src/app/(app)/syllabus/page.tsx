"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { LEVELS, papersForAttempt, hasSyllabusData } from "@/lib/icai/levels";
import { paperWeightedProgress } from "@/lib/domain/syllabus";
import { useLocalState } from "@/lib/hooks/useLocalState";
import { useSyncedRecordState } from "@/lib/hooks/useSyncedRecordState";
import { REVISION_ROUNDS_SYNC, CHAPTER_CONFIDENCE_SYNC } from "@/lib/sync/syncConfigs";
import type { Attempt } from "@/lib/domain/attempt";
import { RevisionRoundIndicator } from "@/components/ui/RevisionRoundIndicator";
import { ConfidenceRating } from "@/components/ui/ConfidenceRating";
import {
  PAPER_CATEGORY_COLOR_VAR,
  REVISION_ROUND_SHORT_LABEL,
  advanceRevisionRound,
  type RevisionRound,
} from "@/lib/domain/types";

/**
 * D7 Papers & syllabus — two-pane on desktop (paper list left, chapter list right)
 * rather than the mobile drill-down, per WEB_PLAN.md §2.2. This is the highest-density
 * screen in the app (~240 chapter rows once all three levels are seeded), so it's the
 * real stress test for whether RevisionRoundIndicator stays scannable at length.
 *
 * Revision-round state persists to localStorage — clicking a pip row actually advances
 * that chapter and survives a reload, and syncs to Supabase in the background once
 * signed in (see useSyncedRecordState).
 */
export default function SyllabusPage() {
  const [rounds, setRounds] = useSyncedRecordState<RevisionRound>(
    "sc-foundation-rounds",
    {},
    REVISION_ROUNDS_SYNC,
  );
  const [confidence, setConfidence] = useSyncedRecordState<number>(
    "sc-chapter-confidence",
    {},
    CHAPTER_CONFIDENCE_SYNC,
  );
  const [attempt, , attemptHydrated] = useLocalState<Attempt | null>("sc-attempt", null);

  // Papers follow the registered attempt, not a fixed Foundation list — a Final student
  // was previously shown Foundation's four papers and their chapters outright.
  const papers = attempt ? papersForAttempt(attempt.level, attempt.group) : [];
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  // Falls back to the first paper rather than pinning a stale selection: `papers` changes
  // when the student edits their attempt, and the previously selected id may no longer
  // exist in the new level.
  const selectedPaper = papers.find((p) => p.id === selectedPaperId) ?? papers[0];

  function advance(chapterId: string) {
    setRounds((prev) => ({
      ...prev,
      [chapterId]: advanceRevisionRound(prev[chapterId] ?? "notStarted"),
    }));
  }

  function rate(chapterId: string, level: number) {
    setConfidence((prev) => ({ ...prev, [chapterId]: level }));
  }

  if (!attemptHydrated) return null;

  if (!attempt || !hasSyllabusData(attempt.level)) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
        <div className="text-title text-text">
          {attempt ? `${LEVELS[attempt.level].label} syllabus isn't loaded yet` : "No attempt set up yet"}
        </div>
        <p className="text-body text-dim">
          {attempt
            ? "Chapter-wise content for this level hasn't been seeded — only Foundation is loaded right now."
            : "Chapter tracking needs your attempt details first."}
        </p>
        <Link
          href={attempt ? "/attempt" : "/onboarding"}
          className="mt-2 rounded-card border border-border px-6 py-3 text-[15px] font-bold text-text"
        >
          {attempt ? "Check my attempt" : "Set up now"}
        </Link>
      </div>
    );
  }

  // `hasSyllabusData` guarantees this level has papers, so this only guards the type.
  if (!selectedPaper) return null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 sm:px-6 lg:flex-row lg:items-start">
      {/* ---- Paper list ---- */}
      <div className="flex flex-col gap-2 lg:w-72 lg:flex-none">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-title text-text">CA {LEVELS[attempt.level].label} syllabus</h1>
          <Link href="/attempt" className="text-caption font-semibold" style={{ color: "var(--primary)" }}>
            My attempt →
          </Link>
        </div>
        <p className="mb-2 px-1 text-caption text-dim">
          Tap a paper to open its chapters. Tap the pips to advance a chapter&rsquo;s revision
          round, or the bars to rate your confidence 1&ndash;5.
        </p>
        {papers.map((paper) => {
          const progress = paperWeightedProgress(paper, rounds);
          const color = PAPER_CATEGORY_COLOR_VAR[paper.category];
          const active = paper.id === selectedPaper?.id;
          return (
            <button
              key={paper.id}
              type="button"
              onClick={() => setSelectedPaperId(paper.id)}
              className={clsx(
                "flex flex-col gap-2 rounded-card-lg border px-4 py-3 text-left transition-colors duration-150",
                active ? "border-primary bg-surface" : "border-border bg-surface hover:border-dim",
              )}
              style={active ? { borderColor: "var(--primary)" } : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm" style={{ background: color }} aria-hidden />
                  <span className="text-label font-bold text-text">
                    Paper {paper.paperNo} — {paper.name}
                  </span>
                </span>
                <span className="tnum text-caption text-dim">{paper.chapters.length} ch.</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface2">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${Math.round(progress * 100)}%`, background: color }}
                />
              </div>
              <span className="tnum text-caption text-dim">{Math.round(progress * 100)}% revised</span>
            </button>
          );
        })}
      </div>

      {/* ---- Chapter list ---- */}
      <div className="flex-1 rounded-card-lg border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <div className="text-subtitle text-text">{selectedPaper.name}</div>
            <div className="mt-[2px] text-caption text-dim">
              {selectedPaper.chapters.length} chapters · {selectedPaper.maxMarks} marks
              {selectedPaper.isObjective && " · objective"}
              {selectedPaper.hasNegativeMarking && " · negative marking"}
            </div>
          </div>
          <Link
            href={`/stats/paper/${selectedPaper.id}`}
            className="flex-none rounded-lg border border-border px-3 py-[6px] text-label font-semibold text-dim transition-colors hover:border-primary hover:text-primary"
          >
            View stats →
          </Link>
        </div>
        <ul>
          {selectedPaper.chapters.map((chapter, i) => {
            const round = rounds[chapter.id] ?? "notStarted";
            const color = PAPER_CATEGORY_COLOR_VAR[selectedPaper.category];
            return (
              <li
                key={chapter.id}
                className={clsx(
                  "flex items-center gap-3 px-5 py-3",
                  i !== selectedPaper.chapters.length - 1 && "border-b border-border",
                )}
              >
                <span className="h-[9px] w-[9px] flex-none rounded-sm" style={{ background: color }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body font-semibold text-text">{chapter.name}</div>
                  <div className="mt-[1px] text-caption text-dim">
                    {chapter.weightage}% weightage · {chapter.estHours}h est.
                  </div>
                </div>
                {/* Confidence feeds chart 08 on the paper-stats screen — stated by the
                    student, never inferred from revision progress. */}
                <ConfidenceRating
                  value={confidence[chapter.id]}
                  onChange={(level) => rate(chapter.id, level)}
                  className="hidden flex-none sm:flex"
                />
                <span className="hidden w-16 flex-none text-right text-caption font-semibold text-dim sm:inline">
                  {REVISION_ROUND_SHORT_LABEL[round]}
                </span>
                <button
                  type="button"
                  onClick={() => advance(chapter.id)}
                  className="flex-none rounded-lg p-1 transition-colors hover:bg-surface2"
                  aria-label={`Advance revision round for ${chapter.name}, currently ${round}`}
                >
                  <RevisionRoundIndicator round={round} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
