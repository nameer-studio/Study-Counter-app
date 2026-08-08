import type { PaperSlice } from "@/lib/domain/stats";
import { formatHours } from "@/lib/domain/plannedBlock";

/** Chart 03 · Time by paper — donut + legend, ported from the DS file's stroke-dasharray
 *  ring-segment technique. */
export function DonutChart({ slices, totalHours }: { slices: PaperSlice[]; totalHours: number }) {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  let cursor = 0;

  return (
    <div className="flex items-center gap-[18px]">
      <svg viewBox="0 0 120 120" width={120} height={120} className="flex-none" role="img" aria-label="Time by paper">
        {slices.length === 0 ? (
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--ring)" strokeWidth="18" />
        ) : (
          slices.map((s) => {
            const dash = (s.percent / 100) * circumference;
            const offset = -((cursor / 100) * circumference);
            cursor += s.percent;
            return (
              <circle
                key={s.category}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="18"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                transform="rotate(-90 60 60)"
              />
            );
          })
        )}
        <text x="60" y="57" textAnchor="middle" className="tnum" style={{ font: "800 20px var(--font-inter)", fill: "var(--text)" }}>
          {formatHours(Math.round(totalHours * 60))}
        </text>
        <text x="60" y="72" textAnchor="middle" style={{ font: "600 9px var(--font-inter)", fill: "var(--dim)" }}>
          total
        </text>
      </svg>
      <div className="grid flex-1 grid-cols-2 gap-x-[10px] gap-y-[6px]">
        {slices.length === 0 && <span className="col-span-2 text-caption text-dim">No sessions logged yet</span>}
        {slices.map((s) => (
          <div key={s.category} className="flex items-center gap-[6px]">
            <span className="h-2 w-2 flex-none rounded-sm" style={{ background: s.color }} aria-hidden />
            <span className="flex-1 truncate text-caption text-text">{s.name}</span>
            <span className="tnum text-caption font-semibold text-dim">{Math.round(s.percent)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
