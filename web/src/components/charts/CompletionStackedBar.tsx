import type { CompletionBreakdown } from "@/lib/domain/chapterStats";

/** Chart 06 · Chapter completion — a single stacked bar with counts inside each
 *  segment, ported from the DS file. Segments below ~8% hide their label rather than
 *  render an illegible sliver. */
export function CompletionStackedBar({ breakdown }: { breakdown: CompletionBreakdown }) {
  const segments = [
    { key: "finalRev", label: "Final rev", count: breakdown.finalRev, bg: "var(--green)", fg: "#08130C" },
    { key: "inRevision", label: "In revision", count: breakdown.inRevision, bg: "var(--primary)", fg: "var(--primary-on)" },
    { key: "firstReading", label: "1st reading", count: breakdown.firstReading, bg: "var(--amber)", fg: "#0F111A" },
    { key: "notStarted", label: "Not started", count: breakdown.notStarted, bg: "var(--border)", fg: "var(--dim)" },
  ];
  const total = breakdown.total || 1;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-[26px] overflow-hidden rounded-[7px]">
        {segments
          .filter((s) => s.count > 0)
          .map((s) => {
            const pct = (s.count / total) * 100;
            return (
              <span
                key={s.key}
                className="tnum flex items-center justify-center text-[11px] font-bold"
                style={{ width: `${pct}%`, background: s.bg, color: s.fg }}
                title={`${s.label}: ${s.count} of ${breakdown.total}`}
              >
                {pct >= 8 ? s.count : ""}
              </span>
            );
          })}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-dim">
        {segments.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ background: s.bg }} aria-hidden />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
