"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { User } from "@supabase/supabase-js";
import { useLocalState } from "@/lib/hooks/useLocalState";
import { useSyncedLocalState } from "@/lib/hooks/useSyncedLocalState";
import { PROFILE_SYNC, ATTEMPT_SYNC, SITUATION_SYNC } from "@/lib/sync/syncConfigs";
import { hasRemoteAttempt } from "@/lib/sync/runInitialSync";
import { AuthForm } from "@/components/auth/AuthForm";
import { AttemptEditor, nextGroupForLevel } from "@/components/attempt/AttemptEditor";
import { type GroupScope } from "@/lib/icai/levels";
import {
  defaultPaperDates,
  defaultSessionFor,
  earliestDate,
  type Attempt,
} from "@/lib/domain/attempt";
import { SITUATION_OPTIONS, type Profile, type Situation } from "@/lib/domain/profile";
import {
  VALID_SESSIONS,
  type ExamSession,
  type IcaiLevel,
  type SituationMode,
} from "@/lib/domain/types";

const PROFILE_KEY = "sc-profile";
const ATTEMPT_KEY = "sc-attempt";
const SITUATION_KEY = "sc-situation";
const ONBOARDED_KEY = "sc-onboarded";

type Step = "welcome" | "auth" | "profile" | "attempt" | "situation";
const STEP_ORDER: Step[] = ["welcome", "auth", "profile", "attempt", "situation"];

