-- Study Counter web — M4 follow-up: notification prefs, SPOM progress, trainings.
-- Run this in the Supabase project's SQL Editor after 0001_init.sql.
-- sc-planned-blocks already has its table (`planned_blocks`) from 0001_init.sql — only
-- these three new singleton-per-user tables are needed here.

create table notification_prefs (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  evening_review      boolean not null default true,
  streak_risk         boolean not null default true,
  syllabus_amendments boolean not null default true,
  updated_at          timestamptz not null default now()
);

create table spom_progress (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  progress   jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table trainings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  icitss     text not null default 'pending',
  aicitss    text not null default 'pending',
  updated_at timestamptz not null default now()
);

create trigger t_notification_prefs before update on notification_prefs for each row execute function set_updated_at();
create trigger t_spom_progress before update on spom_progress for each row execute function set_updated_at();
create trigger t_trainings before update on trainings for each row execute function set_updated_at();

alter table notification_prefs enable row level security;
alter table spom_progress enable row level security;
alter table trainings enable row level security;

create policy "select own notification_prefs" on notification_prefs for select using (auth.uid() = user_id);
create policy "insert own notification_prefs" on notification_prefs for insert with check (auth.uid() = user_id);
create policy "update own notification_prefs" on notification_prefs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own notification_prefs" on notification_prefs for delete using (auth.uid() = user_id);

create policy "select own spom_progress" on spom_progress for select using (auth.uid() = user_id);
create policy "insert own spom_progress" on spom_progress for insert with check (auth.uid() = user_id);
create policy "update own spom_progress" on spom_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own spom_progress" on spom_progress for delete using (auth.uid() = user_id);

create policy "select own trainings" on trainings for select using (auth.uid() = user_id);
create policy "insert own trainings" on trainings for insert with check (auth.uid() = user_id);
create policy "update own trainings" on trainings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own trainings" on trainings for delete using (auth.uid() = user_id);
