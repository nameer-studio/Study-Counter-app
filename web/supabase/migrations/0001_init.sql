-- Study Counter web — initial Supabase schema (M2)
-- Run this in the Supabase project's SQL Editor (Dashboard → SQL Editor → New query).
-- Mirrors the localStorage keys mapped in the Supabase backend plan: profiles, attempts,
-- situations, situation hour overrides, logged sessions, mock tests, planned blocks,
-- revision rounds, chapter confidence. Deliberately excludes: sc-onboarded (derived from
-- whether an `attempts` row exists), sc-active-session (device-local timer state),
-- sc-theme (device preference). sc-planned-blocks/notification-prefs/spom/trainings
-- sync wiring lands in M4; `planned_blocks` table is created now since it's cheap and
-- this migration already covers its cardinality class.

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ───────────────────────── singleton-per-user tables ─────────────────────────

create table profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  username     text not null default '',
  updated_at   timestamptz not null default now()
);

create table attempts (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  level        text not null,
  group_scope  text not null,
  session      text not null,
  year         int not null,
  exam_date    date,
  paper_dates  jsonb not null default '{}',
  exemptions   jsonb not null default '{}',
  updated_at   timestamptz not null default now()
);

create table situations (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  mode              text not null,
  office_in         text,
  office_out        text,
  leave_start_date  date,
  updated_at        timestamptz not null default now()
);

create table situation_hour_overrides (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  overrides  jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- ───────────────────────── multi-row tables ─────────────────────────

create table logged_sessions (
  id            uuid primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  paper_id      text not null,
  chapter_id    text not null,
  activity_type text not null,
  duration_ms   bigint not null,
  ended_at      bigint not null,
  deleted_at    timestamptz,
  updated_at    timestamptz not null default now()
);
create index logged_sessions_user_idx on logged_sessions(user_id) where deleted_at is null;

create table mock_tests (
  id                uuid primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  paper_id          text not null,
  date              bigint not null,
  marks_obtained    numeric not null,
  max_marks         numeric not null,
  source            text not null,
  correct_count     int,
  wrong_count       int,
  unattempted_count int,
  deleted_at        timestamptz,
  updated_at        timestamptz not null default now()
);
create index mock_tests_user_idx on mock_tests(user_id) where deleted_at is null;

create table planned_blocks (
  id               uuid primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  paper_id         text not null,
  chapter_id       text not null,
  activity_type    text not null,
  date             date not null,
  start_time       text,
  duration_minutes int not null,
  completed        boolean not null default false,
  deleted_at       timestamptz,
  updated_at       timestamptz not null default now()
);
create index planned_blocks_user_idx on planned_blocks(user_id) where deleted_at is null;

-- ───────────────────────── keyed-map tables ─────────────────────────

create table revision_rounds (
  user_id    uuid not null references auth.users(id) on delete cascade,
  chapter_id text not null,
  round      text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_id)
);

create table chapter_confidence (
  user_id    uuid not null references auth.users(id) on delete cascade,
  chapter_id text not null,
  confidence smallint not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_id)
);

-- ───────────────────────── updated_at triggers ─────────────────────────

create trigger t_profiles before update on profiles for each row execute function set_updated_at();
create trigger t_attempts before update on attempts for each row execute function set_updated_at();
create trigger t_situations before update on situations for each row execute function set_updated_at();
create trigger t_situation_hours before update on situation_hour_overrides for each row execute function set_updated_at();
create trigger t_logged_sessions before update on logged_sessions for each row execute function set_updated_at();
create trigger t_mock_tests before update on mock_tests for each row execute function set_updated_at();
create trigger t_planned_blocks before update on planned_blocks for each row execute function set_updated_at();
create trigger t_revision_rounds before update on revision_rounds for each row execute function set_updated_at();
create trigger t_chapter_confidence before update on chapter_confidence for each row execute function set_updated_at();

-- ───────────────────────── row level security ─────────────────────────

alter table profiles enable row level security;
alter table attempts enable row level security;
alter table situations enable row level security;
alter table situation_hour_overrides enable row level security;
alter table logged_sessions enable row level security;
alter table mock_tests enable row level security;
alter table planned_blocks enable row level security;
alter table revision_rounds enable row level security;
alter table chapter_confidence enable row level security;

create policy "select own profiles" on profiles for select using (auth.uid() = user_id);
create policy "insert own profiles" on profiles for insert with check (auth.uid() = user_id);
create policy "update own profiles" on profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own profiles" on profiles for delete using (auth.uid() = user_id);

create policy "select own attempts" on attempts for select using (auth.uid() = user_id);
create policy "insert own attempts" on attempts for insert with check (auth.uid() = user_id);
create policy "update own attempts" on attempts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own attempts" on attempts for delete using (auth.uid() = user_id);

create policy "select own situations" on situations for select using (auth.uid() = user_id);
create policy "insert own situations" on situations for insert with check (auth.uid() = user_id);
create policy "update own situations" on situations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own situations" on situations for delete using (auth.uid() = user_id);

create policy "select own situation_hour_overrides" on situation_hour_overrides for select using (auth.uid() = user_id);
create policy "insert own situation_hour_overrides" on situation_hour_overrides for insert with check (auth.uid() = user_id);
create policy "update own situation_hour_overrides" on situation_hour_overrides for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own situation_hour_overrides" on situation_hour_overrides for delete using (auth.uid() = user_id);

create policy "select own logged_sessions" on logged_sessions for select using (auth.uid() = user_id);
create policy "insert own logged_sessions" on logged_sessions for insert with check (auth.uid() = user_id);
create policy "update own logged_sessions" on logged_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own logged_sessions" on logged_sessions for delete using (auth.uid() = user_id);

create policy "select own mock_tests" on mock_tests for select using (auth.uid() = user_id);
create policy "insert own mock_tests" on mock_tests for insert with check (auth.uid() = user_id);
create policy "update own mock_tests" on mock_tests for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own mock_tests" on mock_tests for delete using (auth.uid() = user_id);

create policy "select own planned_blocks" on planned_blocks for select using (auth.uid() = user_id);
create policy "insert own planned_blocks" on planned_blocks for insert with check (auth.uid() = user_id);
create policy "update own planned_blocks" on planned_blocks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own planned_blocks" on planned_blocks for delete using (auth.uid() = user_id);

create policy "select own revision_rounds" on revision_rounds for select using (auth.uid() = user_id);
create policy "insert own revision_rounds" on revision_rounds for insert with check (auth.uid() = user_id);
create policy "update own revision_rounds" on revision_rounds for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own revision_rounds" on revision_rounds for delete using (auth.uid() = user_id);

create policy "select own chapter_confidence" on chapter_confidence for select using (auth.uid() = user_id);
create policy "insert own chapter_confidence" on chapter_confidence for insert with check (auth.uid() = user_id);
create policy "update own chapter_confidence" on chapter_confidence for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own chapter_confidence" on chapter_confidence for delete using (auth.uid() = user_id);
