"use client";

import { useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

/**
 * Shared email/password form — used by onboarding's auth step (first-run sign up) and
 * `/account` (returning-user sign in). Email confirmation is disabled on the Supabase
 * project, so a successful sign-up returns an active session immediately, same as sign-in.
 */
export function AuthForm({
  mode,
  onModeChange,
  onSuccess,
}: {
  mode: "signUp" | "signIn";
  onModeChange: (mode: "signUp" | "signIn") => void;
  onSuccess: (user: User) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { data, error: authError } =
      mode === "signUp"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    // `signUp` returns a user with no session when the project still requires email
    // confirmation — that's not a signed-in state, so it must not be treated as success.
    if (data.session && data.user) {
      onSuccess(data.user);
    } else if (mode === "signUp") {
      setError("Account created — confirm your email, then sign in.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-[6px]">
        <span className="text-overline uppercase text-dim">Email address</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded-xl border border-border bg-surface2 px-4 py-3 text-body text-text"
        />
      </label>

      <label className="flex flex-col gap-[6px]">
        <span className="text-overline uppercase text-dim">Password</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          className="rounded-xl border border-border bg-surface2 px-4 py-3 text-body text-text"
        />
      </label>

      {error && (
        <p className="text-caption" style={{ color: "var(--red)" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-card bg-primary py-3 text-[15px] font-bold text-primary-on disabled:opacity-60"
      >
        {submitting ? "Please wait…" : mode === "signUp" ? "Create account" : "Sign in"}
      </button>

      <button
        type="button"
        onClick={() => {
          setError(null);
          onModeChange(mode === "signUp" ? "signIn" : "signUp");
        }}
        className="text-center text-caption font-semibold"
        style={{ color: "var(--primary)" }}
      >
        {mode === "signUp" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>

      {/* Only offered when signing in — it's noise on a form for someone who has no
          account yet, and the wrong-password error is where people look for it. */}
      {mode === "signIn" && (
        <Link href="/forgot-password" className="text-center text-caption text-dim hover:text-text">
          Forgot your password?
        </Link>
      )}
    </form>
  );
}
