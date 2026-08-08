"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocalState } from "@/lib/hooks/useLocalState";
import { useSyncedLocalState, type SingletonSync } from "@/lib/hooks/useSyncedLocalState";
import { PROFILE_SYNC, SITUATION_HOURS_SYNC } from "@/lib/sync/syncConfigs";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import { useSupabaseUser } from "@/lib/supabase/useSupabaseUser";
import { supabase } from "@/lib/supabase/client";
import type { Attempt } from "@/lib/domain/attempt";
import { LEVELS, hasSyllabusData, papersForAttempt } from "@/lib/icai/levels";
import { SESSION_SHORT_LABEL } from "@/lib/domain/attempt";
import {
  SITUATION_OPTIONS,
  SITUATION_HOURS_STORAGE_KEY,
  type Profile,
  type SituationHourOverrides,
} from "@/lib/domain/profile";
import type { LoggedSession } from "@/lib/domain/loggedSession";
import type { RevisionRound } from "@/lib/domain/types";
import { calculateKpis, currentStreak, longestStreak } from "@/lib/domain/stats";
import { paperReadiness } from "@/lib/domain/readiness";
import { downloadFullBackupJson, downloadSessionsCsv, resetAllData } from "@/lib/domain/dataExport";

const PROFILE_KEY = "sc-profile";
const ATTEMPT_KEY = "sc-attempt";
const LOG_KEY = "sc-logged-sessions";
const ROUNDS_KEY = "sc-foundation-rounds";
const NOTIF_KEY = "sc-notification-prefs";

/**
 * H1 Profile + H3 Settings + H4 Notifications (lite) + H6 Data, combined onto one
 * scrollable page rather than six separate routes — matches how /attempt already
 * stacks D8+D9 into one screen.
 *
 * Two sections from the original H1–H6 spec are deliberately absent: H2 Achievements
 * (a real badge/milestone system is its own feature, not a settings toggle — nothing
 * here fakes one) and H5 Privacy (friend-visibility/discoverability toggles are
 * entirely about the Phase 3 social features, which don't exist yet — building those
 * switches now would be controls that visibly do nothing).
 */
export default function SettingsPage() {
  const [profile, setProfile, profileHydrated] = useSyncedLocalState<Profile | null>(
    PROFILE_KEY,
    null,
    PROFILE_SYNC,
  );
  const [attempt] = useLocalState<Attempt | null>(ATTEMPT_KEY, null);
  const [sessions] = useLocalState<LoggedSession[]>(LOG_KEY, []);
  const [rounds] = useLocalState<Record<string, RevisionRound>>(ROUNDS_KEY, {});

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-title text-text">Settings</h1>

      <ProfileSection
        profile={profile}
        profileHydrated={profileHydrated}
        onSave={setProfile}
        attempt={attempt}
        sessions={sessions}
        rounds={rounds}
      />
      <AccountSection />
      <StudyTargetsSection />
      <AppearanceSection />
      <NotificationsSection />
      <DataSection sessions={sessions} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 rounded-card-lg border border-border bg-surface p-5">
      <div className="mb-4 text-subtitle text-text">{title}</div>
      {children}
    </section>
  );
}

/* ---------------- H1 · Profile ---------------- */

