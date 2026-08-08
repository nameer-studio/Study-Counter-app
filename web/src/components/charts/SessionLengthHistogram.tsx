import type { HistogramBucket } from "@/lib/domain/insights";

/** Chart 11 · Session length — distribution of how long sessions actually run.
 *  The 60–90 minute buckets are highlighted as the deep-work band. */
export function SessionLengthHistogram({ buckets }: { buckets: HistogramBucket[] }) {
  const width = 320;
  const baseline = 118;
  const top = 10;
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const slot = width / buckets.length;
  const barWidth = Math.min(42, slot * 0.7);

  return (
    <svg viewBox={`0 0 ${width} 150`} className="w-full" role="img" aria-label="Distribution of session lengths">
      <line x1="0" y1={baseline} x2={width} y2={baseline} stroke="var(--border)" strokeWidth="1" />
      {buckets.map((bucket, i) => {
        const h = bucket.count === 0 ? 0 : Math.max(3, (bucket.count / maxCount) * (baseline - top));
        const x = i * slot + (slot - barWidth) / 2;
        // Deep-work band gets the primary colour; everything else stays muted.
        const isDeepWork = bucket.minMinutes >= 60 && bucket.minMinutes < 120;
        return (
          <g key={bucket.label}>
            <rect
              x={x}
              y={baseline - h}
              width={barWidth}
              height={h}
              rx="4"
              fill={isDeepWork ? "var(--primary)" : "var(--surface2)"}
            >
              <title>{`${bucket.label}: ${bucket.count} sessions`}</title>
            </rect>
            <text
              x={x + barWidth / 2}
              y="132"
              textAnchor="middle"
              style={{ font: "600 8px var(--font-inter)", fill: "var(--dim)" }}
            >
              {bucket.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
