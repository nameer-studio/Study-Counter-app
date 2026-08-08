import clsx from "clsx";

/**
 * Circular progress ring (DS Components·08) — per-paper syllabus completion and the
 * dashboard's daily-hours ring. Ring colour follows the pace language; the centre
 * figure is always tabular so it doesn't jitter as hours accrue.
 */
export function ProgressRing({
  progress,
  color,
  diameter = 104,
  strokeWidth = 10,
  centerLabel,
  centerSub,
  breathing = false,
  className,
}: {
  /** 0–1. Clamped. */
  progress: number;
  color: string;
  diameter?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSub?: string;
  /** Slow pulse — used only while a session is actually running. */
  breathing?: boolean;
  className?: string;
}) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const box = 120;
  const r = (box - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped);

  // Font size in the SVG's user-unit space, not CSS pixels — this box is always 120
  // units regardless of the rendered `diameter`, so a fixed size that looked right for
  // a 2-character "72%" (Dashboard) silently overflows an 8-character "00:00:10"
  // (Timer): at diameter=220 the same 30-unit font renders ~55px tall, wider than the
  // whole ring. Size it from the actual label length against the ring's clear inner
  // width instead of a constant, then clamp so short labels don't balloon either.
  const innerClearWidth = (r - strokeWidth / 2) * 2 * 0.9;
  const approxCharWidth = 0.62; // bold tabular Inter, as a fraction of font-size
  const charCount = centerLabel?.length || 1;
  const fittedFontSize = innerClearWidth / (charCount * approxCharWidth);
  const centerFontSize = Math.round(Math.min(30, Math.max(14, fittedFontSize)));

  return (
    <svg
      width={diameter}
      height={diameter}
      viewBox={`0 0 ${box} ${box}`}
      className={clsx("flex-none", breathing && "animate-breathe", className)}
      role="img"
      aria-label={centerLabel ? `${centerLabel} ${centerSub ?? ""}`.trim() : `${Math.round(clamped * 100)} percent`}
    >
      <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke="var(--ring)" strokeWidth={strokeWidth} />
      <circle
        cx={box / 2}
        cy={box / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${box / 2} ${box / 2})`}
      />
      {centerLabel && (
        <text
          x={box / 2}
          y={centerSub ? box / 2 - 4 : box / 2 + 8}
          textAnchor="middle"
          className="tnum"
          style={{ font: `800 ${centerFontSize}px var(--font-inter), system-ui`, fill: "var(--text)" }}
        >
          {centerLabel}
        </text>
      )}
      {centerSub && (
        <text
          x={box / 2}
          y={box / 2 + 15}
          textAnchor="middle"
          style={{ font: "600 12px var(--font-inter), system-ui", fill: "var(--dim)" }}
        >
          {centerSub}
        </text>
      )}
    </svg>
  );
}
