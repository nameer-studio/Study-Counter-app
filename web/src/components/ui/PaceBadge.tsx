import clsx from "clsx";
import { paceColorVar, paceLabel, type PaceState } from "@/lib/domain/pace";

/**
 * Small status pill beside the countdown and on paper cards (DS Components·07).
 * Colour is never the only signal — the label always states the fact in words, which
 * is both the accessibility rule from the handoff and the reason a colour-blind student
 * can still read their own status.
 */
export function PaceBadge({
  state,
  className,
}: {
  state: PaceState;
  className?: string;
}) {
  const color = paceColorVar(state);
  const label = paceLabel(state);
  const showChevron = state.status === "ahead";

  return (
    <span
      className={clsx(
        "tnum inline-flex items-center gap-[6px] rounded-full px-3 py-[6px] text-label font-bold",
        className,
      )}
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }}
    >
      {showChevron ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="18 15 12 9 6 15" />
        </svg>
      ) : (
        <span className="h-[7px] w-[7px] rounded-full bg-current" aria-hidden />
      )}
      {label}
    </span>
  );
}