/**
 * Onboarding A2–A6. No bottom nav, per the design — this route sits outside the (app)
 * shell deliberately.
 *
 * A5 is the screen that carries all the conditional complexity: the group step vanishes
 * entirely at Foundation, session options are level-correct (Final never sees Jan or
 * Sept), and exemptions only exist at Inter/Final. Getting that right while it still
 * reads as three easy taps was the design's stated challenge.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");

  const [, setProfile] = useSyncedLocalState<Profile | null>(PROFILE_KEY, null, PROFILE_SYNC);
  const [, setAttempt] = useSyncedLocalState<Attempt | null>(ATTEMPT_KEY, null, ATTEMPT_SYNC);
  const [, setSituation] = useSyncedLocalState<Situation | null>(SITUATION_KEY, null, SITUATION_SYNC);
  const [, setOnboarded] = useLocalState<boolean>(ONBOARDED_KEY, false);

  // Draft state, committed to storage only as each step completes.
  const [draftProfile, setDraftProfile] = useState<Profile>({ displayName: "", username: "" });
  const [level, setLevel] = useState<IcaiLevel>("foundation");
  const [group, setGroup] = useState<GroupScope>("none");
  const [session, setSession] = useState<ExamSession>(() => defaultSessionFor("foundation").session);
  const [year, setYear] = useState<number>(() => defaultSessionFor("foundation").year);
  const [paperDates, setPaperDates] = useState<Record<string, string>>(() =>
    defaultPaperDates("foundation", "none", defaultSessionFor("foundation").session, defaultSessionFor("foundation").year),
  );
  const [exemptions, setExemptions] = useState<Record<string, number>>({});

  function goNext() {
    const i = STEP_ORDER.indexOf(step);
    if (i < STEP_ORDER.length - 1) setStep(STEP_ORDER[i + 1]);
  }

  function skipToApp() {
    setOnboarded(true);
    router.push("/dashboard");
  }

  /** A returning user who already has synced data skips straight to the dashboard —
   *  the rest of the wizard (profile/attempt/situation) is for fresh accounts only. Any
   *  actual data pull-and-merge for this session happens automatically inside the
   *  synced hooks above once they see `user` change; this only decides where to go. */
  async function handleSignedIn(user: User) {
    const hasAttempt = await hasRemoteAttempt(user.id);
    if (hasAttempt) {
      setOnboarded(true);
      router.push("/dashboard");
    } else {
      goNext();
    }
  }

  /** Re-derives everything that depends on level: groups, valid sessions, paper dates. */
  function changeLevel(next: IcaiLevel) {
    setLevel(next);
    const nextGroup: GroupScope = nextGroupForLevel(next);
    setGroup(nextGroup);
    // A session valid for the old level may be invalid for the new one — Final has no
    // Jan or Sept — so it's always re-derived rather than carried over.
    const nextSession = VALID_SESSIONS[next].includes(session)
      ? session
      : defaultSessionFor(next).session;
    setSession(nextSession);
    setPaperDates(defaultPaperDates(next, nextGroup, nextSession, year));
    setExemptions({});
  }

  function changeGroup(next: GroupScope) {
    setGroup(next);
    setPaperDates(defaultPaperDates(level, next, session, year));
  }

  function changeSession(next: ExamSession) {
    setSession(next);
    setPaperDates(defaultPaperDates(level, group, next, year));
  }

  function changeYear(next: number) {
    setYear(next);
    setPaperDates(defaultPaperDates(level, group, session, next));
  }

  function commitAttempt() {
    setAttempt({
      level,
      group,
      session,
      year,
      examDate: earliestDate(paperDates) ?? "",
      paperDates,
      exemptions,
    });
    goNext();
  }

  function finish(situation: Situation) {
    setSituation(situation);
    setOnboarded(true);
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-8">
        {step !== "welcome" && (
          <StepDots current={STEP_ORDER.indexOf(step)} total={STEP_ORDER.length} />
        )}

        {step === "welcome" && <Welcome onStart={goNext} onSkip={skipToApp} />}

        {step === "auth" && <AuthStep onContinue={goNext} onSkip={skipToApp} onSignedIn={handleSignedIn} />}

        {step === "profile" && (
          <ProfileStep
            value={draftProfile}
            onChange={setDraftProfile}
            onContinue={() => {
              setProfile(draftProfile);
              goNext();
            }}
          />
        )}

        {step === "attempt" && (
          <AttemptStep
            level={level}
            group={group}
            session={session}
            year={year}
            paperDates={paperDates}
            exemptions={exemptions}
            onLevel={changeLevel}
            onGroup={changeGroup}
            onSession={changeSession}
            onYear={changeYear}
            onPaperDate={(paperId, date) => setPaperDates((p) => ({ ...p, [paperId]: date }))}
            onExemption={(paperId, marks) =>
              setExemptions((p) => {
                const next = { ...p };
                if (marks === null) delete next[paperId];
                else next[paperId] = marks;
                return next;
              })
            }
            onContinue={commitAttempt}
          />
        )}

        {step === "situation" && <SituationStep onFinish={finish} />}
      </div>
    </main>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6 flex gap-[6px]">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-1 flex-1 rounded-full transition-colors"
          style={{ background: i <= current ? "var(--primary)" : "var(--surface2)" }}
        />
      ))}
    </div>
  );
}

/* ---------------- A2 · Welcome carousel ---------------- */

const SLIDES = [
  {
    title: "Track every hour",
    body: "Concept, practice, revision, mocks — logged by paper and chapter, so you know where the time really went.",
  },
  {
    title: "Plan your attempt",
    body: "One roadmap from today to exam day — every paper, every revision round, mapped out.",
  },
  {
    title: "Know if you'll clear",
    body: "40 per paper, 50% aggregate. See the gap while there's still time to close it.",
  },
];

