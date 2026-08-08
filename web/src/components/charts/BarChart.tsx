import type { DailyBar } from "@/lib/domain/stats";

/** Chart 01 · Hours per day — ported 1:1 from the DS file's viewBox="0 0 320 150"
 *  convention (E1's own chart), with a dashed target line drawn as real furniture,
 *  never decoration. */
export function BarChart({
  data,
  targetHours,
  color = "var(--primary)",
}: {
  data: DailyBar[];
  targetHours: number;
  color?: string;
}) {
  const width = 320;
  const baseline = 118;
  const chartTop = 10;
  const maxHours = Math.max(targetHours * 1.2, ...data.map((d) => d.hours), 1);
  const scale = (baseline - chartTop) / maxHours;
  const barWidth = Math.min(30, (width / data.length) * 0.6);
  const gap = width / data.length;
  const targetY = baseline - targetHours * scale;

  return (
    <svg viewBox={`0 0 ${width} 150`} className="w-full" role="img" aria-label="Hours studied per day">
      <line x1="0" y1={baseline} x2={width} y2={baseline} stroke="var(--border)" strokeWidth="1" />
      <line x1="0" y1={targetY} x2={width} y2={targetY} stroke="#3A4050" strokeWidth="1" strokeDasharray="4 4" />
      <text x={width - 2} y={targetY - 4} textAnchor="end" className="tnum" style={{ font: "600 9px var(--font-inter)", fill: "var(--dim)" }}>
        target {targetHours}h
      </text>
      {data.map((d, i) => {
        const x = i * gap + (gap - barWidth) / 2;
        const h = Math.max(2, d.hours * scale);
        const y = baseline - h;
        return (
          <g key={d.dateIso}>
            <rect x={x} y={y} width={barWidth} height={h} rx="4" fill={color} />
            <text x={x + barWidth / 2} y="132" textAnchor="middle" style={{ font: "600 9px var(--font-inter)", fill: "var(--dim)" }}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
