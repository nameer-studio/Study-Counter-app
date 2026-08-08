import type { LoggedSession } from "@/lib/domain/loggedSession";
import type { PlannedBlock } from "@/lib/domain/plannedBlock";
import type { Attempt } from "@/lib/domain/attempt";
import { daysUntilExam, daysUntilNextPaper } from "@/lib/domain/attempt";
import type { Profile, Situation, SituationHourOverrides } from "@/lib/domain/profile";
import { dailyTargetHours, SITUATION_OPTIONS } from "@/lib/domain/profile";
import { calculatePace } from "@/lib/domain/pace";
import { currentStreak, dailyHours } from "@/lib/domain/stats";
import { chapterProgress, paperReadiness, weakestPaper } from "@/lib/domain/readiness";
import { nextChapterToStudy } from "@/lib/domain/chapterStats";
import { LEVELS, hasSyllabusData, papersForAttempt } from "@/lib/icai/levels";
import { SESSION_SHORT_LABEL } from "@/lib/domain/attempt";
import type { RevisionRound } from "@/lib/domain/types";
import { isoDate } from "@/lib/domain/week";
import type { DashboardData, NeglectAlert, PlanBlock } from "@/lib/fixtures/dashboard";

/**
 * Builds real `DashboardData` from the student's actual attempt, sessions, revision
 * rounds and planned blocks — what `/dashboard` renders instead of a canned fixture.
 * `DASHBOARD_FIXTURES` (lib/fixtures/dashboard.ts) still exists purely for the
 * `/design-check` gallery, which needs to show all three pace states side by side on
 * demand; a live student is always in exactly one real state, computed here.
 *
 * Every number here is derived from the same domain engines the Stats/Readiness/Syllabus
 * screens use (readiness.ts, stats.ts, pace.ts) — never a second, parallel calculation —
 * so the Dashboard can't quietly disagree with the rest of the app about the same data.
 */
export function buildLiveDashboardData(args: {
  attempt: Attempt;
  situation: Situation | null;
  profile: Profile | null;
  sessions: LoggedSession[];
  rounds: Record<string, RevisionRound>;
  blocks: PlannedBlock[];
  hourOverrides?: SituationHourOverrides;
  now?: Date;
}): DashboardData {
  const { attempt, situation, profile, sessions, rounds, blocks, hourOverrides = {} } = args;
  const now = args.now ?? new Date();
  const today = isoDate(now);

  const papers = papersForAttempt(attempt.level, attempt.group);
  const syllabusReady = hasSyllabusData(attempt.level);

  // ---- Countdown ----
  const daysToAttempt = daysUntilExam(attempt, now);
  const attemptLabel = `CA ${LEVELS[attempt.level].label} · ${SESSION_SHORT_LABEL[attempt.session]} ${attempt.year}`;
  const nextPaper = daysUntilNextPaper(attempt, now);
  const nextPaperSeed = nextPaper ? papers.find((p) => p.id === nextPaper.paperId) : undefined;

  // ---- Pace ----
  // daysElapsed mirrors the burn-down chart's own convention (readiness.ts) — measured
  // from the earliest logged session, defaulting to a 30-day window when there's no
  // history yet, so a brand-new student reads as "not started" rather than a division
  // artifact.
  const totalChapters = papers.reduce((sum, p) => sum + p.chapters.length, 0);
  const completedChapters = papers
    .flatMap((p) => p.chapters)
    .reduce((sum, c) => sum + chapterProgress(rounds[c.id] ?? "notStarted"), 0);
  const earliestSessionMs = sessions.length > 0 ? Math.min(...sessions.map((s) => s.endedAt)) : now.getTime() - 30 * 86_400_000;
  const daysElapsed = Math.max(1, Math.round((now.getTime() - earliestSessionMs) / 86_400_000));
  const pace = syllabusReady
    ? calculatePace({ chaptersTotal: totalChapters, chaptersCompleted: completedChapters, daysRemaining: Math.max(0, daysToAttempt), daysElapsed })
    : { status: "notStarted" as const, dayDelta: null };

  // ---- Situation / target ----
  const targetHours = dailyTargetHours(situation, hourOverrides);
  const situationOption = situation ? SITUATION_OPTIONS.find((o) => o.mode === situation.mode) : undefined;
  const situationLabel = situationOption ? `${situationOption.label} · ${targetHours}h target` : `${targetHours}h target`;

  // ---- Today ----
  // Rounded to 1dp at the source — DashboardData.doneHours is a display-shaped field
  // (the fixtures were always clean numbers like 0.5, 3.2), so a raw floating-point hours
  // value here would surface as visible garbage like "0.00030305...h" the moment a real
  // session's duration doesn't divide evenly into hours.
  const doneHours = round1(
    sessions
      .filter((s) => isoDate(new Date(s.endedAt)) === today)
      .reduce((sum, s) => sum + s.durationMs / 3_600_000, 0),
  );

  const readiness = syllabusReady ? paperReadiness(papers, rounds) : [];
  const weakest = weakestPaper(readiness);
  const weakestPaperSeed = weakest ? papers.find((p) => p.id === weakest.paperId) : undefined;

  // ---- Start CTA: the weakest paper's furthest-along-but-unfinished chapter ----
  let ctaTitle = "Start studying";
  let ctaSub = "Pick a paper to begin";
  let ctaPaperId = papers[0]?.id ?? "";
  let ctaChapterId = papers[0]?.chapters[0]?.id ?? "";
  let ctaActivityType: DashboardData["ctaActivityType"] = "concept";

  if (weakestPaperSeed && weakestPaperSeed.chapters.length > 0) {
    const unfinished = nextChapterToStudy(weakestPaperSeed, rounds);
    const round = rounds[unfinished.id] ?? "notStarted";
    ctaPaperId = weakestPaperSeed.id;
    ctaChapterId = unfinished.id;
    if (round === "notStarted") {
      ctaTitle = `Start now — ${weakestPaperSeed.name}`;
      ctaSub = `${unfinished.name} · your weakest paper`;
      ctaActivityType = "concept";
    } else {
      ctaTitle = `Continue — ${unfinished.name}`;
      ctaSub = `${weakestPaperSeed.name} · ${weakest!.percent}% ready`;
      ctaActivityType = "revision";
    }
  }

  // ---- Neglect alert: the least-recently-touched paper, distinct from the CTA above so
  // the two suggestions never repeat the same paper twice on one screen. ----
  const alert = buildNeglectAlert(papers, sessions, ctaPaperId, now);

  // ---- Today's plan, from real planned blocks ----
  const todaysBlocks: PlanBlock[] = blocks
    .filter((b) => b.date === today)
    .map((b) => {
      const paper = papers.find((p) => p.id === b.paperId);
      const chapter = paper?.chapters.find((c) => c.id === b.chapterId);
      return {
        activity: b.activityType,
        label: chapter ? chapter.name : "Chapter",
        paper: paper?.category ?? "accounts",
        durationLabel: formatBlockHours(b.durationMinutes),
        done: b.completed,
        urgent: !b.completed && weakest?.paperId === b.paperId,
      };
    });

  // ---- Week chart ----
  const week = dailyHours(sessions, 7, now.getTime()).map((d) => round1(d.hours));

  const greeting = greetingFor(now);
  const displayName = profile?.displayName?.trim().split(" ")[0] || "there";

  return {
    clock: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
    greeting,
    name: displayName,
    daysToAttempt,
    attemptLabel,
    daysToPaper: nextPaper?.days ?? daysToAttempt,
    paperName: nextPaperSeed?.name ?? "your papers",
    paperCategory: nextPaperSeed?.category ?? "accounts",
    pace,
    reframe: reframeFor(pace, syllabusReady),
    targetHours,
    doneHours,
    situation: situation?.mode ?? "fullTimeStudy",
    situationLabel,
    ctaTitle,
    ctaSub,
    ctaPaperId,
    ctaChapterId,
    ctaActivityType,
    alert,
    streakCount: currentStreak(sessions, now.getTime()),
    blocks: todaysBlocks,
    week,
    // Friends/presence is a Phase 3 feature (PLAN.md — no backend yet). Showing
    // fabricated names here once the rest of the screen is real data would be actively
    // misleading, so this stays empty rather than decorative until it's real.
    friends: [],
  };
}