function Welcome({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const [slide, setSlide] = useState(1);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end">
        <button type="button" onClick={onSkip} className="text-label font-semibold text-dim">
          Skip
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-8 flex justify-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-[18px]"
            style={{ background: "var(--primary)" }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--primary-on)" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 13V9M9.5 2h5" />
            </svg>
          </span>
        </div>

        <h1 className="text-center text-headline text-text">{SLIDES[slide].title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-body-lg text-dim">{SLIDES[slide].body}</p>

        <div className="mt-8 flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === slide ? 20 : 8,
                background: i === slide ? "var(--primary)" : "var(--surface2)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onStart}
          className="w-full rounded-card bg-primary py-4 text-[15px] font-bold text-primary-on"
        >
          Sign up
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full rounded-card border border-border py-4 text-[15px] font-semibold text-text"
        >
          Skip — use offline
        </button>
      </div>
    </div>
  );
}

/* ---------------- A3 · Sign in / Sign up ---------------- */

function AuthStep({
  onContinue,
  onSkip,
  onSignedIn,
}: {
  /** Unimplemented Google/phone-OTP stubs still just advance the wizard, same as before. */
  onContinue: () => void;
  onSkip: () => void;
  onSignedIn: (user: User) => void;
}) {
  const [mode, setMode] = useState<"signUp" | "signIn">("signUp");

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-title text-text">{mode === "signUp" ? "Create an account" : "Sign in"}</h1>
      <p className="mt-1 text-body text-dim">
        Sync your plan across devices — or skip and it all stays on this one.
      </p>

      <div className="mt-6">
        <AuthForm mode={mode} onModeChange={setMode} onSuccess={onSignedIn} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-caption text-dim">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-card border border-border py-3 text-[15px] font-semibold text-text"
        >
          Continue with Google
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-card border border-border py-3 text-[15px] font-semibold text-text"
        >
          📱 Continue with phone OTP
        </button>
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={onSkip}
          className="w-full rounded-card border border-border py-3 text-[15px] font-semibold text-text"
        >
          Skip — use offline
        </button>
        <p className="mt-3 text-center text-caption leading-[1.5] text-dim">
          Full app, no account needed. Timer, planner and stats all work offline — sign in
          later if you want sync.
        </p>
      </div>
    </div>
  );
}

/* ---------------- A4 · Profile setup ---------------- */

function ProfileStep({
  value,
  onChange,
  onContinue,
}: {
  value: Profile;
  onChange: (p: Profile) => void;
  onContinue: () => void;
}) {
  const usernameValid = /^[a-z0-9_]{3,}$/i.test(value.username);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-title text-text">Set up your profile</h1>

      <div className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-[6px]">
          <span className="text-overline uppercase text-dim">Full name</span>
          <input
            value={value.displayName}
            onChange={(e) => onChange({ ...value, displayName: e.target.value })}
            placeholder="Aditya Sharma"
            className="rounded-xl border border-border bg-surface2 px-4 py-3 text-body text-text"
          />
        </label>

        <label className="flex flex-col gap-[6px]">
          <span className="text-overline uppercase text-dim">Username</span>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface2 px-4">
            <span className="text-body text-dim">@</span>
            <input
              value={value.username}
              onChange={(e) => onChange({ ...value, username: e.target.value.replace(/\s/g, "") })}
              placeholder="aditya_ca"
              className="flex-1 bg-transparent py-3 text-body text-text outline-none"
            />
            {usernameValid && (
              <span className="text-caption font-semibold" style={{ color: "var(--green)" }}>
                Available
              </span>
            )}
          </div>
          {/* Real uniqueness checking needs the backend; offline it's format-only. */}
          <span className="text-caption text-dim">
            Letters, numbers and underscores. Checked against other students once you sign in.
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!value.displayName.trim()}
        className="mt-auto w-full rounded-card bg-primary py-4 text-[15px] font-bold text-primary-on disabled:opacity-45"
      >
        Continue
      </button>
    </div>
  );
}

/* ---------------- A5 · Attempt setup ---------------- */

