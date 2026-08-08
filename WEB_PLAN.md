# Study Counter — Website Plan

Companion to [PLAN.md](PLAN.md) (features & domain) and the design handoff at
`E:\Content creation\Study tracker app\design_handoff_study_counter`.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS
**Backend:** the **same Supabase project** as the Android app
**Location:** `web/` inside this repo, so both clients share `PLAN.md` and the design system
**Offline:** IndexedDB mirroring Room's role on Android

---

## 1. Why Build the Web Version (and Why It's Now the Fast Path)

Three reasons this is not just "the Android app again":

**1. It unblocks the feedback loop today.** The Android emulator needs ~2GB RAM on a 6GB
machine — it crashed on first launch. A website runs in a browser that's already open.
You can see and click the real product in minutes rather than fighting virtualisation.

**2. The designs are already HTML.** The `.dc.html` handoff files are web prototypes with
CSS-variable theming. Porting them to React is a far shorter jump than rebuilding them in
Compose — the tokens, layout, and copy transfer almost directly.

**3. It's where CA students actually study.** Long study-leave sessions happen at a desk,
often with lectures playing on the same laptop. Study-Track (the competitor) is web-first
for exactly this reason. Mobile is for logging on the move; desktop is for planning,
charts, and the syllabus tree — the screens that need room to breathe.

The two clients are peers sharing one backend, not a port and its shadow.

---

## 2. What Genuinely Differs From Mobile

Not everything maps 1:1. Five real divergences:

### 2.1 The timer must be wall-clock, not interval-accumulated
Android gets a foreground `Service`. The web has **no equivalent** — a background tab is
throttled, and a closed tab is gone.

**The rule:** persist `startedAt` (and any pause spans) and compute
`elapsed = now − startedAt − pausedTotal` on every render. The interval only triggers
re-renders; it must **never** accumulate the total. Get this wrong and a student loses a
three-hour session when their laptop sleeps — the single worst bug this app could ship.
Consequence: closing the tab mid-session is harmless, and reopening resumes exactly.

### 2.2 Desktop layouts combine screens, they don't stack them
The 44 mobile screens are not 44 web pages. Desktop has room to merge:
- Bottom nav → **persistent left sidebar**
- D7 syllabus: paper list and chapter list become **two panes side by side**, not
  drill-down navigation
- E1–E5 stats: a **single scrollable analytics page** with section anchors, not 5 tabs
- B1 dashboard: **two-column** — countdown/ring/CTA left, plan + charts right

Net: ~44 mobile screens → **~22 web routes**, each responsive down to mobile width.

### 2.3 A marketing site exists, and the app has no equivalent
The Android app opens straight into onboarding. A website needs a public front door:
landing page, feature pages, pricing, FAQ, privacy policy. This is also the **only** SEO
surface either product has — "CA study planner", "CA Final revision tracker" are real
searches, and the app store can't rank for them.

### 2.4 Installable PWA instead of an APK
Manifest + service worker makes the site installable to a home screen and usable offline.
For students on patchy data this covers a lot of what a native app would, without a Play
Store review. **It does not replace the Android app** — no true background timer, no
home-screen widget, weaker notification reliability — but it's a genuine second surface.

### 2.5 Charts are SVG/Canvas in React, not Vico
The design's charts are already hand-drawn SVG. Porting them directly preserves exact
fidelity and avoids a charting library's opinions. Only the heavier interactive charts
(E4 burn-down, E3 heatmap) may warrant a library.

---

## 3. Route Map (~22 routes)

### Public / marketing — `app/(marketing)/`
| Route | Contents |
|---|---|
| `/` | Landing: countdown hero, the ICAI-syllabus-preloaded hook, social proof, CTA |
| `/features` | Feature deep-dive with real screenshots |
| `/pricing` | Free vs Attempt Pass (see PLAN.md §10) |
| `/faq` | ICAI-specific questions — attempts, exemptions, groups |
| `/privacy`, `/terms` | Required before any launch |

