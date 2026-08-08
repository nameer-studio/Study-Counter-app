"use client";

import { useState } from "react";
import clsx from "clsx";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import { DASHBOARD_FIXTURES, type PaceVariant } from "@/lib/fixtures/dashboard";
import { RevisionRoundIndicator } from "@/components/ui/RevisionRoundIndicator";
import { PaperChip, ActivityChip } from "@/components/ui/Chips";
import {
  ACTIVITY_TYPES,
  PAPER_CATEGORIES,
  PAPER_CATEGORY_LABEL,
  REVISION_ROUNDS,
  REVISION_ROUND_SHORT_LABEL,
  type ActivityType,
} from "@/lib/domain/types";

const VARIANTS: { key: PaceVariant; label: string }[] = [
  { key: "behind", label: "Behind" },
  { key: "onpace", label: "On pace" },
  { key: "ahead", label: "Ahead" },
];

/**
 * Temporary dev harness — not the real landing page. Hosts the ported B1 Dashboard in
 * all three pace states plus a component gallery, so the design port can be checked
 * against the `.dc.html` files side by side. Replaced by the marketing landing page
 * (WEB_PLAN.md §3) once Phase 1 screens land.
 */
export default function Home() {
  const [variant, setVariant] = useState<PaceVariant>("behind");
  const [activity, setActivity] = useState<ActivityType>("concept");

  return (
    <main className="min-h-screen bg-bg pb-20">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[9px]"
              style={{ background: "var(--primary)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-on)" strokeWidth="2.4" strokeLinecap="round">
                <circle cx="12" cy="13" r="8" />
                <path d="M12 13V9M9.5 2h5" />
              </svg>
            </span>
            <div>
              <div className="text-[16px] font-extrabold tracking-[-0.01em] text-text">Study Counter</div>
              <div className="text-[11px] font-medium text-dim">Web · design port check</div>
            </div>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Pace-state switcher — the "behind" state is the one that matters most, so it
          leads. */}
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="text-overline uppercase text-dim">Pace state</div>
        <div className="mt-2 inline-flex gap-[3px] rounded-[11px] border border-border bg-surface2 p-[3px]">
          {VARIANTS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setVariant(v.key)}
              className={clsx(
                "rounded-lg px-4 py-2 text-label font-semibold transition-colors duration-150",
                variant === v.key ? "bg-primary text-primary-on" : "text-dim hover:text-text",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <Dashboard data={DASHBOARD_FIXTURES[variant]} />

      {/* ---- Component gallery ---- */}
      <section className="mx-auto mt-10 max-w-6xl border-t border-border px-4 pt-8 sm:px-6">
        <h2 className="text-title text-text">Shared components</h2>
        <p className="mt-1 max-w-xl text-body text-dim">
          The same four primitives the Android app uses, ported to React from the design
          system file. Switch themes above — every value comes from CSS variables, so all
          three themes are one source of truth.
        </p>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <div className="text-overline uppercase text-dim">Revision-round indicator</div>
            <p className="mt-1 text-caption text-dim">
              Appears on ~240 chapter rows — the most-repeated component in the app.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {REVISION_ROUNDS.map((round) => (
                <div key={round} className="flex items-center gap-4">
                  <span className="w-20 text-label text-dim">{REVISION_ROUND_SHORT_LABEL[round]}</span>
                  <RevisionRoundIndicator round={round} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-overline uppercase text-dim">Paper tags</div>
            <p className="mt-1 text-caption text-dim">
              Six fixed colours, colour-blind-safe, identical in every theme.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {PAPER_CATEGORIES.map((c) => (
                <PaperChip key={c} category={c} label={PAPER_CATEGORY_LABEL[c]} />
              ))}
            </div>

            <div className="mt-8 text-overline uppercase text-dim">Activity types</div>
            <p className="mt-1 text-caption text-dim">
              Tagged on every session — this is what separates reading from real practice.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {ACTIVITY_TYPES.map((t) => (
                <ActivityChip
                  key={t}
                  type={t}
                  selected={activity === t}
                  onClick={() => setActivity(t)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
