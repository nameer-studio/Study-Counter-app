"use client";

import Link from "next/link";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useSyncedLocalState } from "@/lib/hooks/useSyncedLocalState";
import { useSyncedArrayState } from "@/lib/hooks/useSyncedArrayState";
import { useSyncedRecordState } from "@/lib/hooks/useSyncedRecordState";
import {
  PROFILE_SYNC,
  ATTEMPT_SYNC,
  SITUATION_SYNC,
  SITUATION_HOURS_SYNC,
  LOGGED_SESSION_SYNC,
  REVISION_ROUNDS_SYNC,
  PLANNED_BLOCK_SYNC,
} from "@/lib/sync/syncConfigs";
import { buildLiveDashboardData } from "@/lib/domain/dashboardLive";
import type { Attempt } from "@/lib/domain/attempt";
import { SITUATION_HOURS_STORAGE_KEY, type Profile, type Situation, type SituationHourOverrides } from "@/lib/domain/profile";
import type { LoggedSession } from "@/lib/domain/loggedSession";
import type { RevisionRound } from "@/lib/domain/types";
import { PLANNED_BLOCKS_STORAGE_KEY, type PlannedBlock } from "@/lib/domain/plannedBlock";

/**
 * B1 Dashboard, at its real route — computed live from the student's actual attempt,
 * sessions, revision rounds and planned blocks (see dashboardLive.ts), not a canned
 * fixture. `DASHBOARD_FIXTURES` still exists purely for the `/design-check` gallery,
 * which needs all three pace states side by side for design QA; a real student is
 * always in exactly one of them.
 */
export default function DashboardPage() {
  const [attempt, , attemptHydrated] = useSyncedLocalState<Attempt | null>("sc-attempt", null, ATTEMPT_SYNC);
  const [situation] = useSyncedLocalState<Situation | null>("sc-situation", null, SITUATION_SYNC);
  const [profile] = useSyncedLocalState<Profile | null>("sc-profile", null, PROFILE_SYNC);
  const [sessions] = useSyncedArrayState<LoggedSession>("sc-logged-sessions", [], LOGGED_SESSION_SYNC);
  const [rounds] = useSyncedRecordState<RevisionRound>("sc-foundation-rounds", {}, REVISION_ROUNDS_SYNC);
  const [blocks] = useSyncedArrayState<PlannedBlock>(PLANNED_BLOCKS_STORAGE_KEY, [], PLANNED_BLOCK_SYNC);
  const [hourOverrides] = useSyncedLocalState<SituationHourOverrides>(
    SITUATION_HOURS_STORAGE_KEY,
    {},
    SITUATION_HOURS_SYNC,
  );

  // Wait for hydration before deciding whether onboarding is missing — reading `attempt`
  // before localStorage has been read would always see `null` and flash the "finish
  // setup" state at a returning student for one frame.
  if (!attemptHydrated) return null;

  if (!attempt) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
        <div className="text-title text-text">Finish setting up your attempt</div>
        <p className="text-body text-dim">
          The dashboard needs your attempt details — level, session, exam dates — before
          it can show a real countdown.
        </p>
        <Link
          href="/onboarding"
          className="mt-2 rounded-card bg-primary px-6 py-3 text-[15px] font-bold text-primary-on"
        >
          Continue setup
        </Link>
      </div>
    );
  }

  const data = buildLiveDashboardData({ attempt, situation, profile, sessions, rounds, blocks, hourOverrides });
  return <Dashboard data={data} />;
}