### Auth — `app/(auth)/`
| Route | Screen |
|---|---|
| `/signin`, `/signup` | A3 — email, Google, OTP. **"Continue without an account"** stays prominent |
| `/onboarding` | A4–A6 as a stepped wizard: profile → attempt (level/group/session, level-aware) → situation |

### App — `app/(app)/` — persistent sidebar shell
| Route | Mobile screens folded in |
|---|---|
| `/dashboard` | **B1** — two-column on desktop |
| `/timer` | C1 + C2 — setup and active session in one view |
| `/timer/mock` | C3 — mock mode, incl. open-book and MCQ-negative-marking variants |
| `/log` | C4 + C5 — session log and manual/backdated entry |
| `/planner` | D1–D3 — week/day/month as view toggles on one route |
| `/planner/roadmap` | D4 — full attempt roadmap |
| `/planner/week-wizard` | D5 |
| `/syllabus` | **D7** — two-pane papers + chapters |
| `/attempt` | D8 + D9 — attempt config, exemptions, SPOM/trainings (level-aware) |
| `/stats` | E1–E4 — one long analytics page, anchored sections |
| `/stats/mocks` | E5 — mock log, marks trend, exemption tracker |
| `/friends` | F1 + F3 |
| `/leaderboard` | F2 — self-trajectory card always first |
| `/groups`, `/groups/[id]` | F4 + F5 |
| `/rooms/[id]` | F6 — study room |
| `/doubts`, `/doubts/[id]` | F7 + F8 |
| `/chat`, `/chat/[id]` | G1–G3 |
| `/profile` | H1 + H2 |
| `/settings` | H3–H6 as tabbed sections |

---

## 4. Architecture

```
web/
  src/
    app/
      (marketing)/          public pages, statically rendered
      (auth)/               sign-in, onboarding wizard
      (app)/                authed shell + sidebar
      globals.css           ← design tokens, 3 themes
    components/
      ui/                   PaceBadge, ProgressRing, RevisionRoundIndicator, Chips…
      charts/               the 19 charts, ported from the design SVG
      layout/               Sidebar, MobileNav, AppShell
    lib/
      domain/               pace, countdown, streak, passProjector, revisionRound
      data/                 IndexedDB (offline) + Supabase client
      icai/                 seed data — levels, papers, chapters
```

**The `lib/domain/` layer is deliberately pure TypeScript** — no React, no DOM. It mirrors
the Kotlin domain engines one-for-one (`PaceCalculator`, `CountdownEngine`,
`PassProjector`). Two consequences: it's unit-testable without a browser, and the two
codebases can be checked against each other for identical results. A student must never
see "34 days behind" on their phone and "31 days behind" on the laptop.

**Theming** matches the Android port: CSS variables on `:root[data-theme="dark|light|amoled"]`,
values copied verbatim from the design system file. Dark is the default.

**Font:** Inter via `next/font/google` — self-hosted automatically, no external request at
runtime, and `font-variant-numeric: tabular-nums` applied to every timer, countdown and
marks figure (the same hard requirement as on Android).

---

## 5. Phasing

Mirrors PLAN.md's phases so both clients stay in step.

| Phase | Web scope |
|---|---|
| **1** | Design system in CSS · shared components · **Dashboard (all 3 pace states)** · syllabus two-pane · timer with wall-clock persistence · local-only storage, no account |
| **2** | Supabase auth + sync · onboarding wizard · planner · full stats & charts · marketing pages |
| **3** | Friends, leaderboard, groups, study rooms |
| **4** | Doubt forum, chat, moderation · PWA polish · SEO · launch |

Phase 1 needs no backend and no signup — same principle as the Android plan.

---

## 6. Open Decisions

1. **Domain name** — needed before deployment. Not urgent for local development.
2. **Deployment** — Vercel's free tier fits this well (Next.js is theirs; zero config).
   Decide before Phase 2.
3. **Which client leads on new features** — proposal: **web leads**, because it's faster to
   build and instantly reviewable on your hardware; Android follows once a feature is
   settled. This inverts the original plan and is the pragmatic call given the RAM ceiling.
