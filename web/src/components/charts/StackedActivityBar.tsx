import type { ActivityRow } from "@/lib/domain/stats";
import { activityMixColor } from "@/lib/domain/stats";
import { ACTIVITY_EMOJI, ACTIVITY_LABEL, ACTIVITY_TYPES } from "@/lib/domain/types";

/** Chart 04 · Activity mix by paper — one horizontal stacked bar per paper, showing
 *  concept/practice/revision/mock/lecture split. This is the chart that answers "am I
 *  only reading and never writing?" — the ratio, not the raw hours, is the point. */
export function StackedActivityBar({ rows }: { rows: ActivityRow[] }) {
  return (
    <div className="flex flex-col gap-2">
      {rows.length === 0 && <span className="text-caption text-dim">No sessions logged yet</span>}
      {rows.map((row) => (
        <div key={row.paperId} className="flex items-center gap-2">
          <span className="w-8 flex-none text-[10px] font-semibold text-dim">{row.paperLabel}</span>
          <div className="flex h-4 flex-1 overflow-hidden rounded-[5px]">
            {row.segments.map((seg, i) => (
              <span
                key={i}
                style={{ width: `${seg.percent}%`, background: activityMixColor(seg.activityType) }}
                title={`${ACTIVITY_LABEL[seg.activityType]}: ${Math.round(seg.percent)}%`}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-dim">
        {ACTIVITY_TYPES.map((t) => (
          <span key={t} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ background: activityMixColor(t) }} aria-hidden />
            {ACTIVITY_EMOJI[t]} {ACTIVITY_LABEL[t]}
          </span>
        ))}
      </div>
    </div>
  );
}
