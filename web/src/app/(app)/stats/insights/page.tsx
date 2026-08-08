"use client";

import Link from "next/link";
import clsx from "clsx";
import { useSeedOnce } from "@/lib/hooks/useSeededLocalState";
import { useSyncedArrayState } from "@/lib/hooks/useSyncedArrayState";
import { LOGGED_SESSION_SYNC } from "@/lib/sync/syncConfigs";
import type { LoggedSession } from "@/lib/domain/loggedSession";
import { generateDemoSessions } from "@/lib/demo/seedSessions";
import {
  generateFindings,
  peakFocusWindow,
  sessionLengthHistogram,
  timeOfDayHeatmap,
} from "@/lib/domain/insights";
import { TimeOfDayHeatmap } from "@/components/charts/TimeOfDayHeatmap";
import { SessionLengthHistogram } from "@/components/charts/SessionLengthHistogram";
import { FindingCard } from "@/components/ui/FindingCard";

const LOG_KEY = "sc-logged-sessions";

/**
 * E3 Insights — charts 10–11 plus plain-language findings. Every finding is computed
 * from the student's own sessions (see lib/domain/insights.ts); none are canned, because
 * a hardcoded "you're reading too much" that fires regardless of the data is advice a
 * student would act on wrongly.
 */
export default function InsightsPage() {
  const [sessions] = useSeedOnce<LoggedSession[]>(
    useSyncedArrayState<LoggedSession>(LOG_KEY, [], LOGGED_SESSION_SYNC),
    generateDemoSessions,
    (s) => s.length === 0,
  );

  const heat = timeOfDayHeatmap(sessions);
  const histogram = sessionLengthHistogram(sessions);
  const findings = generateFindings(sessions);
  const peak = peakFocusWindow(sessions);

  const deepWorkCount = histogram[3].count + histogram[4].count;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title text-text">Insights</h1>
        <Link
          href="/stats"
          className="rounded-lg border border-border px-3 py-[6px] text-label font-semibold text-dim transition-colors hover:border-primary hover:text-primary"
        >
          ← Overview
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="10 · When you study · hour × day">
          <TimeOfDayHeatmap grid={heat.grid} fromHour={heat.fromHour} toHour={heat.toHour} />
          <p className="mt-3 text-caption leading-[1.4] text-dim">
            {peak ? (
              <>
                Peak focus:{" "}
                <b className="text-text">
                  {formatHour(peak.start)}–{formatHour(peak.end + 1)}
                </b>
                , with {peak.hours.toFixed(1)}h logged in that window.
              </>
            ) : (
              "Not enough sessions yet to find a pattern."
            )}
          </p>
        </ChartCard>

        <ChartCard title="11 · Session length">
          <SessionLengthHistogram buckets={histogram} />
          <p className="mt-2 text-caption leading-[1.4] text-dim">
            {sessions.length === 0 ? (
              "No sessions logged yet."
            ) : (
              <>
                <b className="text-text">{deepWorkCount}</b> of {sessions.length} sessions sit in
                the 60–120 minute deep-work band.
              </>
            )}
          </p>
        </ChartCard>

        <div className="lg:col-span-2">
          <div className="mb-3 text-overline uppercase text-dim">Findings</div>
          {findings.length === 0 ? (
            <div className="rounded-card-lg border border-border bg-surface p-4">
              <p className="text-caption text-dim">
                Nothing worth flagging yet. Findings appear once there&rsquo;s enough history to
                say something you can actually act on — log a few more sessions.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-[10px]">
              {findings.map((finding) => (
                <FindingCard key={finding.id} finding={finding} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatHour(hour: number): string {
  const h = hour % 24;
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
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
