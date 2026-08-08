"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

/**
 * Step 1 of password recovery — request the email. Deliberately reports success even
 * when the address isn't registered: confirming "no account with that email" would turn
 * this form into a way for anyone to test which addresses have accounts.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmitting(false);
    // Rate limits and transport failures are worth surfacing; a non-existent address is
    // not an error here by design (see above).
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <Link href="/account" className="text-caption font-semibold" style={{ color: "var(--primary)" }}>
        ← Back to sign in
      </Link>

      <h1 className="mt-4 text-title text-text">Reset your password</h1>

      {sent ? (
        <div
          className="mt-6 rounded-card p-4"
          style={{
            background: "color-mix(in srgb, var(--green) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)",
          }}
        >
          <p className="text-body text-text">
            If an account exists for <b>{email}</b>, a reset link is on its way. Open it
            on this device and you&rsquo;ll be able to set a new password.
          </p>
          <p className="mt-2 text-caption text-dim">
            The link expires after a short while — request another if it does.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-body text-dim">
            We&rsquo;ll email you a link to set a new one. Your study data stays on this
            device either way.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
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
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