function AttemptStep({
  level,
  group,
  session,
  year,
  paperDates,
  exemptions,
  onLevel,
  onGroup,
  onSession,
  onYear,
  onPaperDate,
  onExemption,
  onContinue,
}: {
  level: IcaiLevel;
  group: GroupScope;
  session: ExamSession;
  year: number;
  paperDates: Record<string, string>;
  exemptions: Record<string, number>;
  onLevel: (l: IcaiLevel) => void;
  onGroup: (g: GroupScope) => void;
  onSession: (s: ExamSession) => void;
  onYear: (y: number) => void;
  onPaperDate: (paperId: string, date: string) => void;
  onExemption: (paperId: string, marks: number | null) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <h1 className="text-title text-text">Set up your attempt</h1>
      <div className="mt-5">
        <AttemptEditor
          level={level}
          group={group}
          session={session}
          year={year}
          paperDates={paperDates}
          exemptions={exemptions}
          onLevel={onLevel}
          onGroup={onGroup}
          onSession={onSession}
          onYear={onYear}
          onPaperDate={onPaperDate}
          onExemption={onExemption}
          footer={
            <button
              type="button"
              onClick={onContinue}
              className="mt-6 w-full rounded-card bg-primary py-4 text-[15px] font-bold text-primary-on"
            >
              Continue
            </button>
          }
        />
      </div>
    </>
  );
}

/* ---------------- A6 · Situation setup ---------------- */

function SituationStep({ onFinish }: { onFinish: (s: Situation) => void }) {
  const [mode, setMode] = useState<SituationMode>("articleship");
  const [officeIn, setOfficeIn] = useState("09:30");
  const [officeOut, setOfficeOut] = useState("19:00");
  const [leaveStart, setLeaveStart] = useState("");

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-title text-text">What&rsquo;s your situation?</h1>
      <p className="mt-1 text-body text-dim">
        Sets your daily hour target — you can change this anytime
      </p>

      <div className="mt-5 flex flex-col gap-2">
        {SITUATION_OPTIONS.map((option) => (
          <button
            key={option.mode}
            type="button"
            onClick={() => setMode(option.mode)}
            className={clsx(
              "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
              mode === option.mode ? "border-primary" : "border-border",
            )}
            style={mode === option.mode ? { background: "color-mix(in srgb, var(--primary) 10%, transparent)" } : undefined}
          >
            <span className="text-[20px]" aria-hidden>{option.emoji}</span>
            <span className="flex-1">
              <span className="block text-label font-semibold text-text">{option.label}</span>
              <span className="block text-caption text-dim">{option.targetLabel}</span>
            </span>
          </button>
        ))}
      </div>

      {mode === "articleship" && (
        <section className="mt-4">
          <div className="mb-2 text-overline uppercase text-dim">Office timings</div>
          <div className="flex gap-2">
            <label className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface2 px-3 py-2">
              <span className="text-caption text-dim">In</span>
              <input
                type="time"
                value={officeIn}
                onChange={(e) => setOfficeIn(e.target.value)}
                className="tnum flex-1 bg-transparent text-label text-text outline-none"
              />
            </label>
            <label className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface2 px-3 py-2">
              <span className="text-caption text-dim">Out</span>
              <input
                type="time"
                value={officeOut}
                onChange={(e) => setOfficeOut(e.target.value)}
                className="tnum flex-1 bg-transparent text-label text-text outline-none"
              />
            </label>
          </div>
        </section>
      )}

      {mode === "studyLeave" && (
        <section className="mt-4">
          <div className="mb-2 text-overline uppercase text-dim">Leave start date</div>
          <input
            type="date"
            value={leaveStart}
            onChange={(e) => setLeaveStart(e.target.value)}
            className="tnum w-full rounded-xl border border-border bg-surface2 px-4 py-3 text-body text-text"
          />
        </section>
      )}

      <button
        type="button"
        onClick={() =>
          onFinish({
            mode,
            officeIn: mode === "articleship" ? officeIn : undefined,
            officeOut: mode === "articleship" ? officeOut : undefined,
            leaveStartDate: mode === "studyLeave" && leaveStart ? leaveStart : undefined,
          })
        }
        className="mt-auto w-full rounded-card bg-primary py-4 text-[15px] font-bold text-primary-on"
      >
        Finish setup
      </button>
    </div>
  );
}
