# Study Counter — Design Prompts

How to use this file: paste **Block 0** first to establish the design system, then paste **one batch at a time** (Blocks 1–8) in the same conversation. Each batch builds on the locked system from Block 0, which is what keeps 42 screens looking like one app.

Do not paste all batches at once. A single request for 42 screens produces shallow, inconsistent output.

---

# BLOCK 0 — Master Context & Design System

> Paste this first. Ask for the design system artifact before any screens.

You are designing **Study Counter**, a native Android app (Kotlin + Jetpack Compose, Material 3) for **Indian CA students** preparing for ICAI exams at three levels: Foundation, Intermediate, and Final.

## Who this is for

19–25 year olds training to be chartered accountants. Many are working 9-to-7 at an audit firm (articleship) and studying at 5am and 11pm. Others are on 3–4 month study leave doing 12–14 hour days. They are stressed, time-poor, and serious. They are **not** the audience for a playful pastel habit-tracker — this is closer to a professional tool than a lifestyle app.

They use mid-range Android phones, often on patchy data, frequently in low light late at night.

## The emotional core

One number governs everything: **days until the next exam paper**. Every screen should implicitly answer *"am I on pace?"* The app must be honest when the user is behind — a student who is quietly failing needs to see it — but it must never feel punishing. Anxiety is already at 100; the app's job is to convert it into a clear next action.

## Design principles

1. **The countdown is the hero.** Largest type on the dashboard. Always visible, never buried.
2. **Honest, not harsh.** Behind-pace states use clear amber/red signalling paired with a concrete next step, never shame language.
3. **Glanceable at 5am.** Core status readable in under two seconds, one-handed, half-awake.
4. **Dense but calm.** These users track a lot of data. Prefer clear hierarchy and generous line spacing over hiding things behind taps.
5. **Dark mode is primary, not an afterthought.** Much of the usage is late night. Design dark first, then light.

## Design system to produce and lock

Generate a design-system artifact covering:

**Colour**
- Primary: deep indigo/navy — serious, finance-adjacent, trustworthy. Not corporate-blue-boring.
- Semantic: green = on/ahead of pace · amber = slipping · red = behind pace · neutral grey = not started
- Accent: warm amber reserved exclusively for streaks and urgency — never decorative
- **Six distinct paper colours** (papers are colour-coded throughout: charts, planner blocks, chapter trees). They must stay distinguishable in both themes and for red-green colour blindness.
- Three themes: **Light**, **Dark**, **AMOLED true-black** (battery matters on long night sessions)

**Typography**
- A clean geometric or neo-grotesque sans (Inter, or Roboto Flex)
- **Tabular/monospaced numerals for all timers, countdowns and marks** — digits must not shift width as they tick
- Type scale with a display size large enough for the countdown to dominate the dashboard

**Components**
- Cards, chips (paper tags, activity types), progress rings, segmented controls, bottom sheets, FAB, bottom nav
- **Revision-round indicator**: a 5-state control for `Not started → 1st reading → 1st revision → 2nd revision → Final revision`. This appears on hundreds of chapter rows — it must be compact, scannable in a list, and instantly readable. Design this carefully; it is the most-repeated custom component in the app.
- **Pace badge**: small status pill reading "On pace" / "12 days behind" / "Ahead"

**Spacing & motion**
- 4dp base grid, standard Material 3 elevation
- Restrained motion. The timer may breathe; nothing else should animate for decoration.

**Deliverable for this block:** a single design-system reference sheet showing colour tokens in all three themes, the type scale, and every core component in its states. Do not design screens yet.

---

# BLOCK 1 — Onboarding (6 screens)

Using the locked design system, design these. Bottom nav is **not** present in onboarding.

| Screen | Contents |
|---|---|
| A1 Splash | Logo, quiet, fast |
| A2 Welcome carousel | 3 slides: *track your hours* · *plan your attempt* · *clear your group*. Sign-up and "Skip — use offline" both visible |
| A3 Sign in / Sign up | Email, Google, phone OTP, plus a genuinely prominent "Skip — use offline". The app is fully usable without an account and the design must say so. |
| A4 Profile setup | Name, username, avatar |
| A5 **Attempt setup** | The most important onboarding screen. Level (Foundation/Inter/Final) → Group (**hidden entirely for Foundation**, which has no groups) → Session + Year → per-paper exam dates (prefilled, editable) → exemptions already held (**Inter/Final only**). Sessions offered must be level-correct: Foundation and Inter get Jan/May/Sept; **Final gets only May/Nov**. |
| A6 **Situation setup** | Four options: *School/college* · *Full-time study* · *Articleship* · *Study leave*. Each sets a different daily hour target. If articleship: office timings. If study leave: leave start date. |

