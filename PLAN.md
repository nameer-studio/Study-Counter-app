# Study Counter — Full Product & Technical Plan
## For Indian CA (ICAI) Students — Foundation, Intermediate & Final

**Platform:** Android (Kotlin + Jetpack Compose, min SDK 24 / Android 7.0 — wider reach on mid-range Indian devices)
**Backend:** Supabase (Postgres + Auth + Realtime + Storage + Edge Functions)
**Architecture:** Offline-first — Room is the source of truth, Supabase syncs in background
**Scope:** All three levels at launch
**Delivery:** 4 phases, each shippable

---

## 1. Why the CA Audience Changes the Product

Study-Track (our reference competitor) is built for European university students: semester courses, timetable import, generic Pomodoro, hours logged. A CA student's life does not fit that model:

| Reality for a CA student | What it forces in the app |
|---|---|
| Thinks in **"attempts"** (Sept 26 attempt), not semesters | Countdown anchored to an attempt, with per-paper exam dates inside it |
| Final students study while doing **articleship** (9–7 at a firm), then take **study leave** | Two planning modes — 2–3 hrs/day vs 12–14 hrs/day — not one weekly target |
| Inter & Final are cleared **by group** | Group is a first-class planning unit; hour allocation differs hugely |
| Culture of **revision rounds** — 1st reading, 2nd, 3rd, final | Chapter status is a revision counter, not "completed" |
| **Writing practice** matters as much as reading | Hours split by activity: Concept / Question practice / Revision / Mock |
| Passing = **40 per paper AND 50% aggregate** | Readiness scored against that rule, not a generic percentage |
| **Exemptions** (60+) carry forward | Exemption tracker that changes what you need to study |
| Tax & Law change every attempt (Finance Act / AY) | Applicability flag per paper per attempt |
| ICAI syllabus is **public and standard** | Preload all 16 papers chapter-wise — zero setup for the user |

That last row is the biggest advantage. A university app can never ship a syllabus — every student has different courses. For CA we ship the entire ICAI syllabus and the student starts with a populated study plan on day one. **This is the feature that wins.**

---

## 2. ICAI Course Model (Built Into the App)

### 2.1 Attempt calendar — as you confirmed

| Level | Attempts/year | Sessions |
|---|---|---|
| **Foundation** | 3 | Jan · May–June · Sept |
| **Intermediate** | 3 | Jan · May–June · Sept |
| **Final** | 2 | May–June · **November** *(confirmed)* |

The session enum is therefore **level-dependent**, and the app must validate it per level — a Final student can never pick a January attempt. Exact dates still come from a config table refreshed from the server, never hardcoded, so an ICAI schedule change is a data update and not an app update.

### 2.2 CA Foundation — 4 papers, **no groups**
| Paper | Name | Type |
|---|---|---|
| 1 | Accounting | Subjective |
| 2 | Business Laws | Subjective |
| 3 | Quantitative Aptitude | **Objective, negative marking** |
| 4 | Business Economics | **Objective, negative marking** |

All four are cleared together as a single unit — there is no Group I / Group II. Papers 3 and 4 being MCQ with negative marking changes how mocks are scored and adds an accuracy dimension the other levels don't have.

### 2.3 CA Intermediate — 6 papers, 2 groups
| Group | Paper | Name |
|---|---|---|
| I | 1 | Advanced Accounting |
| I | 2 | Corporate and Other Laws |
| I | 3 | Taxation (A: Income Tax · B: GST) |
| II | 4 | Cost and Management Accounting |
| II | 5 | Auditing and Ethics |
| II | 6 | Financial Management & Strategic Management (A: FM · B: SM) |

### 2.4 CA Final — 6 papers, 2 groups
| Group | Paper | Name |
|---|---|---|
| I | 1 | Financial Reporting |
| I | 2 | Advanced Financial Management |
| I | 3 | Advanced Auditing, Assurance & Professional Ethics |
| II | 4 | Direct Tax Laws & International Taxation |
| II | 5 | Indirect Tax Laws |
| II | 6 | Integrated Business Solutions — case study, **open book** |

### 2.5 What differs by level

The app adapts rather than showing every student everything:

| | Foundation | Intermediate | Final |
|---|---|---|---|
| Groups | None (4 papers together) | I / II / Both | I / II / Both |
| Typical situation | School / college student | Full-time study, some in articleship | **Articleship + study leave** |
| Articleship tracker | Hidden | Optional | Shown |
| Self-Paced Modules (SET A–D) | Hidden | Hidden | Shown — must clear before Final |
| ICITSS / AICITSS | Hidden | ICITSS | AICITSS |
| Exemption tracker | Hidden | Shown | Shown |
| MCQ accuracy tracking | Papers 3 & 4 | — | — |
| Open-book mock mode | — | — | Paper 6 |

