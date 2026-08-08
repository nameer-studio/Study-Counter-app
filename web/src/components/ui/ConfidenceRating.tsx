"use client";

import clsx from "clsx";

/**
 * 1–5 confidence rating for a chapter. Feeds chart 08 (confidence vs time) — which is
 * only meaningful when confidence is stated by the student rather than inferred from
 * their revision progress, so this is a real input, not a derived value.
 *
 * Colour follows the pace language: low confidence reads red, high reads green.
 */
const LEVEL_COLOR = [
  "var(--red)",
  "var(--red)",
  "var(--amber)",
  "var(--green)",
  "var(--green)",
];

export function ConfidenceRating({
  value,
  onChange,
  className,
}: {
  /** 1–5, or undefined when unrated. */
  value: number | undefined;
  onChange: (next: number) => void;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center gap-[3px]", className)} role="group" aria-label="Confidence rating">
      {[1, 2, 3, 4, 5].map((level) => {
        const active = value !== undefined && level <= value;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            aria-label={`Confidence ${level} of 5`}
            aria-pressed={value === level}
            className="h-[14px] w-[7px] rounded-sm transition-colors duration-150"
            style={{
              background: active ? LEVEL_COLOR[(value ?? 1) - 1] : "transparent",
              border: active ? "none" : "1.5px solid var(--border)",
            }}
          />
        );
      })}
    </div>
  );
}
