import type { WeekPoint } from "@/lib/domain/stats";

/** Chart 02 · Weekly trend — line + soft area fill, ported from the DS file's
 *  polyline/circle convention. */
export function TrendChart({ data, color = "var(--primary)" }: { data: WeekPoint[]; color?: string }) {
  const width = 320;
  const baseline = 118;
  const chartTop = 10;
  const maxHours = Math.max(...data.map((d) => d.hours), 1);
  const scale = (baseline - chartTop) / maxHours;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: baseline - d.hours * scale,
    label: d.label,
  }));

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `0,${baseline} ${linePoints} ${width},${baseline}`;

  return (
    <svg viewBox={`0 0 ${width} 150`} className="w-full" role="img" aria-label="Weekly study hours trend">
      <line x1="0" y1={baseline} x2={width} y2={baseline} stroke="var(--border)" strokeWidth="1" />
      <polyline points={areaPoints} fill="color-mix(in srgb, var(--primary) 12%, transparent)" stroke="none" />
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--surface)" stroke={color} strokeWidth="2" />
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.x} y="134" textAnchor="middle" style={{ font: "600 8px var(--font-inter)", fill: "var(--dim)" }}>
          {p.label}
        </text>
      ))}
    </svg>
  );
}