function greetingFor(now: Date): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function reframeFor(pace: DashboardData["pace"], syllabusReady: boolean): string {
  if (!syllabusReady) {
    return "This level's syllabus isn't loaded yet — chapter tracking and pace need that first.";
  }
  switch (pace.status) {
    case "notStarted":
      return "Log a session and mark some chapters to see whether you're on pace.";
    case "ahead": {
      const d = pace.dayDelta ?? 0;
      return `Ahead by ${d} day${d === 1 ? "" : "s"}. Bank it — keep the momentum, don't coast into a false sense of safety.`;
    }
    case "onPace":
      return "On pace. Hold the rhythm — one more block clears today's target.";
    case "behind": {
      const d = Math.abs(pace.dayDelta ?? 0);
      return `Behind by ${d} day${d === 1 ? "" : "s"}, but recoverable. Start with the paper that hurts.`;
    }
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function formatBlockHours(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

function buildNeglectAlert(
  papers: ReturnType<typeof papersForAttempt>,
  sessions: LoggedSession[],
  excludePaperId: string,
  now: Date,
): NeglectAlert | null {
  let worst: { paperId: string; daysSince: number; name: string; chapterId: string } | null = null;

  for (const paper of papers) {
    if (paper.id === excludePaperId || paper.chapters.length === 0) continue;
    const own = sessions.filter((s) => s.paperId === paper.id);
    const daysSince =
      own.length === 0 ? Infinity : Math.floor((now.getTime() - Math.max(...own.map((s) => s.endedAt))) / 86_400_000);
    if (daysSince >= 5 && (!worst || daysSince > worst.daysSince)) {
      worst = { paperId: paper.id, daysSince, name: paper.name, chapterId: paper.chapters[0].id };
    }
  }

  if (!worst) return null;

  const untouched = worst.daysSince === Infinity;
  return {
    text: untouched ? `${worst.name} has no logged time yet` : `${worst.name} untouched for ${worst.daysSince} days`,
    sub: untouched ? "It carries the same marks as everything else." : "A short revision keeps it warm.",
    action: untouched ? "Schedule 2h" : "Add 1h",
    tone: untouched || worst.daysSince >= 10 ? "red" : "amber",
    paperId: worst.paperId,
    chapterId: worst.chapterId,
    activityType: "revision",
    durationMinutes: untouched || worst.daysSince >= 10 ? 120 : 60,
  };
}