This is why the app is level-aware everywhere, not just in the syllabus list.

---

## 3. Feature Set

### 3.1 Attempt & countdown engine
- Set your **attempt**: level → group (hidden for Foundation) → session + year, with only valid sessions offered per level
- Per-paper exam dates within the attempt — CA papers are staggered across ~2 weeks
- **Two countdowns always visible:** days to *attempt start*, and days to *your next paper*
- **Study-leave countdown** (Final/Inter) — "42 days till leave, then 96 days of leave"
- Auto-recompute at local midnight and on every app open
- Milestone alerts: T-180, T-100, T-60, T-30, T-14, T-7, T-3, T-1 per paper
- **Attempt switching** — defer and everything carries forward: syllabus progress, exemptions, history

### 3.2 Syllabus tracking (ICAI-preloaded, all 16 papers)
- Every paper preloaded **chapter-wise** from ICAI study material structure
- Hierarchy: Level → Group → Paper → Chapter → Topic
- **Revision-round status**, matching how CA students actually work:
  `Not started → 1st reading → 1st revision → 2nd revision → Final revision`
- Per chapter: ICAI weightage, difficulty, confidence (1–5), last touched, question-practice count
- **Practical vs theory tagging** — planned differently (practical papers need question hours; theory papers need revision cycles)
- **Amendment flag** — chapters hit by the current Finance Act / AY badged "Amended for your attempt"
- Custom chapters addable; presets editable without breaking future syllabus updates

### 3.3 Session recording
- Live timer: **Pomodoro / stopwatch / countdown**, foreground service, survives app close and screen lock
- Tag before starting: **Paper → Chapter → activity type**
- **Activity types:**
  - 📖 Concept / first reading
  - ✍️ Question practice (ICAI SM / RTP / MTP / PYQ / Scanner / Test series)
  - 🔁 Revision
  - 📝 Mock test (timed, full paper)
  - 🎧 Lecture (coaching video)
- End-of-session log: hours, **chapter studied**, **next chapter planned**, questions attempted, confidence, notes, "advance revision round"
- Manual / backdated entry for offline study
- **Mock mode** — 3-hour exam simulation with 15-min reading time, no pause; **open-book variant** for Final Paper 6; **MCQ variant** with negative marking for Foundation Papers 3 & 4

### 3.4 Planning
- **Situation modes** — *School/college*, *Full-time study*, *Articleship*, *Study leave*; each with its own daily hour target and block templates. Auto-switches on your leave start date.
- **Weekly planner** — 7-day grid of blocks (paper + chapter + activity type)
- **"Plan your week" wizard** — enter available hours; distributes across papers weighted by ICAI weightage, chapters remaining, revision round due, and neglect
- **Full-attempt roadmap** — auto-generates a plan from today to exam day, reserving the last stretch for final revision (default 25% of remaining time), with a per-paper chapter schedule
- **Revision scheduler** — spaced repetition tuned to CA (1st revision ~7 days after reading, 2nd ~21 days, final in the last stretch)
- **Exam-gap planner** — allocates the 1–2 day gaps between papers to the right paper
- Recurring block templates for a typical articleship or college day

### 3.5 Mock tests & marks
- Log every **MTP / RTP / PYQ / test-series / self-mock**: paper, source, date, marks, time taken
- **Objective papers** additionally log correct / wrong / unattempted, so the app computes **net marks after negative marking** and an accuracy %
- **Paper-wise marks trend** across mocks and attempts
- **Exemption tracker** (Inter & Final) — flags papers scored 60+, with carry-forward expiry
- **Pass projection** — projects against the 40-per-paper + 50%-aggregate rule and names the paper dragging you under the line
- Question-bank coverage: % of ICAI SM / RTP / PYQ attempted per chapter

### 3.6 Charts & diagrams (19)

