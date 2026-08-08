import type { ChapterTime } from "@/lib/domain/chapterStats";

/** Chart 09 · Chapters by time spent — ranked rows with a fixed-width inline bar,
 *  ported from the DS file. Chapters with zero logged time are omitted rather than
 *  padding the list with empty bars. */
export function RankedChapterBars({
  chapters,
  color = "var(--paper-accounts)",
  limit = 8,
}: {
  chapters: ChapterTime[];
  color?: string;
  limit?: number;
}) {
  const withTime = chapters.filter((c) => c.hours > 0).slice(0, limit);
  const maxHours = Math.max(...withTime.map((c) => c.hours), 1);

  if (withTime.length === 0) {
    return <p className="text-caption text-dim">No time logged against this paper yet.</p>;
  }

  return (
    <div className="flex flex-col gap-[9px]">
      {withTime.map((c) => (
        <div key={c.chapterId} className="flex items-center gap-[10px]">
          <span className="min-w-0 flex-1 truncate text-caption text-text" title={c.name}>
            {c.name}
          </span>
          <div className="h-[10px] w-[120px] flex-none overflow-hidden rounded-full bg-surface2">
            <div
              className="h-full rounded-full"
              style={{ width: `${(c.hours / maxHours) * 100}%`, background: color }}
            />
          </div>
          <span className="tnum w-9 flex-none text-right text-[11px] font-semibold text-dim">
            {c.hours.toFixed(1)}h
          </span>
        </div>
      ))}
    </div>
  );
}