**Design challenge for A5:** it carries a lot of conditional complexity (group step vanishes for Foundation, session options change per level, exemptions only for Inter/Final) but must feel like three easy taps. Show the Foundation path and the Final path side by side to prove the conditionals work.

---

# BLOCK 2 — Home & Timer (7 screens)

| Screen | Contents |
|---|---|
| B1 **Dashboard** | The hero screen. **Dual countdown** — days to attempt AND days to next specific paper. Pace badge. Today's progress ring (hours done vs target for current situation mode). Streak flame. Today's planned blocks with tick-off. Big "Start studying" CTA. Weekly mini bar chart. A neglect alert ("Costing untouched for 11 days"). Friends-studying-now strip. |
| B2 Notifications | Friend requests, nudges, doubt replies, exam milestone alerts, syllabus amendment alerts |
| C1 Timer setup | Mode (Pomodoro/stopwatch/countdown) · paper · chapter · **activity type** · target duration · focus toggle |
| C2 **Active session** | Large circular timer, paper + chapter, pause/stop, switch-chapter mid-session, distraction counter. Must be readable across a dark room. |
| C3 **Mock test mode** | 3-hour exam simulation, reading-time phase, no pause. Two variants to show: open-book (Final Paper 6) and MCQ-with-negative-marking (Foundation Papers 3 & 4). |
| C4 Session log sheet | Bottom sheet after a session: duration · chapters studied · **next chapter planned** · questions attempted · confidence slider · "advance revision round" · notes |
| C5 Manual entry | Backdated session logging |

**Activity types** are core and appear as chips throughout: 📖 Concept · ✍️ Question practice · 🔁 Revision · 📝 Mock test · 🎧 Lecture.

**Design challenge for B1:** it must carry a genuinely large amount of information while a stressed student reads it in two seconds at 5am. Show it in three states: *ahead of pace*, *on pace*, and *badly behind with 20 days left*. The behind state is the one that matters most — get its tone right.

---

# BLOCK 3 — Planner (9 screens)

| Screen | Contents |
|---|---|
| D1 Week view | 7-column grid, blocks colour-coded by paper, drag to move/resize, planned-vs-actual overlay |
| D2 Day view | Timeline of planned blocks + logged sessions, gaps highlighted |
| D3 Month calendar | Study-intensity dots, exam-day markers, leave-start marker |
| D4 **Attempt roadmap** | Full plan from today to exam day: per-paper chapter schedule, revision windows, reserved final-revision block. A long, scrollable strategic view. |
| D5 Plan-your-week wizard | Enter available hours → auto-distribution table (paper × day) → lock/adjust cells → apply |
| D6 Block editor | Paper, chapter, activity type, time, repeat, reminder |
| D7 **Papers & syllabus** | Group → Paper → Chapter tree. Each chapter row shows revision-round state, ICAI weightage, confidence, and an "Amended for your attempt" badge where relevant. Roughly 240 chapters exist across all papers — this list must stay scannable at length. |
| D8 **My attempt** | Level/group/session, per-paper exam dates with live countdowns, exemptions held, switch-attempt action |
| D9 Modules & trainings | Level-aware: SET A–D + AICITSS (Final) · ICITSS (Inter) · articleship tracker · **entirely hidden for Foundation** |

**Design challenge for D7:** the chapter row is the most-repeated element in the app. It must fit paper, chapter name, revision round, weightage and confidence into a scannable row without becoming a wall of noise. Show a full paper's chapter list, not just two rows.

---

# BLOCK 4 — Stats & Charts (5 screens, 19 charts)

Charts should feel like one family: shared axis treatment, shared paper colours, readable in both themes.

| Screen | Charts & contents |
|---|---|
| E1 Overview | Range selector · KPI row (hours, avg/day, sessions, streak, syllabus %) · daily bar chart · weekly trend line · paper donut · **activity-type stacked bar** · calendar heatmap |
| E2 Paper detail | Chapter-completion stacked bar · **revision-round coverage** · confidence-vs-time scatter · chapter list ranked by time spent |
| E3 Insights | Time-of-day heatmap (hour × weekday) · session-length histogram · plain-language findings such as *"78% of your DT time is reading, only 22% question practice — that ratio fails papers"* and *"At this pace you finish IDT 9 days after your exam"* |
| E4 **Attempt readiness** | **Burn-down: chapters remaining vs days to attempt with ideal-pace line** · cumulative hours burn-up · **aggregate projection gauge against the 50% line** · per-paper readiness · required hrs/day · weakest-link paper |
| E5 **Mocks & marks** | Mock marks trend per paper **with the 40-mark pass line drawn** · **MCQ accuracy and marks-lost-to-negative-marking** (Foundation) · mock log · exemption tracker · pass projection |

