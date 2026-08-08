import type { BurnDownModel } from "@/lib/domain/readiness";

/**
 * Chart 12 · Syllabus burn-down — the app's most important diagram.
 *
 * Design brief: make "you will not finish in time" legible at a glance, then
 * immediately hand back an achievable next step. So the red projection crossing zero
 * *past* the exam marker is drawn with shaded overshoot (the honest bad news), and a
 * calm blue recovery line to zero-on-exam-day is drawn alongside it (the answer). The
 * red line is never left on screen unresolved — that's the difference between honest
 * and cruel.
 */
export function BurnDownChart({ model, examLabel }: { model: BurnDownModel; examLabel: string }) {
  const width = 340;
  const height = 220;
  const left = 30;
  const right = 332;
  const top = 12;
  const bottom = 180;

  const maxY = Math.max(model.totalChapters, 1);
  const maxX = Math.max(model.horizonOffset, 1);

  const px = (dayOffset: number) => left + (dayOffset / maxX) * (right - left);
  const py = (remaining: number) => bottom - (remaining / maxY) * (bottom - top);

  const examX = px(model.examOffset);
  const todayX = px(model.todayOffset);
  const todayY = py(model.remainingNow);

  const actualPoints = model.actual.map((p) => `${px(p.dayOffset)},${py(p.remaining)}`).join(" ");

  // Overshoot region: the area between exam day and the projected finish. This is the
  // "you run out of exam before you run out of syllabus" gap, made visible.
  const overshootPolygon =
    model.projectedFinishOffset !== null && model.projectedFinishOffset > model.examOffset
      ? [
          `${examX},${bottom}`,
          `${px(model.projectedFinishOffset)},${bottom}`,
          `${px(model.projectedFinishOffset)},${top}`,
          `${examX},${top}`,
        ].join(" ")
      : null;

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Syllabus burn-down: chapters remaining versus days until the exam">
        {overshootPolygon && (
          <polygon points={overshootPolygon} fill="color-mix(in srgb, var(--red) 10%, transparent)" />
        )}

        {/* axes */}
        <line x1={left} y1={top} x2={left} y2={bottom} stroke="var(--border)" strokeWidth="1" />
        <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="var(--border)" strokeWidth="1" />
        <text x="6" y={top + 8} className="tnum" style={{ font: "600 8px var(--font-inter)", fill: "var(--dim)" }}>
          {Math.round(model.totalChapters)}
        </text>
        <text x="12" y={bottom + 3} style={{ font: "600 8px var(--font-inter)", fill: "var(--dim)" }}>0</text>

        {/* exam day — a hard wall, drawn as furniture not decoration */}
        <line x1={examX} y1={top} x2={examX} y2={bottom} stroke="var(--red)" strokeWidth="2" strokeDasharray="5 4" />
        <text x={examX} y={bottom + 16} textAnchor="middle" style={{ font: "700 9px var(--font-inter)", fill: "var(--red)" }}>
          EXAM · {examLabel}
        </text>

        {/* ideal pace */}
        <line
          x1={px(model.ideal[0].dayOffset)}
          y1={py(model.ideal[0].remaining)}
          x2={px(model.ideal[1].dayOffset)}
          y2={py(model.ideal[1].remaining)}
          stroke="var(--green)"
          strokeWidth="1.5"
          strokeDasharray="2 3"
        />

        {/* projected at current pace */}
        {model.projected && (
          <line
            x1={px(model.projected[0].dayOffset)}
            y1={py(model.projected[0].remaining)}
            x2={px(model.projected[1].dayOffset)}
            y2={py(model.projected[1].remaining)}
            stroke="var(--red)"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        )}

        {/* recovery path — the achievable answer */}
        {model.recovery && (
          <line
            x1={px(model.recovery[0].dayOffset)}
            y1={py(model.recovery[0].remaining)}
            x2={px(model.recovery[1].dayOffset)}
            y2={py(model.recovery[1].remaining)}
            stroke="var(--primary)"
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />
        )}

        {/* actual, drawn last so it sits on top */}
        <polyline points={actualPoints} fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        <circle cx={todayX} cy={todayY} r="4" fill="var(--text)" />
        <text x={todayX} y={Math.max(top + 8, todayY - 9)} textAnchor="middle" className="tnum" style={{ font: "700 8px var(--font-inter)", fill: "var(--text)" }}>
          today · {Math.round(model.remainingNow)} left
        </text>
      </svg>

      <div className="flex flex-wrap gap-3 text-[10px] text-dim">
        <span className="inline-flex items-center gap-[5px]">
          <span className="h-[2px] w-[14px]" style={{ background: "var(--text)" }} aria-hidden />
          Actual
        </span>
        <span className="inline-flex items-center gap-[5px]">
          <span className="w-[14px] border-t-2 border-dashed" style={{ borderColor: "var(--green)" }} aria-hidden />
          Ideal pace
        </span>
        <span className="inline-flex items-center gap-[5px]">
          <span className="w-[14px] border-t-2 border-dashed" style={{ borderColor: "var(--red)" }} aria-hidden />
          At this pace
        </span>
        {model.recovery && (
          <span className="inline-flex items-center gap-[5px]">
            <span className="w-[14px] border-t-2 border-dashed" style={{ borderColor: "var(--primary)" }} aria-hidden />
            Recovery
          </span>
        )}
      </div>
    </div>
  );
}
