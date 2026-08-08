"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useSyncedLocalState, type SingletonSync } from "@/lib/hooks/useSyncedLocalState";
import { ATTEMPT_SYNC } from "@/lib/sync/syncConfigs";
import { AttemptEditor, nextGroupForLevel } from "@/components/attempt/AttemptEditor";
import { LEVELS, papersForAttempt, type GroupScope } from "@/lib/icai/levels";
import {
  defaultPaperDates,
  defaultSessionFor,
  earliestDate,
  daysUntilExam,
  SESSION_SHORT_LABEL,
  type Attempt,
} from "@/lib/domain/attempt";
import { VALID_SESSIONS, type ExamSession, type IcaiLevel } from "@/lib/domain/types";

const ATTEMPT_KEY = "sc-attempt";
const SPOM_KEY = "sc-spom-progress";
const TRAININGS_KEY = "sc-trainings";

/**
 * D8 My attempt + D9 Modules & trainings. D8's "switch attempt/level" action IS this
 * screen — re-editing level/group/session here re-derives everything the same way
 * onboarding's A5 does (shared via AttemptEditor), so there's no separate "switch"
 * button that duplicates that logic.
 *
 * D9 is level-aware: entirely absent for Foundation (which has no SPOM/articleship
 * concept), a plain ICITSS checkbox for Intermediate, and a SET A–D + AICITSS checklist
 * for Final.
 */
export default function AttemptPage() {
  const [savedAttempt, setSavedAttempt, hydrated] = useSyncedLocalState<Attempt | null>(
    ATTEMPT_KEY,
    null,
    ATTEMPT_SYNC,
  );

  if (!hydrated) return null;

  if (!savedAttempt) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
        <div className="text-title text-text">No attempt set up yet</div>
        <p className="text-body text-dim">Complete onboarding to register your attempt first.</p>
        <Link href="/onboarding" className="mt-2 rounded-card bg-primary px-6 py-3 text-[15px] font-bold text-primary-on">
          Set up now
        </Link>
      </div>
    );
  }

  return (
    <AttemptPageInner saved={savedAttempt} onSave={setSavedAttempt} />
  );
}

