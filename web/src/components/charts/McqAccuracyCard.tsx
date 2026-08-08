import type { McqAnalysis } from "@/lib/domain/mockStats";

/**
 * Chart 17 · MCQ accuracy & negative marking — Foundation P3/P4 only.
 *
 * The CA-specific signal nothing else in the app surfaces: a raw score never reveals
 * what guessing cost. A student scoring 36 who lost 6 marks to wrong guesses would have
 * cleared 40 by leaving them blank — and would otherwise never know.
 */
export function McqAccuracyCard({ analysis }: { analysis: McqAnalysis }) {
  const r = 32;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - analysis.accuracy);
  const accuracyPct = Math.round(analysis.accuracy * 100);
  const wouldHaveScored = analysis.marksRecoverableBySkipping;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-label font-semibold text-text">{analysis.paperName}</div>

      <div className="flex gap-2">
        <div className="flex-1 rounded-[14px] border border-border bg-surface2 p-[14px] text-center">
          <svg viewBox="0 0 80 80" width={64} className="mx-auto" role="img" aria-label={`Accuracy ${accuracyPct} percent`}>
            <circle cx="40" cy="40" r={r} fill="none" stroke="var(--ring)" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke={analysis.accuracy >= 0.6 ? "var(--green)" : "var(--amber)"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 40 40)"
            />
            <text x="40" y="45" textAnchor="middle" className="tnum" style={{ font: "800 18px var(--font-inter)", fill: "var(--text)" }}>
              {accuracyPct}%
            </text>
          </svg>
          <div className="mt-1 text-caption text-dim">Accuracy</div>
        </div>

        <div className="flex flex-1 flex-col justify-center rounded-[14px] border border-border bg-surface2 p-[14px]">
          <div className="text-caption text-dim">Marks lost to negatives</div>
          <div className="tnum mt-1 text-[26px] font-extrabold" style={{ color: "var(--red)" }}>
            −{analysis.marksLostToNegatives.toFixed(2)}
          </div>
          <div className="tnum mt-1 text-[10px] text-dim">
            {analysis.wrong} wrong · last mock
          </div>
        </div>
      </div>

      {wouldHaveScored > 0 && (
        <div
          className="flex items-start gap-[10px] rounded-[13px] p-[13px]"
          style={{
            background: "color-mix(in srgb, var(--amber) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--amber) 30%, transparent)",
          }}
        >
          <span className="text-[14px]" aria-hidden>⚖️</span>
          <p className="text-caption leading-[1.5] text-text">
            You&rsquo;d have kept{" "}
            <b>+{wouldHaveScored.toFixed(2)} marks by skipping</b> the {analysis.wrong}{" "}
            {analysis.wrong === 1 ? "question" : "questions"} you got wrong. Blank costs
            nothing here — only a wrong answer does.
          </p>
        </div>
      )}
    </div>
  );
}
