import { PASS_AGGREGATE_PERCENT } from "@/lib/domain/mockTest";

/**
 * Chart 14 · Projected aggregate — semicircular gauge against the ICAI 50% aggregate
 * pass line.
 *
 * The 50% tick is drawn as a bold red rule with a label, deliberately heavier than the
 * gauge fill itself. Per the design brief the pass thresholds are "furniture, never
 * decoration": a student glancing at this must see the line before they see their own
 * number, because the line is the thing that decides their year.
 *
 * Geometry: centre (80,90), radius 65, sweeping 180°→0°. 50% therefore sits exactly at
 * top-centre (80,25), which is where the threshold tick goes.
 */
export function AggregateGauge({
  percent,
  papersCounted,
}: {
  /** Null when no mocks have been logged — renders an honest empty state. */
  percent: number | null;
  papersCounted: number;
}) {
  const cx = 80;
  const cy = 90;
  const r = 65;

  const pointOnArc = (fraction: number) => {
    const angle = ((180 - fraction * 180) * Math.PI) / 180;
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  };

  const clamped = percent === null ? 0 : Math.min(Math.max(percent, 0), 100);
  const end = pointOnArc(clamped / 100);
  const clears = percent !== null && percent >= PASS_AGGREGATE_PERCENT;
  const fillColor = percent === null ? "var(--grey)" : clears ? "var(--green)" : "var(--amber)";

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 100" width={150} className="flex-none" role="img" aria-label={percent === null ? "No aggregate projection yet" : `Projected aggregate ${Math.round(percent)} percent against a 50 percent pass line`}>
        {/* track */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--surface2)" strokeWidth="14" strokeLinecap="round" />

        {/* value */}
        {percent !== null && clamped > 0 && (
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
            fill="none"
            stroke={fillColor}
            strokeWidth="14"
            strokeLinecap="round"
          />
        )}

        {/* 50% pass threshold — heavier than the fill, on purpose */}
        <line x1={cx} y1="16" x2={cx} y2="30" stroke="var(--red)" strokeWidth="3.5" />
        <text x={cx} y="12" textAnchor="middle" style={{ font: "800 11px var(--font-inter)", fill: "var(--red)" }}>
          50% PASS
        </text>

        <text x={cx} y="74" textAnchor="middle" className="tnum" style={{ font: "800 26px var(--font-inter)", fill: "var(--text)" }}>
          {percent === null ? "—" : `${Math.round(percent)}%`}
        </text>
        <text x={cx} y="90" textAnchor="middle" style={{ font: "600 9px var(--font-inter)", fill: "var(--dim)" }}>
          projected
        </text>
      </svg>

      <div className="flex-1">
        {percent === null ? (
          <>
            <div className="text-label font-semibold text-text">No mocks logged yet.</div>
            <p className="mt-1 text-caption leading-[1.5] text-dim">
              Aggregate can only be projected from real mock marks — estimating it from
              syllabus progress would be a number you shouldn&rsquo;t trust.
            </p>
          </>
        ) : (
          <>
            <div className="text-label font-semibold text-text">
              {clears
                ? `${Math.round(percent - PASS_AGGREGATE_PERCENT)} marks clear of the aggregate line.`
                : `${Math.round(PASS_AGGREGATE_PERCENT - percent)} marks under the aggregate line.`}
            </div>
            <p className="mt-1 text-caption leading-[1.5] text-dim">
              Based on your latest mock in each of {papersCounted}{" "}
              {papersCounted === 1 ? "paper" : "papers"}. Clearing 50% overall is only half
              the rule — every paper still needs 40.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
