"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { useSupabaseUser } from "@/lib/supabase/useSupabaseUser";
import { supabase } from "@/lib/supabase/client";

/**
 * The sign-in surface for returning users — onboarding's auth step only runs on
 * first launch, so a user who already created an account needs somewhere else to sign
 * back in from (linked out of Settings' Account section).
 */
export default function AccountPage() {
  const { user, authLoading } = useSupabaseUser();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
        <p className="text-body text-dim">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <Link href="/settings" className="text-caption font-semibold" style={{ color: "var(--primary)" }}>
        ← Settings
      </Link>

      {user ? (
        <div className="mt-4">
          <h1 className="text-title text-text">Account</h1>
          <p className="mt-2 text-body text-dim">Signed in as {user.email}</p>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="mt-6 w-full rounded-card border border-border py-3 text-[15px] font-semibold text-text"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <h1 className="text-title text-text">{mode === "signIn" ? "Sign in" : "Create an account"}</h1>
          <p className="mt-1 text-body text-dim">Sync your plan across devices.</p>
          <div className="mt-6">
            <AuthForm mode={mode} onModeChange={setMode} onSuccess={() => { /* stays on this page; signed-in view above takes over */ }} />
          </div>
        </div>
      )}
    </div>
  );
}
