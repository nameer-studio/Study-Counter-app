import type { TimeOfDayCell } from "@/lib/domain/insights";

const INTENSITY_COLOR = ["#1A1E2A", "#2A3566", "#3B47A0", "#5A67D8", "var(--primary)"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Chart 10 · When you study — hour × weekday grid. Answers "when am I actually
 *  productive", which for CA students is often 5am or after 11pm rather than the
 *  daytime hours a generic planner assumes. */
export function TimeOfDayHeatmap({
  grid,
  fromHour,
  toHour,
}: {
  grid: TimeOfDayCell[][];
  fromHour: number;
  toHour: number;
}) {
  const ticks: number[] = [];
  for (let h = fromHour; h <= toHour; h += 4) ticks.push(h);

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-around pb-1 pt-[2px] text-[8px] font-semibold text-dim">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="flex-1">
        <div className="flex flex-col gap-[3px]">
          {grid.map((row, i) => (
            <div key={i} className="flex gap-[3px]">
              {row.map((cell) => (
                <span
                  key={`${cell.weekday}-${cell.hour}`}
                  className="aspect-square flex-1 rounded-sm"
                  style={{ background: INTENSITY_COLOR[cell.intensity] }}
                  title={`${WEEKDAYS[cell.weekday]} ${formatHour(cell.hour)} — ${cell.hours.toFixed(1)}h`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[8px] font-semibold text-dim">
          {ticks.map((h) => (
            <span key={h}>{formatHour(h)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatHour(hour: number): string {
  const h = hour % 24;
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}