| # | Chart | Answers |
|---|---|---|
| 1 | Daily hours bar chart | How much did I study each day? |
| 2 | Weekly trend line/area | Improving week over week? |
| 3 | Paper-wise donut | Where is my time going? |
| 4 | **Activity-type stacked bar** | Am I only reading and never writing? |
| 5 | Calendar heatmap | Consistency at a glance |
| 6 | Planned vs actual grouped bars | Do I keep my own plans? |
| 7 | **Chapter completion stacked bar per paper** | How much syllabus is left? |
| 8 | **Revision-round coverage** — chapters at round 0/1/2/3 | Revising, or just reading once? |
| 9 | Radar — paper balance | Which paper am I neglecting? |
| 10 | Time-of-day heatmap (hour × weekday) | When am I actually productive? |
| 11 | Streak calendar | Current + longest streak |
| 12 | **Burn-down: chapters remaining vs days to attempt**, ideal-pace line | Will I finish before the exam? |
| 13 | Cumulative hours burn-up vs target | On track for total hours? |
| 14 | **Mock marks trend per paper** with the 40-mark pass line | Improving where it counts? |
| 15 | **Aggregate projection gauge** vs 50% line | Will I clear? |
| 16 | Session-length histogram | Deep work or fragments? |
| 17 | Confidence vs time-spent scatter | Time going to chapters I'm weak in? |
| 18 | Friends leaderboard bars | How do I compare? |
| 19 | **MCQ accuracy & negative-marks-lost** *(Foundation P3/P4)* | Is guessing costing me? |

Plus exportable weekly PNG/PDF report and CSV export.

### 3.7 Social
- Friends by username / QR / invite link
- Leaderboard filterable **by level and attempt** ("Final Group I, Nov 26") so comparison is fair
- Live status — "4 friends studying now"
- Nudge a friend who's broken their streak
- **Study groups** — most CA students already have a batch; shared goal, group leaderboard, group chat
- **Study rooms** — live virtual co-working, members' timers side by side

### 3.8 Community & doubts
- **Doubt forum tagged by level, paper and chapter** — post a photo of a sum, get a worked solution
- **Paper-wise chat channels** (FR, DT, IDT, Audit, Costing, QA…)
- Direct messages
- Image + formula support — essential for journal entries and computations
- Reputation for accepted answers — surfaces seniors and rank-holders
- Report / block / mute + moderation queue (**required by Play Store for user content**)

### 3.9 Motivation
- Streaks with one freeze per week — articleship days are brutal, and a hard streak just makes people quit
- Badges: first 100 hours, 30-day streak, a paper fully revised twice, first mock above 60
- **Home-screen widget** — days to next paper + today's hours + start button

---

## 4. Screen Map — 44 screens

Single Activity, Navigation Compose. Bottom bar: **Home · Plan · [Timer FAB] · Stats · Community**

### A. Onboarding (6)
| # | Screen | Contents |
|---|---|---|
| A1 | Splash | Session restore |
| A2 | Welcome carousel | 3 slides: track, plan, clear your attempt |
| A3 | Sign in / Sign up | Email, Google, phone OTP. "Skip — use offline" |
| A4 | Profile setup | Name, username, avatar |
| A5 | **Attempt setup** | Level → Group *(skipped for Foundation)* → Session+Year *(only valid sessions for that level)* → per-paper dates → exemptions held *(Inter/Final)* |
| A6 | **Situation setup** | School/college · Full-time study · Articleship · Study leave — with timings, leave start date, and a daily hour target per mode |

### B. Home (2)
| # | Screen | Contents |
|---|---|---|
| B1 | Dashboard | **Dual countdown hero** (attempt / next paper) · pace badge · today's ring vs mode target · streak · today's blocks · Start CTA · weekly mini-chart · "Costing untouched 11 days" alert · friends studying now |
| B2 | Notifications | Requests, nudges, doubt replies, milestone alerts, amendment alerts |

### C. Timer (5)
| # | Screen | Contents |
|---|---|---|
| C1 | Timer setup | Mode · paper · chapter · **activity type** · target duration · focus mode |
| C2 | Active session | Circular timer · paper/chapter · pause/stop · switch chapter mid-session · break screen · distraction counter |
| C3 | **Mock test mode** | 3-hour simulation, reading time, no pause · open-book variant (Final P6) · MCQ variant with negative marking (Foundation P3/P4) |
| C4 | Session log sheet | Duration · chapters studied · **next chapter** · questions attempted · confidence · advance revision round · notes |
| C5 | Manual entry | Backdated session logging |

