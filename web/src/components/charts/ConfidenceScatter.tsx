import type { ScatterPoint } from "@/lib/domain/chapterStats";

/**
 * Chart 08 · Confidence vs time spent, with quadrant guides. The bottom-right quadrant
 * is the one that matters: lots of hours sunk, confidence still low — meaning the
 * *method* is wrong, not the effort. Ported from the DS file's viewBox="0 0 320 200".
 */
export function ConfidenceScatter({
  points,
  color = "var(--paper-accounts)",
}: {
  points: ScatterPoint[];
  color?: string;
}) {
  const width = 320;
  const height = 200;
  const left = 34;
  const right = 316;
  const top = 8;
  const bottom = 172;

  const maxHours = Math.max(...points.map((p) => p.hours), 1);
  const maxSessions = Math.max(...points.map((p) => p.sessionCount), 1);

  const midX = left + (right - left) / 2;
  const midY = top + (bottom - top) / 2;

  return (
    <div className="flex flex-col gap-1">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Confidence versus time spent per chapter">
        {/* axes */}
        <line x1={left} y1={top} x2={left} y2={bottom} stroke="var(--border)" strokeWidth="1" />
        <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="var(--border)" strokeWidth="1" />
        {/* quadrant guides */}
        <line x1={left} y1={midY} x2={right} y2={midY} stroke="var(--surface2)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={midX} y1={top} x2={midX} y2={bottom} stroke="var(--surface2)" strokeWidth="1" strokeDasharray="3 3" />
        <text x="6" y="16" style={{ font: "600 8px var(--font-inter)", fill: "var(--dim)" }}>conf</text>
        <text x="6" y={bottom - 2} style={{ font: "600 8px var(--font-inter)", fill: "var(--dim)" }}>low</text>
        <text x={right - 16} y={height - 12} style={{ font: "600 8px var(--font-inter)", fill: "var(--dim)" }}>time→</text>

        {points.map((p) => {
          const x = left + (p.hours / maxHours) * (right - left - 12) + 6;
          // confidence 1..5 -> bottom..top
          const y = bottom - ((p.confidence - 1) / 4) * (bottom - top);
          const r = 4 + (p.sessionCount / maxSessions) * 5;
          return (
            <circle
              key={p.chapterId}
              cx={x}
              cy={y}
              r={r}
              fill={`color-mix(in srgb, ${color} 35%, transparent)`}
              stroke={color}
              strokeWidth="1.5"
            >
              <title>{`${p.name} — ${p.hours.toFixed(1)}h, confidence ${p.confidence}/5`}</title>
            </circle>
          );
        })}
      </svg>
      <p className="text-[10px] text-dim">
        Bottom-right = lots of time, still low confidence → review method. Larger dot = more sessions.
      </p>
    </div>
  );
}
