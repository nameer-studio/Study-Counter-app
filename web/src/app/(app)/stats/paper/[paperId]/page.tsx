"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { FOUNDATION_PAPERS } from "@/lib/icai/foundation";
import { useSyncedArrayState } from "@/lib/hooks/useSyncedArrayState";
import { useSyncedRecordState } from "@/lib/hooks/useSyncedRecordState";
import { LOGGED_SESSION_SYNC, REVISION_ROUNDS_SYNC, CHAPTER_CONFIDENCE_SYNC } from "@/lib/sync/syncConfigs";
import type { LoggedSession } from "@/lib/domain/loggedSession";
import {
  chapterTimes,
  completionBreakdown,
  confidenceVsTime,
  paperHours,
  revisionRoundCoverage,
  unratedChapterCount,
  type ConfidenceMap,
} from "@/lib/domain/chapterStats";
import { PAPER_CATEGORY_COLOR_VAR, type RevisionRound } from "@/lib/domain/types";
import { CompletionStackedBar } from "@/components/charts/CompletionStackedBar";
import { RoundCoverageBars } from "@/components/charts/RoundCoverageBars";
import { ConfidenceScatter } from "@/components/charts/ConfidenceScatter";
import { RankedChapterBars } from "@/components/charts/RankedChapterBars";

const LOG_KEY = "sc-logged-sessions";
const ROUNDS_KEY = "sc-foundation-rounds";
const CONFIDENCE_KEY = "sc-chapter-confidence";

/**
 * E2 Paper detail — charts 6–9 for a single paper. Reached from D7's "View stats" link
 * or /stats. All four charts read the same per-chapter rollups in
 * lib/domain/chapterStats.ts, which aggregate the identical `LoggedSession[]` E1 uses,
 * so this screen's totals always reconcile with the Overview's.
 */
export default function PaperDetailPage() {
  const params = useParams<{ paperId: string }>();
  const [sessions] = useSyncedArrayState<LoggedSession>(LOG_KEY, [], LOGGED_SESSION_SYNC);
  const [rounds] = useSyncedRecordState<RevisionRound>(ROUNDS_KEY, {}, REVISION_ROUNDS_SYNC);
  const [confidence] = useSyncedRecordState<number>(CONFIDENCE_KEY, {}, CHAPTER_CONFIDENCE_SYNC);

  const paper = FOUNDATION_PAPERS.find((p) => p.id === params.paperId);

  if (!paper) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="text-title text-text">Paper not found</div>
        <p className="mt-2 text-body text-dim">
          No paper matches <code className="text-text">{params.paperId}</code>.
        </p>
        <Link href="/stats" className="mt-4 inline-block text-label font-semibold text-primary">
          ← Back to statistics
        </Link>
      </div>
    );
  }

  const color = PAPER_CATEGORY_COLOR_VAR[paper.category];
  const hours = paperHours(paper, sessions);
  const breakdown = completionBreakdown(paper, rounds);
  const coverage = revisionRoundCoverage(paper, rounds);
  const times = chapterTimes(paper, sessions);
  const scatter = confidenceVsTime(paper, sessions, confidence);
  const unrated = unratedChapterCount(paper, sessions, confidence);
  const revisedPercent = breakdown.total > 0 ? Math.round((breakdown.finalRev / breakdown.total) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      {/* ---- Paper header, per the design's colour-bar + meta line ---- */}
      <div className="mb-5 flex items-start gap-3">
        <span className="mt-1 h-6 w-[10px] flex-none rounded-[3px]" style={{ background: color }} aria-hidden />
        <div className="flex-1">
          <div className="text-[19px] font-bold text-text">{paper.name}</div>
          <div className="tnum mt-[1px] text-caption text-dim">
            {hours.toFixed(1)}h · {paper.chapters.length} chapters · {revisedPercent}% revised
          </div>
        </div>
        <Link
          href="/stats"
          className="flex-none rounded-lg border border-border px-3 py-[6px] text-label font-semibold text-dim transition-colors hover:border-primary hover:text-primary"
        >
          ← Overview
        </Link>
      </div>

      {/* ---- Paper switcher ---- */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FOUNDATION_PAPERS.map((p) => (
          <Link
            key={p.id}
            href={`/stats/paper/${p.id}`}
            className={clsx(
              "rounded-lg border px-3 py-[6px] text-label font-semibold transition-colors",
              p.id === paper.id
                ? "border-primary text-primary"
                : "border-border text-dim hover:text-text",
            )}
          >
            P{p.paperNo}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="06 · Chapter completion">
          <CompletionStackedBar breakdown={breakdown} />
        </ChartCard>

        <ChartCard title="07 · Revision-round coverage">
          <RoundCoverageBars coverage={coverage} />
        </ChartCard>

        <ChartCard title="08 · Confidence vs time spent">
          {scatter.length > 0 ? (
            <ConfidenceScatter points={scatter} color={color} />
          ) : (
            <p className="text-caption text-dim">
              Nothing to plot yet. This chart needs a confidence rating alongside logged
              time — rate chapters on the{" "}
              <Link href="/syllabus" className="font-semibold text-primary">
                syllabus screen
              </Link>{" "}
              and they&rsquo;ll appear here.
            </p>
          )}
          {scatter.length > 0 && unrated > 0 && (
            <p className="mt-2 text-[10px] text-dim">
              {unrated} more studied {unrated === 1 ? "chapter is" : "chapters are"} unrated
              and not shown.
            </p>
          )}
        </ChartCard>

        <ChartCard title="09 · Chapters by time spent">
          <RankedChapterBars chapters={times} color={color} />
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