### D. Planner (9)
| # | Screen | Contents |
|---|---|---|
| D1 | Week view | 7-column grid, colour by paper, drag to move/resize, planned-vs-actual overlay |
| D2 | Day view | Timeline + logged sessions, gaps highlighted |
| D3 | Month calendar | Study-intensity dots, exam-day markers, leave-start marker |
| D4 | **Attempt roadmap** | Full plan to exam day: per-paper chapter schedule, revision windows, final-revision block reserved |
| D5 | Plan-your-week wizard | Available hours → auto-distribution (paper × day) → lock/adjust → apply |
| D6 | Block editor | Paper, chapter, activity type, time, repeat, reminder |
| D7 | **Papers & syllabus** | Group → Paper → Chapter tree with revision rounds, weightage, confidence, amendment badges |
| D8 | **My attempt** | Level/group/session, per-paper dates with live countdowns, exemptions, switch attempt |
| D9 | **Modules & trainings** *(level-aware)* | SET A–D checklist + AICITSS *(Final)* · ICITSS *(Inter)* · articleship period tracker · hidden entirely for Foundation |

### E. Stats (5)
| # | Screen | Contents |
|---|---|---|
| E1 | Overview | Range selector · KPIs · charts 1, 2, 3, 4, 5 |
| E2 | Paper detail | Charts 7, 8, 17 · chapter list ranked by time · confidence map |
| E3 | Insights | Charts 10, 16 · plain-language findings: *"78% of your DT time is reading, only 22% question practice — that ratio fails papers"* · *"At this pace you finish IDT 9 days after your exam"* |
| E4 | **Attempt readiness** | Charts 12, 13, 15 · per-paper readiness · required hrs/day · weakest-link paper |
| E5 | **Mock tests & marks** | Charts 14, 19 · mock log · exemption tracker · pass projection vs 40/50% rule |

### F. Community (8)
| # | Screen | Contents |
|---|---|---|
| F1 | Friends | List with today's hours + live status, requests, add friend |
| F2 | Leaderboard | Chart 18 · scope: friends / group / same attempt / global · your rank |
| F3 | Friend profile | Stats, streak, badges, nudge, message |
| F4 | Groups | My groups, discover by attempt, create |
| F5 | Group detail | Members, shared goal, group leaderboard, chat, study room |
| F6 | Study room | Live grid of running timers, room chat |
| F7 | **Doubt forum** | Feed filtered by level/paper/chapter · Unanswered · search · ask FAB |
| F8 | Question detail | Question with images · answers by votes · accepted badge · reply composer |

### G. Chat (3)
| # | Screen | Contents |
|---|---|---|
| G1 | Chat list | DMs, group chats, paper channels, unread badges |
| G2 | Conversation | Realtime, images, reply-to, typing indicator |
| G3 | Channel browser | Paper-wise channels with member counts |

### H. Profile & Settings (6)
| # | Screen | Contents |
|---|---|---|
| H1 | Profile | Avatar, attempt badge, lifetime stats, badge shelf, share card |
| H2 | Achievements | Badge grid, progress to next |
| H3 | Settings | Account, timer defaults, hour target per mode, theme (incl. AMOLED), language |
| H4 | Notifications | Per-category toggles, quiet hours |
| H5 | Privacy | Friend visibility, discoverability, blocked users |
| H6 | Data | Export CSV/PDF, backup, sign out, delete account |

---

## 5. Data Model

CA-specific tables and columns marked **bold**.

