"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalState } from "@/lib/hooks/useLocalState";

/**
 * A1 Splash — quiet and fast. Its only job is to decide where the student lands:
 * straight to the dashboard if they've been set up before, otherwise into onboarding.
 *
 * The redirect waits for `hydrated`, not just mount: reading the onboarding flag before
 * localStorage has been read would always see `false` and bounce a returning student
 * back through setup they've already done.
 */
export default function SplashPage() {
  const router = useRouter();
  const [onboarded, , hydrated] = useLocalState<boolean>("sc-onboarded", false);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(onboarded ? "/dashboard" : "/onboarding");
  }, [hydrated, onboarded, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-[18px]"
        style={{ background: "var(--primary)" }}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--primary-on)" strokeWidth="2.4" strokeLinecap="round">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 13V9M9.5 2h5" />
        </svg>
      </span>
      <span className="mt-4 text-subtitle text-text">Study Counter</span>
    </main>
  );
}
