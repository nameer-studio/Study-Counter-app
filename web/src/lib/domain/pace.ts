/**
 * Mirrors `domain/model/PaceState.kt` and the Kotlin `PaceCalculator`. Pure TypeScript —
 * no React, no DOM — so it unit-tests without a browser and can be checked for identical
 * output against the Android engine. A student must never see "34 days behind" on their
 * phone and "31 days behind" on the laptop.
 */

export type PaceStatus = "ahead" | "onPace" | "behind" | "notStarted";

export interface PaceState {
  status: PaceStatus;
  /** Signed: positive = days ahead, negative = days behind. Null when notStarted. */
  dayDelta: number | null;
}

/** Past this many days behind, the badge escalates amber → red (matches the DS examples:
 *  "3 days behind" = amber, "12 days behind" = red). */
export const AMBER_TO_RED_THRESHOLD_DAYS = 7;

export function paceLabel(state: PaceState): string {
  switch (state.status) {
    case "onPace":
      return "On pace";
    case "ahead":
      return `${state.dayDelta ?? 0} days ahead`;
    case "behind":
      return `${Math.abs(state.dayDelta ?? 0)} days behind`;
    case "notStarted":
      return "Not started";
  }
}

/** Which theme colour variable this pace state renders in. */
export function paceColorVar(state: PaceState): string {
  switch (state.status) {
    case "onPace":
    case "ahead":
      return "var(--green)";
    case "behind":
      return Math.abs(state.dayDelta ?? 0) > AMBER_TO_RED_THRESHOLD_DAYS
        ? "var(--red)"
        : "var(--amber)";
    case "notStarted":
      return "var(--grey)";
  }
}

/**
 * Derives pace from syllabus coverage against time remaining.
 *
 * Both "chapters" figures are whole counts; [daysRemaining] is days until the exam.
 * Returns the signed day-delta between where the student is and where the ideal
 * constant-rate line says they should be.
 */
export function calculatePace(args: {
  chaptersTotal: number;
  chaptersCompleted: number;
  daysRemaining: number;
  daysElapsed: number;
}): PaceState {
  const { chaptersTotal, chaptersCompleted, daysRemaining, daysElapsed } = args;

  if (chaptersTotal <= 0 || chaptersCompleted <= 0) {
    return { status: "notStarted", dayDelta: null };
  }

  const totalDays = daysElapsed + daysRemaining;
  if (totalDays <= 0) {
    return { status: "notStarted", dayDelta: null };
  }

  // Where an even pace would have you by now.
  const expectedCompleted = (chaptersTotal * daysElapsed) / totalDays;
  const chaptersAhead = chaptersCompleted - expectedCompleted;

  // Convert a chapter surplus/deficit into days, at the ideal rate.
  const chaptersPerDay = chaptersTotal / totalDays;
  if (chaptersPerDay <= 0) {
    return { status: "notStarted", dayDelta: null };
  }

  const dayDelta = Math.round(chaptersAhead / chaptersPerDay);

  // A day either side of ideal is noise, not a signal worth alarming anyone about.
  if (Math.abs(dayDelta) <= 1) {
    return { status: "onPace", dayDelta: 0 };
  }
  return dayDelta > 0
    ? { status: "ahead", dayDelta }
    : { status: "behind", dayDelta };
}
