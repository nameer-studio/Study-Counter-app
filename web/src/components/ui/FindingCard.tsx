import type { Finding, FindingTone } from "@/lib/domain/insights";

const TONE: Record<FindingTone, { color: string; icon: React.ReactNode }> = {
  critical: {
    color: "var(--red)",
    icon: (
      <path d="M12 9v4M12 17h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    ),
  },
  warning: {
    color: "var(--amber)",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  good: { color: "var(--green)", icon: <path d="M20 6 9 17l-5-5" /> },
};

/** Plain-language finding card (E3). Tone is dual-coded — colour plus a distinct icon —
 *  so severity survives both colour-blindness and a greyscale screenshot. */
export function FindingCard({ finding }: { finding: Finding }) {
  const tone = TONE[finding.tone];
  return (
    <div
      className="flex items-start gap-[11px] rounded-[14px] p-[14px]"
      style={{
        background: `color-mix(in srgb, ${tone.color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${tone.color} 30%, transparent)`,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={tone.color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-[1px] flex-none"
        aria-hidden
      >
        {tone.icon}
      </svg>
      <p className="text-caption leading-[1.5] text-text">{finding.text}</p>
    </div>
  );
}
