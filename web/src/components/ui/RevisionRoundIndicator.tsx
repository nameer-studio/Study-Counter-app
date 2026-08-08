import clsx from "clsx";
import { revisionRoundIndex, type RevisionRound } from "@/lib/domain/types";

/**
 * The app's most-repeated custom component — ~240 chapter rows, plus the session-log
 * sheet and planner block summaries. Four pips fill as a chapter advances; the final
 * round turns green with a tick to mean exam-ready.
 *
 * Ported from DS Components·06. Defaults to the dense chapter-list size (18x7px);
 * pass `size="lg"` for the standalone-card size (22x8px).
 */
export function RevisionRoundIndicator({
  round,
  size = "sm",
  className,
}: {
  round: RevisionRound;
  size?: "sm" | "lg";
  className?: string;
}) {
  const filled = revisionRoundIndex(round);
  const isFinal = round === "finalRevision";
  const isNotStarted = round === "notStarted";

  const pipW = size === "lg" ? 22 : 18;
  const pipH = size === "lg" ? 8 : 7;

  return (
    <div className={clsx("flex items-center gap-[3px]", className)} role="img" aria-label={`Revision round: ${round}`}>
      {[0, 1, 2, 3].map((i) => {
        const isFilledPip = i < filled;
        const background = isFinal
          ? "var(--green)"
          : isFilledPip
            ? "var(--primary)"
            : "transparent";
        const borderColor = isFinal
          ? "var(--green)"
          : isFilledPip
            ? "var(--primary)"
            : isNotStarted
              ? "color-mix(in srgb, var(--grey) 60%, transparent)"
              : "var(--border)";
        return (
          <span
            key={i}
            className="rounded-[3px]"
            style={{
              width: pipW,
              height: pipH,
              background,
              border: isFilledPip || isFinal ? "none" : `1.5px solid ${borderColor}`,
            }}
          />
        );
      })}
      {isFinal && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="ml-[2px]" aria-hidden>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}
