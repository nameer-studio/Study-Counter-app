"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { LEVELS, papersForAttempt, type GroupScope } from "@/lib/icai/levels";
import { SESSION_SHORT_LABEL } from "@/lib/domain/attempt";
import { LEVEL_HAS_GROUPS, VALID_SESSIONS, type ExamSession, type IcaiLevel } from "@/lib/domain/types";

/**
 * The attempt-configuration form — level, group, session/year, per-paper exam dates,
 * exemptions. Shared between onboarding's A5 (a fresh wizard step) and `/attempt` (D8,
 * editing an existing attempt in place), so the conditional logic — group step vanishing
 * at Foundation, session options staying level-correct, exemptions existing only at
 * Inter/Final — is written and gets fixed exactly once, not twice in parallel copies
 * that can quietly drift apart.
 *
 * Deliberately has no submit button of its own — the two callers want different actions
 * ("Continue" advancing a wizard vs "Save changes" writing in place), so that's a
 * `footer` slot supplied by the caller instead.
 */
export function AttemptEditor({
  level,
  group,
  session,
  year,
  paperDates,
  exemptions,
  onLevel,
  onGroup,
  onSession,
  onYear,
  onPaperDate,
  onExemption,
  footer,
}: {
  level: IcaiLevel;
  group: GroupScope;
  session: ExamSession;
  year: number;
  paperDates: Record<string, string>;
  exemptions: Record<string, number>;
  onLevel: (l: IcaiLevel) => void;
  onGroup: (g: GroupScope) => void;
  onSession: (s: ExamSession) => void;
  onYear: (y: number) => void;
  onPaperDate: (paperId: string, date: string) => void;
  onExemption: (paperId: string, marks: number | null) => void;
  footer?: ReactNode;
}) {
  const hasGroups = LEVEL_HAS_GROUPS[level];
  const papers = papersForAttempt(level, group);
  const validSessions = VALID_SESSIONS[level];
  // Foundation has no exemption scheme at all — the step is absent, not just empty.
  const showExemptions = level !== "foundation";

  let stepNo = 0;
  const nextStep = () => ++stepNo;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-5">
        {/* Level */}
        <section>
          <div className="mb-2 text-overline uppercase text-dim">{nextStep()} · Level</div>
          <div className="flex gap-2">
            {(Object.keys(LEVELS) as IcaiLevel[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLevel(l)}
                className={clsx(
                  "flex-1 rounded-xl border py-3 text-label font-semibold transition-colors",
                  level === l ? "text-primary-on" : "border-border text-dim",
                )}
                style={level === l ? { background: "var(--primary)", borderColor: "var(--primary)" } : undefined}
              >
                {LEVELS[l].label}
              </button>
            ))}
          </div>
          {!hasGroups && (
            <p className="mt-2 text-caption text-dim">
              No groups at Foundation level — step skipped.
            </p>
          )}
        </section>

        {/* Group — absent entirely at Foundation */}
        {hasGroups && (
          <section>
            <div className="mb-2 text-overline uppercase text-dim">{nextStep()} · Group</div>
            <div className="flex gap-2">
              {(["I", "II", "both"] as GroupScope[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onGroup(g)}
                  className={clsx(
                    "flex-1 rounded-xl border px-2 py-3 text-center transition-colors",
                    group === g ? "text-primary-on" : "border-border text-dim",
                  )}
                  style={group === g ? { background: "var(--primary)", borderColor: "var(--primary)" } : undefined}
                >
                  <div className="text-label font-semibold">
                    {g === "both" ? "Both" : `Group ${g}`}
                  </div>
                  <div className="text-[10px] opacity-80">
                    {g === "I" ? "P1–P3" : g === "II" ? "P4–P6" : "P1–P6"}
                  </div>
                </button>
              ))}
            </div>
            {group === "both" && (
              <p className="mt-2 text-caption text-dim">
                Both groups selected — you&rsquo;ll get one combined roadmap.
              </p>
            )}
          </section>
        )}

        {/* Session & year — options are level-correct */}
        <section>
          <div className="mb-2 text-overline uppercase text-dim">{nextStep()} · Session &amp; year</div>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-2">
              {validSessions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSession(s)}
                  className={clsx(
                    "flex-1 rounded-xl border py-[10px] text-label font-semibold transition-colors",
                    session === s ? "text-primary-on" : "border-border text-dim",
                  )}
                  style={session === s ? { background: "var(--primary)", borderColor: "var(--primary)" } : undefined}
                >
                  {SESSION_SHORT_LABEL[s]}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={year}
              onChange={(e) => onYear(Number(e.target.value) || year)}
              aria-label="Year"
              className="tnum w-24 rounded-xl border border-border bg-surface2 px-3 py-[10px] text-label text-text"
            />
          </div>
          {level === "final" && (
            <p className="mt-2 text-caption text-dim">
              Final offers May &amp; Nov only — no Jan/Sept sessions.
            </p>
          )}
        </section>

        {/* Paper exam dates */}
        <section>
          <div className="mb-2 text-overline uppercase text-dim">{nextStep()} · Paper exam dates</div>
          <div className="flex flex-col gap-2">
            {papers.map((paper) => (
              <div key={paper.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface2 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-caption font-semibold text-text">
                  P{paper.paperNo} · {paper.name}
                </span>
                {paper.hasNegativeMarking && (
                  <span
                    className="flex-none rounded px-[6px] py-[2px] text-[9px] font-bold"
                    style={{ background: "color-mix(in srgb, var(--amber) 20%, transparent)", color: "var(--amber)" }}
                  >
                    MCQ · −ve
                  </span>
                )}
                {paper.id === "fin-p6" && (
                  <span
                    className="flex-none rounded px-[6px] py-[2px] text-[9px] font-bold"
                    style={{ background: "color-mix(in srgb, var(--primary) 20%, transparent)", color: "var(--primary)" }}
                  >
                    Open book
                  </span>
                )}
                <input
                  type="date"
                  value={paperDates[paper.id] ?? ""}
                  onChange={(e) => onPaperDate(paper.id, e.target.value)}
                  aria-label={`Exam date for ${paper.name}`}
                  className="tnum flex-none rounded-lg border border-border bg-surface px-2 py-1 text-[11px] text-text"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Exemptions — Inter/Final only */}
        {showExemptions && (
          <section>
            <div className="mb-2 text-overline uppercase text-dim">
              {nextStep()} · Exemptions already held
            </div>
            <div className="flex flex-col gap-2">
              {papers.map((paper) => (
                <div key={paper.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface2 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-caption text-text">
                    P{paper.paperNo} · {paper.name}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="—"
                    value={exemptions[paper.id] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      onExemption(paper.id, v === "" ? null : Number(v));
                    }}
                    aria-label={`Exemption marks for ${paper.name}`}
                    className="tnum w-16 rounded-lg border border-border bg-surface px-2 py-1 text-[11px] text-text"
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-caption text-dim">
              60+ in a previous attempt earns an exemption. Leave blank if none.
            </p>
          </section>
        )}
      </div>

      {footer}
    </div>
  );
}

/** Re-derives group/session/paper-dates whenever the level changes — a session valid
 *  for the old level (e.g. January) may not exist for the new one (Final has none). */
export function nextGroupForLevel(level: IcaiLevel): GroupScope {
  return LEVEL_HAS_GROUPS[level] ? "both" : "none";
}
