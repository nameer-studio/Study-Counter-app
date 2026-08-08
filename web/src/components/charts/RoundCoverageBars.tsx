import type { RoundCoverage } from "@/lib/domain/chapterStats";

/** Chart 07 · Revision-round coverage — cumulative share of chapters that have reached
 *  at least each round. Ported from the DS file's labelled-bar rows. */
export function RoundCoverageBars({ coverage }: { coverage: RoundCoverage[] }) {
  return (
    <div className="flex flex-col gap-[10px]">
      {coverage.map((row) => (
        <div key={row.round} className="flex items-center gap-[10px]">
          <span className="w-[84px] flex-none text-[11px] text-dim">{row.name}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface2">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${row.percent}%`, background: row.color }}
            />
          </div>
          <span className="tnum w-9 flex-none text-right text-[11px] font-semibold text-text">
            {row.percent}%
          </span>
        </div>
      ))}
    </div>
  );
}
