import { createClient } from "@supabase/supabase-js";

/**
 * Single browser client for the whole app. Persists its own session in localStorage
 * under its own key (separate from every `sc-*` key) — no server-rendered auth-gated
 * route exists here, so `@supabase/ssr` and its cookie plumbing aren't needed.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
