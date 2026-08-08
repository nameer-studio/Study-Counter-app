import { createClient } from "@supabase/supabase-js";

/**
 * Single browser client for the whole app. Persists its own session in localStorage
 * under its own key (separate from every `sc-*` key) — no server-rendered auth-gated
 * route exists here, so `@supabase/ssr` and its cookie plumbing aren't needed.
 *
 * Falls back to a syntactically-valid placeholder URL/key when the real env vars
 * aren't set, rather than throwing. `createClient` runs at module load time, and even
 * "use client" pages get server-rendered once during `next build` for the static HTML
 * — a missing env var there would otherwise take down the entire production build
 * instead of just leaving auth non-functional until the real values are configured.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Required by the password-reset flow: Supabase's recovery email lands the student
    // back on /reset-password with the recovery token in the URL, and only this lets the
    // client read it and establish the short-lived session that authorises setting a new
    // password. It's a no-op on every other route, since nothing else puts auth
    // parameters in the URL.
    detectSessionInUrl: true,
  },
});
