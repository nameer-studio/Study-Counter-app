"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

/**
 * Step 2 of password recovery — the page Supabase's email link lands on.
 *
 * The recovery token arrives in the URL and `detectSessionInUrl` trades it for a
 * short-lived session, which is what authorises `updateUser`. That exchange is
 * asynchronous and can settle just after `getSession()` first resolves, so this waits
 * for either signal (plus a grace period) rather than declaring the link dead the moment
 * it finds no session — otherwise a perfectly good link flashes "invalid" on arrival.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "ready" | "invalid">("verifying");
  const [linkError, setLinkError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // An expired or already-used link comes back as parameters, not an exception, and is
    // checked before any session: someone arriving on a dead link must not be handed a
    // password form just because they happen to already be signed in.
    const inHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const inQuery = new URLSearchParams(window.location.search);
    const described = inHash.get("error_description") ?? inQuery.get("error_description");
    if (described) {
      setLinkError(described);
      setStatus("invalid");
      return;
    }

    let settled = false;
    const markReady = () => {
      settled = true;
      setStatus("ready");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) markReady();
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });

    const timer = setTimeout(() => {
      if (!settled) setStatus("invalid");
    }, 4000);

    return () => {
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Those two passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <h1 className="text-title text-text">Set a new password</h1>

      {status === "verifying" && <p className="mt-3 text-body text-dim">Checking your link…</p>}

      {status === "invalid" && (
        <div className="mt-4">
          <div
            className="rounded-card p-4"
            style={{
              background: "color-mix(in srgb, var(--red) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--red) 30%, transparent)",
            }}
          >
            <p className="text-body text-text">
              This reset link isn&rsquo;t valid any more — they expire, and each one only
              works once.
            </p>
            {linkError && <p className="mt-2 text-caption text-dim">{linkError}</p>}
          </div>
          <Link
            href="/forgot-password"
            className="mt-4 block w-full rounded-card bg-primary py-3 text-center text-[15px] font-bold text-primary-on"
          >
            Request a new link
          </Link>
        </div>
      )}

      {status === "ready" && !done && (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-[6px]">
            <span className="text-overline uppercase text-dim">New password</span>
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

          <label className="flex flex-col gap-[6px]">
            <span className="text-overline uppercase text-dim">Confirm new password</span>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type it again"
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
            {submitting ? "Saving…" : "Save new password"}
          </button>
        </form>
      )}

      {done && (
        <div
          className="mt-6 rounded-card p-4"
          style={{
            background: "color-mix(in srgb, var(--green) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)",
          }}
        >
          <p className="text-body text-text">Password updated — you&rsquo;re signed in. Taking you to your dashboard…</p>
        </div>
      )}
    </div>
  );
}