function ProfileSection({
  profile,
  profileHydrated,
  onSave,
  attempt,
  sessions,
  rounds,
}: {
  profile: Profile | null;
  profileHydrated: boolean;
  onSave: (p: Profile) => void;
  attempt: Attempt | null;
  sessions: LoggedSession[];
  rounds: Record<string, RevisionRound>;
}) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [saved, setSaved] = useState(false);
  // `profile` reads null until localStorage hydrates, so the useState initializers
  // above always lock in "" rather than the real saved values — same hydration-timing
  // bug as the week wizard's default hours, fixed the same way: sync the draft fields
  // exactly once, right after hydration actually completes.
  const [draftSynced, setDraftSynced] = useState(false);
  useEffect(() => {
    if (profileHydrated && !draftSynced && profile) {
      setDisplayName(profile.displayName);
      setUsername(profile.username);
      setDraftSynced(true);
    }
  }, [profileHydrated, draftSynced, profile]);

  function save() {
    onSave({ displayName, username });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const kpis = calculateKpis(sessions, 0);
  const streak = currentStreak(sessions);
  const best = longestStreak(sessions);

  let syllabusPercent: number | null = null;
  if (attempt && hasSyllabusData(attempt.level)) {
    const readiness = paperReadiness(papersForAttempt(attempt.level, attempt.group), rounds);
    syllabusPercent = readiness.length > 0 ? Math.round(readiness.reduce((s, r) => s + r.percent, 0) / readiness.length) : 0;
  }

  return (
    <Section title="Profile">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-overline uppercase text-dim">Full name</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-xl border border-border bg-surface2 px-4 py-3 text-body text-text"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-overline uppercase text-dim">Username</span>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface2 px-4">
            <span className="text-body text-dim">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              className="flex-1 bg-transparent py-3 text-body text-text outline-none"
            />
          </div>
        </label>
        <button
          type="button"
          onClick={save}
          className="self-start rounded-lg bg-primary px-4 py-2 text-label font-bold text-primary-on"
        >
          {saved ? "Saved ✓" : "Save profile"}
        </button>
      </div>

      {attempt && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface2 px-4 py-3">
          <span className="text-label font-semibold text-text">
            CA {LEVELS[attempt.level].label} · {SESSION_SHORT_LABEL[attempt.session]} {attempt.year}
          </span>
          <Link href="/attempt" className="text-caption font-semibold" style={{ color: "var(--primary)" }}>
            Edit →
          </Link>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Total hours" value={kpis.totalHours.toFixed(0)} />
        <Stat label="Sessions" value={kpis.sessionCount.toString()} />
        <Stat label="Current streak" value={streak.toString()} accent="var(--streak)" />
        <Stat label="Best streak" value={best.toString()} />
        <Stat label="Avg / day" value={`${kpis.avgHoursPerDay.toFixed(1)}h`} />
        <Stat label="Syllabus" value={syllabusPercent === null ? "—" : `${syllabusPercent}%`} />
      </div>
    </Section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface2 p-3">
      <div className="tnum text-[20px] font-extrabold" style={{ color: accent ?? "var(--text)" }}>
        {value}
      </div>
      <div className="text-[11px] text-dim">{label}</div>
    </div>
  );
}

/* ---------------- Account ---------------- */

function AccountSection() {
  const { user, authLoading } = useSupabaseUser();
  if (authLoading) return null;

  return (
    <Section title="Account">
      {user ? (
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface2 px-4 py-3">
          <span className="min-w-0 flex-1 truncate text-caption font-semibold text-text">
            Signed in as {user.email}
          </span>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="flex-none text-caption font-semibold text-dim hover:text-text"
          >
            Sign out
          </button>
        </div>
      ) : (
        <Link
          href="/account"
          className="flex items-center justify-between rounded-xl border border-border bg-surface2 px-4 py-3 text-caption font-semibold"
          style={{ color: "var(--primary)" }}
        >
          Sign in or create an account
          <span aria-hidden>→</span>
        </Link>
      )}
    </Section>
  );
}

/* ---------------- H3 · Study targets ---------------- */

function StudyTargetsSection() {
  const [overrides, setOverrides] = useSyncedLocalState<SituationHourOverrides>(
    SITUATION_HOURS_STORAGE_KEY,
    {},
    SITUATION_HOURS_SYNC,
  );

  return (
    <Section title="Daily hour targets">
      <p className="mb-3 text-caption text-dim">
        Overrides the default target for each situation — set once, applies whenever
        you&rsquo;re in that mode.
      </p>
      <div className="flex flex-col gap-2">
        {SITUATION_OPTIONS.map((option) => {
          const value = overrides[option.mode] ?? option.defaultHours;
          return (
            <div key={option.mode} className="flex items-center gap-3 rounded-xl border border-border bg-surface2 px-4 py-[10px]">
              <span aria-hidden>{option.emoji}</span>
              <span className="flex-1 text-label font-semibold text-text">{option.label}</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={value}
                onChange={(e) =>
                  setOverrides((prev) => ({ ...prev, [option.mode]: Math.max(0, Number(e.target.value) || 0) }))
                }
                className="tnum w-20 rounded-lg border border-border bg-surface px-2 py-1 text-label text-text"
                aria-label={`Target hours for ${option.label}`}
              />
              <span className="text-caption text-dim">h</span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ---------------- H3 · Appearance ---------------- */

function AppearanceSection() {
  return (
    <Section title="Appearance">
      <ThemeSwitcher />
    </Section>
  );
}

/* ---------------- H4 · Notifications (lite) ---------------- */

interface NotificationPrefs {
  eveningReview: boolean;
  streakRisk: boolean;
  syllabusAmendments: boolean;
}
const DEFAULT_NOTIF: NotificationPrefs = { eveningReview: true, streakRisk: true, syllabusAmendments: true };

// Sole read/write site for this key — defined inline rather than in the shared
// syncConfigs.ts module, since no other page touches notification prefs.
const NOTIF_SYNC: SingletonSync<NotificationPrefs> = {
  table: "notification_prefs",
  isEmpty: () => false,
  toRow: (v, userId) => ({
    user_id: userId,
    evening_review: v.eveningReview,
    streak_risk: v.streakRisk,
    syllabus_amendments: v.syllabusAmendments,
  }),
  fromRow: (row) => ({
    eveningReview: row.evening_review as boolean,
    streakRisk: row.streak_risk as boolean,
    syllabusAmendments: row.syllabus_amendments as boolean,
  }),
};

function NotificationsSection() {
  const [prefs, setPrefs] = useSyncedLocalState<NotificationPrefs>(NOTIF_KEY, DEFAULT_NOTIF, NOTIF_SYNC);

  return (
    <Section title="Notifications">
      <p
        className="mb-3 rounded-lg p-3 text-caption text-text"
        style={{ background: "color-mix(in srgb, var(--amber) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--amber) 30%, transparent)" }}
      >
        These preferences are saved now but nothing fires yet — push notifications need
        a backend that isn&rsquo;t built. Turning these on costs nothing and means
        they&rsquo;re already set correctly once notifications ship.
      </p>
      <div className="flex flex-col gap-2">
        <ToggleRow
          label="Evening review reminder"
          checked={prefs.eveningReview}
          onChange={(v) => setPrefs((p) => ({ ...p, eveningReview: v }))}
        />
        <ToggleRow
          label="Streak-at-risk alert"
          checked={prefs.streakRisk}
          onChange={(v) => setPrefs((p) => ({ ...p, streakRisk: v }))}
        />
        <ToggleRow
          label="Syllabus amendment alerts"
          checked={prefs.syllabusAmendments}
          onChange={(v) => setPrefs((p) => ({ ...p, syllabusAmendments: v }))}
        />
      </div>
    </Section>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-xl border border-border bg-surface2 px-4 py-3"
    >
      <span className="text-label font-semibold text-text">{label}</span>
      <span
        className="relative h-6 w-11 flex-none rounded-full transition-colors"
        style={{ background: checked ? "var(--primary)" : "var(--border)" }}
      >
        <span
          className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all"
          style={{ left: checked ? "22px" : "3px" }}
        />
      </span>
    </button>
  );
}

/* ---------------- H6 · Data ---------------- */

function DataSection({ sessions }: { sessions: LoggedSession[] }) {
  const [confirming, setConfirming] = useState(false);

  function handleReset() {
    resetAllData();
    window.location.href = "/";
  }

  return (
    <Section title="Data">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => downloadSessionsCsv(sessions)}
          className="flex items-center justify-between rounded-xl border border-border bg-surface2 px-4 py-3 text-left"
        >
          <span className="text-label font-semibold text-text">Export session log (CSV)</span>
          <span className="text-caption text-dim">↓</span>
        </button>
        <button
          type="button"
          onClick={downloadFullBackupJson}
          className="flex items-center justify-between rounded-xl border border-border bg-surface2 px-4 py-3 text-left"
        >
          <span className="text-label font-semibold text-text">Full backup (JSON)</span>
          <span className="text-caption text-dim">↓</span>
        </button>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-2 flex items-center justify-between rounded-xl border px-4 py-3 text-left"
            style={{ borderColor: "var(--red)" }}
          >
            <span className="text-label font-semibold" style={{ color: "var(--red)" }}>
              Reset all data
            </span>
          </button>
        ) : (
          <div className="mt-2 rounded-xl border p-4" style={{ borderColor: "var(--red)" }}>
            <p className="text-caption text-text">
              This permanently deletes your attempt, sessions, syllabus progress and
              plans from this browser. Consider exporting a backup first.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 rounded-lg py-2 text-label font-bold text-primary-on"
                style={{ background: "var(--red)" }}
              >
                Delete everything
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-lg border border-border py-2 text-label font-semibold text-text"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
