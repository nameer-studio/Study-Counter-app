"use client";

import clsx from "clsx";
import {
  ACTIVITY_DOT_COLOR_VAR,
  ACTIVITY_LABEL,
  PAPER_CATEGORY_COLOR_VAR,
  type ActivityType,
  type PaperCategory,
} from "@/lib/domain/types";

/**
 * Paper tag — carries the paper's fixed colour at a 16% tint (DS Chips·09).
 * [label] is the paper's real name ("Direct Tax Laws"); [category] only picks the colour.
 */
export function PaperChip({
  category,
  label,
  className,
}: {
  category: PaperCategory;
  label: string;
  className?: string;
}) {
  const color = PAPER_CATEGORY_COLOR_VAR[category];
  return (
    <span
      className={clsx("inline-flex items-center gap-[6px] rounded-lg px-[11px] py-[5px] text-label font-semibold", className)}
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }}
    >
      <span className="h-[6px] w-[6px] rounded-sm bg-current" aria-hidden />
      {label}
    </span>
  );
}

/** Activity-type chip. Selected fills with primary; unselected is a neutral outlined
 *  pill with a coloured dot (DS Chips·09). */
export function ActivityChip({
  type,
  selected,
  onClick,
  className,
}: {
  type: ActivityType;
  selected: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        "inline-flex items-center gap-[7px] rounded-full px-[13px] py-[6px] text-label font-semibold transition-colors duration-150",
        selected
          ? "bg-primary text-primary-on"
          : "border border-border bg-surface2 text-text hover:bg-surface",
        className,
      )}
    >
      <span
        className="h-[6px] w-[6px] rounded-full"
        style={{ background: selected ? "currentColor" : ACTIVITY_DOT_COLOR_VAR[type] }}
        aria-hidden
      />
      {ACTIVITY_LABEL[type]}
    </button>
  );
}