```
profiles         id username display_name avatar_url timezone reputation
                 **current_attempt_id**
                 **situation(school|fulltime|articleship|study_leave)**
                 **articleship_start_date** **study_leave_start_date**
                 goal_hours_by_situation(jsonb)

-- ── ICAI master data: app-owned, versioned, read-only to clients ──
**levels**          id code(FOUNDATION|INTER|FINAL) name has_groups(bool)
                    **attempts_per_year** **valid_sessions(text[])**
                       -- FOUNDATION/INTER: {JAN,MAY,SEP} · FINAL: {MAY,NOV}
**papers_master**   id level_id group_no(nullable) paper_no name
                    is_practical **is_objective** **has_negative_marking**
                    **negative_mark_per_wrong** **is_open_book**
                    max_marks weightage_json
**chapters_master** id paper_master_id name sort_order weightage
                    est_hours is_amendment_prone edition_tag
**exam_calendar**   id level_id session year paper_master_id exam_date
                       -- server-refreshed; never hardcoded

-- ── User data ──
**attempts**     id user_id level_id **group_scope(NONE|I|II|BOTH)**
                 **session** year is_active          -- session validated against level
                 **study_leave_start_date**
                 **applicable_finance_act** **applicable_ay**

**attempt_papers** id attempt_id paper_master_id **exam_date**
                   **is_exempted** **exemption_expiry_attempt** target_marks

user_chapters    id user_id attempt_paper_id chapter_master_id
                 **revision_round(0-4)** confidence(1-5) difficulty
                 est_hours actual_seconds questions_attempted
                 last_studied_at is_custom

study_sessions   id user_id attempt_paper_id chapter_id started_at ended_at
                 duration_seconds mode(pomodoro|stopwatch|countdown|mock)
                 **activity_type(concept|practice|revision|mock|lecture)**
                 **questions_attempted**
                 **source(SM|RTP|MTP|PYQ|SCANNER|TEST_SERIES)**
                 next_chapter_text confidence distraction_count notes
                 is_manual synced_at

**mock_tests**   id user_id attempt_paper_id date source
                 marks_obtained max_marks time_taken_minutes
                 **correct_count wrong_count unattempted_count**
                 **net_marks_after_negative**        -- objective papers only
                 notes

planned_blocks   id user_id attempt_paper_id chapter_id date start_time
                 duration_minutes **activity_type** recurrence_rule
                 reminder_minutes_before completed_session_id status

weekly_plans     id user_id week_start_date target_hours
                 distribution(jsonb) generated_by(auto|manual)

**roadmaps**     id attempt_id generated_at final_revision_days
                 schedule(jsonb: chapter_id → planned_date + round)

daily_stats      user_id date total_seconds session_count
                 papers(jsonb) **activity_split(jsonb)** goal_met
                 PK (user_id, date)

streaks          user_id current longest last_study_date freezes_remaining
achievements     id user_id badge_key unlocked_at progress
**spom_progress** user_id set_key(A|B|C|D) elective_name status completed_at
**trainings**    user_id type(ICITSS|AICITSS) status completed_at

friendships      id requester_id addressee_id status created_at
presence         user_id is_studying paper_id started_at    -- Realtime, ephemeral
groups           id name description owner_id invite_code is_public
                 **level_filter** **attempt_filter**
group_members    group_id user_id role joined_at
channels         id type(dm|group|paper|room) name **paper_master_id** group_id
channel_members  channel_id user_id last_read_at muted
messages         id channel_id sender_id body attachments reply_to_id
                 created_at edited_at deleted_at
doubt_posts      id author_id **level_id** **paper_master_id** **chapter_master_id**
                 title body images vote_count answer_count
                 accepted_answer_id status
doubt_answers    id post_id author_id body images vote_count is_accepted
votes            user_id target_type target_id value
                 PK(user_id,target_type,target_id)
reports          id reporter_id target_type target_id reason status
notifications    id user_id type payload read_at created_at
```

**Master tables are shipped in the APK as versioned JSON** and refreshed from Supabase when ICAI updates anything. User progress references them by id, so a syllabus update never destroys history.

**`levels.valid_sessions` drives the UI directly** — the attempt picker reads it, so a Final student is never offered January and a schedule change is a data edit, not a code change.

**Row-Level Security:** users touch only their own rows; friend data gated on an accepted `friendships` row plus the owner's privacy setting; master tables read-only to clients; community content readable by all authenticated users, writable only by the author.

**Never stored, always derived:** days remaining, pace, required hrs/day, aggregate projection, syllabus %. Computed from `daily_stats` + `attempt_papers` so they cannot go stale.

---

## 6. Technical Architecture

```
┌─ UI ──────────────────────────────────────────────┐
│ Compose · Material 3 · Navigation Compose          │
│ Vico (bar/line/donut) + custom Canvas              │
│   (heatmap, radar, burn-down, gauges)              │
└──────────────┬────────────────────────────────────┘
               │ StateFlow / UiState
┌─ Domain ─────▼────────────────────────────────────┐
│ CountdownEngine · PaceCalculator · StreakEngine    │
│ RoadmapGenerator · RevisionScheduler               │
│ PassProjector (40/50% + negative marking)          │
│ StatsRollup                                        │
└──────────────┬────────────────────────────────────┘
┌─ Data ───────▼────────────────────────────────────┐
│ Room (source of truth) ←→ SyncWorker (WorkManager) │
│                        ←→ Supabase-kt              │
│ DataStore (prefs) · Realtime (chat/presence)       │
│ Seed JSON (ICAI syllabus + calendar, versioned)    │
└───────────────────────────────────────────────────┘
```