**Context the charts must respect:** CA passing requires **40 marks in every paper AND 50% aggregate across the group**. The 40-line and 50-line are not decoration — they are the entire point of charts 14 and 15, and must be visually unmissable.

**Design challenge for E4:** the burn-down chart is the app's most important diagram. It must make "you will not finish in time" legible instantly, without inducing panic.

---

# BLOCK 5 — Community & Social (8 screens)

| Screen | Contents |
|---|---|
| F1 Friends | Friend list with today's hours and live status, pending requests, add via username/QR/link |
| F2 Leaderboard | Ranked bars · scope switcher: friends / group / same attempt / global · your rank card |
| F3 Friend profile | Their stats, streak, badges, nudge button, message button |
| F4 Groups | My groups, discover by attempt, create group |
| F5 Group detail | Members, shared goal progress, group leaderboard, chat entry, study room entry |
| F6 **Study room** | Live grid of members' running timers — virtual co-working. Should feel calm and companionable, not competitive. |
| F7 **Doubt forum** | Feed filtered by level/paper/chapter · Unanswered tab · search · ask-question FAB |
| F8 Question detail | Question with photo of a sum · answers sorted by votes · accepted-answer badge · reply composer |

**Note on tone:** leaderboards among exam students can tip into harmful comparison. Design F2 so a student ranked last still sees their own progress framed constructively.

---

# BLOCK 6 — Chat (3 screens)

| Screen | Contents |
|---|---|
| G1 Chat list | DMs, group chats, paper-wise channels, unread badges |
| G2 Conversation | Realtime messages, image attachments, reply-to, typing indicator |
| G3 Channel browser | Paper-wise channels (FR, DT, IDT, Audit, Costing, QA…) with member counts |

Messages must handle **photos of handwritten sums** and **accounting entries / formulas** — these are the dominant content types, not plain text.

---

# BLOCK 7 — Profile & Settings (6 screens)

| Screen | Contents |
|---|---|
| H1 Profile | Avatar, attempt badge, lifetime stats, badge shelf, shareable stats card |
| H2 Achievements | Badge grid, locked/unlocked, progress to next |
| H3 Settings | Account, timer defaults, hour target per situation mode, theme (Light/Dark/AMOLED), language |
| H4 Notifications | Per-category toggles, quiet hours, reminder times |
| H5 Privacy | Friend visibility, discoverability, blocked users |
| H6 Data | Export CSV/PDF, backup, sign out, delete account |

---

# BLOCK 8 — Widget, Notifications & App Icon

- **Home-screen widget** (Glance) in 2×2 and 4×2: days to next paper, today's progress ring, start-timer button
- **Timer foreground notification**: running time, paper/chapter, pause/stop actions
- **Milestone notifications**: T-100 / T-30 / T-7 / T-1 per paper
- **App icon**: must read clearly at 48dp, work on light and dark launchers, and feel serious rather than playful

---

# Reference & Guardrails

**Competitor:** study-track.app — built for European university students. Useful for baseline patterns, but its semester/timetable model does not fit CA at all. Do not copy its structure.

**Do not:**
- Use playful pastels, cartoon mascots, or gamified confetti — wrong register for this audience
- Bury the countdown below the fold on any screen where it belongs
- Design light mode first and darken it afterwards
- Use colour alone to encode pace status — pair it with text or icon for accessibility
- Invent ICAI facts. Paper names, group structure, and the attempt calendar are fixed:

**Locked domain facts:**
- Foundation: 4 papers, **no groups**, 3 attempts/year (Jan/May/Sept). Papers 3 & 4 objective with negative marking.
- Intermediate: 6 papers, Groups I & II, 3 attempts/year (Jan/May/Sept)
- Final: 6 papers, Groups I & II, **2 attempts/year (May/Nov)**. Paper 6 is open book.
- Passing: 40 marks per paper AND 50% group aggregate
- Revision rounds: Not started → 1st reading → 1st revision → 2nd revision → Final revision

Full specification: see `PLAN.md`.
