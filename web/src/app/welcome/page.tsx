"use client";

import Link from "next/link";
import { useLocalState } from "@/lib/hooks/useLocalState";

/**
 * A single, honest landing page — scoped down from WEB_PLAN.md's full marketing site
 * (features/pricing/FAQ/privacy/terms are Phase 2, and pricing itself is still an open
 * decision per PLAN.md §10). No fabricated testimonials, user counts, or pricing;
 * every claim here matches what the app actually does today.
 *
 * Reachable at /welcome specifically (not `/`, which stays a splash that auto-redirects
 * based on onboarding state) so this exists as a real, linkable "what is this" page
 * independent of that redirect logic.
 */
export default function WelcomePage() {
  const [onboarded, , hydrated] = useLocalState<boolean>("sc-onboarded", false);
  const ctaHref = hydrated && onboarded ? "/dashboard" : "/onboarding";
  const ctaLabel = hydrated && onboarded ? "Continue to dashboard" : "Get started";

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
        {/* ---- Hero ---- */}
        <div className="flex flex-col items-center text-center">
          <span
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-[18px]"
            style={{ background: "var(--primary)" }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--primary-on)" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 13V9M9.5 2h5" />
            </svg>
          </span>

          <h1 className="text-headline text-text">Study Counter</h1>
          <p className="mt-3 max-w-xl text-body-lg text-dim">
            A study planner built specifically for Indian CA students — Foundation,
            Intermediate and Final. One number governs everything:{" "}
            <em style={{ color: "var(--text)", fontStyle: "italic" }}>am I on pace?</em>
          </p>

          <div className="tnum mt-8 text-hero text-text">42</div>
          <div className="text-caption text-dim">days to Paper 1 · Financial Reporting</div>

          <Link
            href={ctaHref}
            className="mt-8 rounded-card bg-primary px-8 py-4 text-[16px] font-bold text-primary-on"
          >
            {ctaLabel}
          </Link>
          <p className="mt-3 text-caption text-dim">No account needed — everything works offline.</p>
        </div>

        {/* ---- Features ---- */}
        <div className="mt-20 flex flex-col gap-4">
          <Feature
            emoji="📚"
            title="The ICAI syllabus, already loaded"
            body="Foundation's full chapter-wise syllabus is preloaded with real weightages — pick your papers and start tracking immediately, no setup. Intermediate and Final paper structures are registered too, with chapter content on the way."
          />
          <Feature
            emoji="⏱️"
            title="A countdown that actually means something"
            body="Two countdowns, always visible: days to your attempt, and days to your very next paper. Recomputed every time you open the app."
          />
          <Feature
            emoji="✍️"
            title="What you studied, not just how long"
            body="Every session is tagged — concept, practice, revision, mock, or lecture — because a paper that's 90% reading and 10% practice fails, however many hours went in."
          />
          <Feature
            emoji="📉"
            title="Know if you'll actually clear it"
            body="A real burn-down chart projects whether your syllabus finishes before your exam, and a pass-projection gauge checks your mocks against ICAI's 40-per-paper and 50%-aggregate rule — honestly, not optimistically."
          />
          <Feature
            emoji="🗓️"
            title="Plan your week in three taps"
            body="Tell it how many hours you have each day; it distributes them across your papers by what's outstanding and what's been neglected — you can lock and adjust anything before applying it."
          />
        </div>

        <div className="mt-16 flex flex-col items-center gap-3 border-t border-border pt-10 text-center">
          <p className="text-body text-dim">Built for CA Foundation, Intermediate and Final students.</p>
          <Link href={ctaHref} className="text-label font-semibold" style={{ color: "var(--primary)" }}>
            {ctaLabel} →
          </Link>
        </div>
      </div>
    </main>
  );
}

function Feature({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="flex gap-4 rounded-card-lg border border-border bg-surface p-5">
      <span className="text-[28px] leading-none" aria-hidden>
        {emoji}
      </span>
      <div>
        <div className="text-subtitle text-text">{title}</div>
        <p className="mt-1 text-body text-dim">{body}</p>
      </div>
    </div>
  );
}