- **DI** Hilt · **Async** Coroutines + Flow · **Time** `java.time` (desugared for API 24)
- **Timer** foreground Service, state persisted every 10s — a process kill loses ≤10 seconds
- **Sync** last-write-wins per row on `updated_at`; local `pending_ops` queue drains on connectivity
- **Notifications** AlarmManager for study reminders; Supabase Edge Function + FCM for social
- **Widget** Glance — next-paper countdown + today's ring + start button
- **APK size** matters for this audience — compressed seed JSON, no heavy chart libs, target <15 MB
- **Testing** JUnit + Turbine on the five risky engines (roadmap, pace, revision scheduler, pass projector, negative-marking calc); Compose UI tests on timer and log flows

---

## 7. Phased Delivery

### Phase 1 — Core tracker, fully offline, no account
A1–A2, A4–A6, B1, C1–C5, D1–D3, D6–D9, E1–E2, E5, H1, H3, H4, H6, widget.
All three levels · ICAI syllabus presets · attempt countdown · revision rounds · activity types · mock log with negative marking.
Charts 1–8, 11, 12, 14, 16, 19.
**Outcome:** a complete CA study tracker needing no server and no signup. Useful on its own, and it de-risks everything after it.

### Phase 2 — Accounts, sync, insights
Supabase Auth + SyncWorker, A3, B2, D4 (roadmap), D5 (wizard), E3, E4, H2.
Charts 9, 10, 13, 15, 17.
**Outcome:** multi-device, full analytics, pass projection.

### Phase 3 — Social
F1–F6, H5, presence, leaderboards, groups, study rooms, nudges. Chart 18.

### Phase 4 — Community & launch
F7, F8, G1–G3, reputation, moderation queue, reporting.
Play Store listing, privacy policy, UGC content policy, closed test with a real CA batch.

---

## 8. The Real Work Item: Syllabus Seeding

Supporting all three levels means seeding **16 papers ≈ 240 chapters**, each with name, order, weightage and estimated hours, checked against the current ICAI study material.

This is a content task, not a coding task, and it's the one thing that can't be rushed — wrong chapter lists are exactly what generates 1-star reviews. Proposed handling:

1. **Code is level-agnostic from day one** — the same screens serve all three; only seed data differs. No extra engineering cost for covering all levels.
2. **Seed in order Foundation → Inter → Final.** Foundation is only 4 papers, so it validates the whole pipeline cheaply before the 6-paper levels.
3. **Ship with editable presets and an "add chapter" fallback**, so a seeding gap is an inconvenience, not a blocker.
4. **Version every seed with `edition_tag`** so a mid-year ICAI revision ships as a data update.

Realistic estimate: 2–4 focused days of careful content work, done alongside Phase 1 development.

---

## 9. Settled Decisions

| Decision | Resolution |
|---|---|
| Levels covered | **All three** — Foundation, Intermediate, Final |
| Attempt calendar | Foundation 3/yr (Jan·May·Sep) · Inter 3/yr (Jan·May·Sep) · **Final 2/yr (May·Nov)** |
| Syllabus granularity | **Chapter-level** (~240 rows) — enough precision to plan against, few enough rows to keep accurate |
| Stack | Kotlin + Compose · Supabase · offline-first Room |
| Sequencing | 4 phases, Phase 1 fully offline |

## 10. Still Open (not blocking Phase 1)

1. **Pricing** — the competitor's €4.99/mo is ~₹470/mo, unsellable to this audience. Suggested: Phases 1–2 free, then an **"Attempt Pass" at ₹199–299 per attempt cycle**, or ₹99/mo. Decide before Phase 2.
2. **Moderation ownership** — Play Store requires a working report/takedown flow before Phase 4 ships. Someone has to own that queue.
3. **App icon / colour direction** — or approval to pick one.
4. **Supabase project** — needed at Phase 2. I'll supply schema + RLS migrations.

---

## 11. Phase 1 Build Order

1. Project skeleton — Compose, Hilt, Room, Navigation, theme
2. Master data layer — levels, papers, chapters seed JSON + DAOs (Foundation first, to validate the pipeline)
3. Onboarding A1–A2, A4–A6 — attempt setup with level-aware session validation
4. Syllabus screens D7–D9 — chapter tree, revision rounds
5. Timer C1–C5 + foreground service — the core loop
6. Dashboard B1 — dual countdown, CountdownEngine, StreakEngine
7. Planner D1–D3, D6
8. Stats E1–E2, E5 + charts 1–8, 11, 12, 14, 16, 19
9. Settings H1, H3, H4, H6 + Glance widget
10. Seed remaining Inter + Final chapter data
