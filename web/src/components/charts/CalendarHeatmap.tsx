import type { HeatCell } from "@/lib/domain/stats";

const INTENSITY_COLOR = ["#1A1E2A", "#2A3566", "#3B47A0", "#5A67D8", "var(--primary)"];

/** Chart 05 · Consistency, last 12 weeks — GitHub-style heatmap, ported from the DS
 *  file's aspect-ratio-square grid convention. */
export function CalendarHeatmap({ weeks }: { weeks: HeatCell[][] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-1 flex-col gap-[3px]">
            {week.map((day) => (
              <span
                key={day.dateIso}
                className="aspect-square rounded-sm"
                style={{ background: INTENSITY_COLOR[day.intensity] }}
                title={day.dateIso}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-[5px] text-[10px] text-dim">
        <span>less</span>
        {INTENSITY_COLOR.map((c) => (
          <span key={c} className="h-[10px] w-[10px] rounded-sm" style={{ background: c }} aria-hidden />
        ))}
        <span>more</span>
      </div>
    </div>
  );
}
