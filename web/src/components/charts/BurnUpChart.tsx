import type { BurnUpModel } from "@/lib/domain/readiness";

/** Chart 13 · Cumulative hours (burn-up) — actual hours logged against the plan line,
 *  with the exam day marked. Ported from the DS file's viewBox="0 0 340 160". */
export function BurnUpChart({ model }: { model: BurnUpModel }) {
  const width = 340;
  const height = 160;
  const left = 30;
  const right = 332;
  const top = 10;
  const bottom = 128;

  const maxY = Math.max(model.targetHours, model.todayHours, 1);
  const maxX = Math.max(model.horizonOffset, 1);

  const px = (d: number) => left + (d / maxX) * (right - left);
  const py = (h: number) => bottom - (h / maxY) * (bottom - top);

  const examX = px(model.examOffset);
  const actualPoints = model.actual.map((p) => `${px(p.dayOffset)},${py(p.hours)}`).join(" ");
  const todayX = px(model.todayOffset);
  const todayY = py(model.todayHours);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Cumulative study hours against plan">
      <line x1={left} y1={top} x2={left} y2={bottom} stroke="var(--border)" strokeWidth="1" />
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="var(--border)" strokeWidth="1" />
      <line x1={examX} y1={top} x2={examX} y2={bottom} stroke="var(--red)" strokeWidth="1.5" strokeDasharray="5 4" />

      {/* plan line — zero to the syllabus's full estimated hours, by exam day */}
      <line
        x1={px(0)}
        y1={py(0)}
        x2={examX}
        y2={py(model.targetHours)}
        stroke="var(--green)"
        strokeWidth="1.5"
        strokeDasharray="2 3"
      />
      <text x={left + 8} y={top + 12} className="tnum" style={{ font: "600 8px var(--font-inter)", fill: "var(--green)" }}>
        plan · {Math.round(model.targetHours)}h
      </text>

      <polyline points={actualPoints} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx={todayX} cy={todayY} r="4" fill="var(--primary)" />
      <text x={todayX} y={Math.max(top + 8, todayY - 8)} textAnchor="middle" className="tnum" style={{ font: "700 8px var(--font-inter)", fill: "var(--primary)" }}>
        {Math.round(model.todayHours)}h
      </text>
    </svg>
  );
}
