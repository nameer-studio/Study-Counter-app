import type { PaperReadiness } from "@/lib/domain/readiness";

/**
 * Chart 15 · Per-paper readiness — bar per paper with a safety-threshold marker.
 *
 * The marker sits at 50%, matching the design. Note it is a *readiness* threshold, not a
 * marks value: readiness below roughly half a paper's syllabus is where scraping the
 * 40-mark minimum stops being realistic. Keeping it visually distinct from the bar means
 * a student can see which papers are under the line without reading any numbers.
 */
const SAFETY_THRESHOLD_PERCENT = 50;

export function ReadinessBars({ readiness }: { readiness: PaperReadiness[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] text-dim">Bar = readiness · marker = safety threshold for a 40-mark minimum</p>
      {readiness.map((paper) => {
        const under = paper.percent < SAFETY_THRESHOLD_PERCENT;
        const barColor = under ? (paper.percent < 30 ? "var(--red)" : "var(--amber)") : "var(--green)";
        return (
          <div key={paper.paperId} className="flex items-center gap-[10px]">
            <span className="h-2 w-2 flex-none rounded-sm" style={{ background: paper.color }} aria-hidden />
            <span className="w-[52px] flex-none text-[11px] text-dim">{paper.shortName}</span>
            <div className="relative h-[14px] flex-1 overflow-hidden rounded-full bg-surface2">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${paper.percent}%`, background: barColor }}
              />
              <span
                className="absolute -top-[2px] -bottom-[2px] w-[2.5px] opacity-80"
                style={{ left: `${SAFETY_THRESHOLD_PERCENT}%`, background: "var(--text)" }}
                aria-hidden
              />
            </div>
            <span
              className="tnum w-8 flex-none text-right text-[11px] font-bold"
              style={{ color: barColor }}
            >
              {paper.percent}
            </span>
          </div>
        );
      })}
    </div>
  );
}