function AttemptPageInner({
  saved,
  onSave,
}: {
  saved: Attempt;
  onSave: (a: Attempt) => void;
}) {
  const [level, setLevel] = useState<IcaiLevel>(saved.level);
  const [group, setGroup] = useState<GroupScope>(saved.group);
  const [session, setSession] = useState<ExamSession>(saved.session);
  const [year, setYear] = useState(saved.year);
  const [paperDates, setPaperDates] = useState(saved.paperDates);
  const [exemptions, setExemptions] = useState(saved.exemptions);
  const [savedFlash, setSavedFlash] = useState(false);

  const dirty =
    level !== saved.level ||
    group !== saved.group ||
    session !== saved.session ||
    year !== saved.year ||
    JSON.stringify(paperDates) !== JSON.stringify(saved.paperDates) ||
    JSON.stringify(exemptions) !== JSON.stringify(saved.exemptions);

  function changeLevel(next: IcaiLevel) {
    setLevel(next);
    const nextGroup = nextGroupForLevel(next);
    setGroup(nextGroup);
    const nextSession = VALID_SESSIONS[next].includes(session) ? session : defaultSessionFor(next).session;
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

  function save() {
    const next: Attempt = {
      level,
      group,
      session,
      year,
      examDate: earliestDate(paperDates) ?? saved.examDate,
      paperDates,
      exemptions,
    };
    onSave(next);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="text-title text-text">My attempt</h1>
      <p className="mt-1 text-body text-dim">
        CA {LEVELS[saved.level].label} · {SESSION_SHORT_LABEL[saved.session]} {saved.year}
      </p>

      <PaperCountdowns attempt={saved} />

      <div className="mt-6 rounded-card-lg border border-border bg-surface p-5">
        <div className="mb-1 text-subtitle text-text">Edit attempt</div>
        <p className="mb-4 text-caption text-dim">
          Changing level or group re-derives sessions and paper dates the same way
          onboarding does — nothing saves until you hit Save below.
        </p>
        <AttemptEditor
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
          footer={
            <button
              type="button"
              onClick={save}
              disabled={!dirty && !savedFlash}
              className="mt-6 w-full rounded-card bg-primary py-4 text-[15px] font-bold text-primary-on disabled:opacity-50"
            >
              {savedFlash ? "Saved ✓" : "Save changes"}
            </button>
          }
        />
      </div>

      <ModulesAndTrainings level={saved.level} />
    </div>
  );
}

/** Live, colour-coded day-count per paper — read-only, reflects the SAVED attempt (not
 *  the in-progress edit draft above), since these are "here's where you actually stand
 *  today", not a preview of unsaved changes. */
function PaperCountdowns({ attempt }: { attempt: Attempt }) {
  const papers = papersForAttempt(attempt.level, attempt.group);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return (
    <div className="mt-4 flex flex-col gap-2">
      {papers.map((paper) => {
        const iso = attempt.paperDates[paper.id];
        const days = iso ? Math.round((new Date(`${iso}T00:00:00`).getTime() - now.getTime()) / 86_400_000) : null;
        const color =
          days === null ? "var(--dim)" : days < 0 ? "var(--dim)" : days <= 7 ? "var(--red)" : days <= 21 ? "var(--amber)" : "var(--green)";
        return (
          <div key={paper.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-[10px]">
            <span className="min-w-0 flex-1 truncate text-label font-semibold text-text">
              P{paper.paperNo} · {paper.name}
            </span>
            <span className="tnum text-label font-bold" style={{ color }}>
              {days === null ? "—" : days < 0 ? "done" : `${days}d`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- D9 · Modules & trainings ---------------- */

const SPOM_SETS = ["A", "B", "C", "D"] as const;
type SpomSet = (typeof SPOM_SETS)[number];
type SpomStatus = "locked" | "inProgress" | "completed";
type SpomProgress = Record<SpomSet, SpomStatus>;

type TrainingStatus = "pending" | "completed";
type Trainings = { icitss: TrainingStatus; aicitss: TrainingStatus };

const DEFAULT_SPOM: SpomProgress = { A: "locked", B: "locked", C: "locked", D: "locked" };
const DEFAULT_TRAININGS: Trainings = { icitss: "pending", aicitss: "pending" };

// Sole read/write site for both keys — defined inline rather than in the shared
// syncConfigs.ts module.
const SPOM_SYNC: SingletonSync<SpomProgress> = {
  table: "spom_progress",
  isEmpty: () => false,
  toRow: (v, userId) => ({ user_id: userId, progress: v }),
  fromRow: (row) => (row.progress as SpomProgress) ?? DEFAULT_SPOM,
};

const TRAININGS_SYNC: SingletonSync<Trainings> = {
  table: "trainings",
  isEmpty: () => false,
  toRow: (v, userId) => ({ user_id: userId, icitss: v.icitss, aicitss: v.aicitss }),
  fromRow: (row) => ({
    icitss: row.icitss as TrainingStatus,
    aicitss: row.aicitss as TrainingStatus,
  }),
};

function ModulesAndTrainings({ level }: { level: IcaiLevel }) {
  const [spom, setSpom] = useSyncedLocalState<SpomProgress>(SPOM_KEY, DEFAULT_SPOM, SPOM_SYNC);
  const [trainings, setTrainings] = useSyncedLocalState<Trainings>(TRAININGS_KEY, DEFAULT_TRAININGS, TRAININGS_SYNC);

  // Explicitly absent for Foundation — no SPOM or articleship concept exists at that
  // level, so this isn't rendered empty, it isn't rendered at all.
  if (level === "foundation") return null;

  function cycleSpom(set: SpomSet) {
    const order: SpomStatus[] = ["locked", "inProgress", "completed"];
    setSpom((prev) => ({ ...prev, [set]: order[(order.indexOf(prev[set]) + 1) % order.length] }));
  }

  function toggleTraining(key: keyof Trainings) {
    setTrainings((prev) => ({ ...prev, [key]: prev[key] === "completed" ? "pending" : "completed" }));
  }

  return (
    <div className="mt-6 rounded-card-lg border border-border bg-surface p-5">
      <div className="mb-1 text-subtitle text-text">Modules &amp; trainings</div>
      <p className="mb-4 text-caption text-dim">
        Self-paced modules must clear before Final; ICITSS/AICITSS are training
        milestones, not study hours — tracked here so they don&rsquo;t get lost among
        papers.
      </p>

      <div className="mb-2 text-overline uppercase text-dim">Self-Paced Online Modules</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SPOM_SETS.map((set) => {
          const status = spom[set];
          const color = status === "completed" ? "var(--green)" : status === "inProgress" ? "var(--amber)" : "var(--dim)";
          return (
            <button
              key={set}
              type="button"
              onClick={() => cycleSpom(set)}
              className="flex flex-col items-center gap-1 rounded-xl border px-3 py-3"
              style={{ borderColor: status === "locked" ? "var(--border)" : color }}
            >
              <span className="text-label font-bold text-text">SET {set}</span>
              <span className="text-[10px] font-semibold capitalize" style={{ color }}>
                {status === "inProgress" ? "In progress" : status}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-2 mt-5 text-overline uppercase text-dim">Trainings</div>
      <div className="flex flex-col gap-2">
        <TrainingRow
          label={level === "final" ? "ICITSS (completed pre-articleship)" : "ICITSS"}
          status={trainings.icitss}
          onToggle={() => toggleTraining("icitss")}
        />
        {level === "final" && (
          <TrainingRow label="AICITSS" status={trainings.aicitss} onToggle={() => toggleTraining("aicitss")} />
        )}
      </div>
    </div>
  );
}

function TrainingRow({
  label,
  status,
  onToggle,
}: {
  label: string;
  status: TrainingStatus;
  onToggle: () => void;
}) {
  const done = status === "completed";
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
        done ? "border-green" : "border-border",
      )}
      style={done ? { borderColor: "var(--green)" } : undefined}
    >
      <span className="text-label font-semibold text-text">{label}</span>
      <span className="text-caption font-semibold" style={{ color: done ? "var(--green)" : "var(--dim)" }}>
        {done ? "Completed ✓" : "Mark complete"}
      </span>
    </button>
  );
}
