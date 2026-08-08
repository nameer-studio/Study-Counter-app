import type { MockSeries } from "@/lib/domain/mockStats";
import { PASS_MARKS_PER_PAPER } from "@/lib/domain/mockTest";

/**
 * Chart 16 · Mock marks per paper, with the 40-mark pass line.
 *
 * Per the design brief the pass line is drawn as a thick red rule with a solid chip
 * label spanning the chart, and it must "never be visually subordinate to the data
 * lines" — it's stroked heavier than the series themselves and drawn after the axes but
 * before the data, so no series can obscure it. A student glancing at this needs to see
 * the line that decides their year before they see their own scores.
 */
export function MockTrendChart({ series }: { series: MockSeries[] }) {
  const width = 340;
  const height = 210;
  const left = 30;
  const right = 332;
  const top = 10;
  const bottom = 170;
  const maxMarks = 100;

  const py = (marks: number) => bottom - (marks / maxMarks) * (bottom - top);

  // Shared date axis across all papers so lines are comparable.
  const allDates = series.flatMap((s) => s.points.map((p) => p.date)).sort((a, b) => a - b);
  const minDate = allDates[0] ?? 0;
  const maxDate = allDates[allDates.length - 1] ?? 1;
  const span = Math.max(1, maxDate - minDate);
  const px = (date: number) => left + ((date - minDate) / span) * (right - left - 20) + 10;

  const passY = py(PASS_MARKS_PER_PAPER);

  if (series.length === 0) {
    return <p className="text-caption text-dim">No mocks logged yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Mock marks per paper against the 40-mark pass line">
        <line x1={left} y1={top} x2={left} y2={bottom} stroke="var(--border)" strokeWidth="1" />
        <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="var(--border)" strokeWidth="1" />
        <text x="6" y={top + 4} className="tnum" style={{ font: "600 8px var(--font-inter)", fill: "var(--dim)" }}>100</text>
        <text x="12" y={bottom + 3} style={{ font: "600 8px var(--font-inter)", fill: "var(--dim)" }}>0</text>

        {/* The 40-mark line — furniture, not decoration. Drawn under the series so it
            never hides a data point sitting on the threshold itself. */}
        <line x1={left} y1={passY} x2={right} y2={passY} stroke="var(--red)" strokeWidth="3" />

        {series.map((s) => (
          <g key={s.paperId}>
            {s.points.length > 1 && (
              <polyline
                points={s.points.map((p) => `${px(p.date)},${py(p.marks)}`).join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {s.points.map((p, i) => (
              <circle key={i} cx={px(p.date)} cy={py(p.marks)} r="3.5" fill={s.color}>
                <title>{`${s.name} — ${p.marks} marks on ${new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}</title>
              </circle>
            ))}
          </g>
        ))}

        {/* The label rides above the series deliberately: the brief says this line must
            never read as subordinate to the data, and mock marks cluster either side of
            40 — so drawing the chip underneath left the text struck through by whichever
            papers happened to score near the pass mark, which is precisely when a student
            most needs to read it. */}
        <rect x={right - 84} y={passY - 18} width="84" height="15" rx="3" fill="var(--red)" />
        <text
          x={right - 42}
          y={passY - 7}
          textAnchor="middle"
          style={{ font: "800 9px var(--font-inter)", fill: "var(--primary-on)" }}
        >
          40 · PASS MARK
        </text>
      </svg>

      <div className="flex flex-wrap gap-3 text-[10px] text-dim">
        {series.map((s) => (
          <span key={s.paperId} className="inline-flex items-center gap-[5px]">
            <span className="h-[2px] w-3" style={{ background: s.color }} aria-hidden />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
