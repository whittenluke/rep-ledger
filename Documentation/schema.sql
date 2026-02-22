-- Rep Ledger — Supabase schema
--
-- Workflow: This file is the source of truth for the database schema.
-- We are not using the Supabase CLI or migrations. When we need to change
-- the schema, we run the SQL in the Supabase SQL editor (or discuss in chat),
-- apply it in the project, then record it here so schema.sql stays in sync.

-- =============================================================================
-- Tables (users managed by Supabase Auth)
-- =============================================================================

create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  muscle_group text,
  notes text,
  type text not null default 'reps' check (type in ('reps', 'time')),
  created_at timestamptz default now()
);

create table workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  notes text,
  created_at timestamptz default now()
);

create table template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references workout_templates on delete cascade,
  exercise_id uuid references exercises,
  position integer not null,         -- order in the workout
  target_sets integer not null,
  target_reps integer not null,
  target_duration_seconds integer,   -- for time-based exercises (holds)
  target_weight numeric,            -- in kg or lbs, user preference
  notes text
);

create table scheduled_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  template_id uuid references workout_templates,
  scheduled_date date not null,
  created_at timestamptz default now()
);

create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  scheduled_workout_id uuid references scheduled_workouts on delete set null,
  template_id uuid references workout_templates,
  started_at timestamptz default now(),
  completed_at timestamptz,
  notes text
);

create table session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workout_sessions on delete cascade,
  exercise_id uuid references exercises,
  set_number integer not null,
  target_reps integer,
  actual_reps integer,
  actual_duration_seconds integer,   -- for time-based sets (holds)
  weight numeric,
  completed boolean default false,
  logged_at timestamptz default now()
);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

-- Enable RLS on all tables
alter table exercises enable row level security;
alter table workout_templates enable row level security;
alter table template_exercises enable row level security;
alter table scheduled_workouts enable row level security;
alter table workout_sessions enable row level security;
alter table session_sets enable row level security;

-- Exercises: users can only see/touch their own
create policy "exercises_owner" on exercises
  for all using (auth.uid() = user_id);

-- Workout templates: same
create policy "templates_owner" on workout_templates
  for all using (auth.uid() = user_id);

-- Template exercises: access via parent template ownership
create policy "template_exercises_owner" on template_exercises
  for all using (
    exists (
      select 1 from workout_templates
      where id = template_exercises.template_id
      and user_id = auth.uid()
    )
  );

-- Scheduled workouts
create policy "scheduled_workouts_owner" on scheduled_workouts
  for all using (auth.uid() = user_id);

-- Sessions
create policy "sessions_owner" on workout_sessions
  for all using (auth.uid() = user_id);

-- Session sets: access via parent session ownership
create policy "session_sets_owner" on session_sets
  for all using (
    exists (
      select 1 from workout_sessions
      where id = session_sets.session_id
      and user_id = auth.uid()
    )
  );

-- =============================================================================
-- Migration: hold / time-based exercises (run on existing DBs only)
-- =============================================================================
-- Uncomment and run in Supabase SQL editor if your DB was created before this:
--
-- alter table exercises add column if not exists type text not null default 'reps' check (type in ('reps', 'time'));
-- alter table template_exercises add column if not exists target_duration_seconds integer;
-- alter table session_sets add column if not exists actual_duration_seconds integer;

-- =============================================================================
-- Migration: allow deleting scheduled_workouts when sessions exist (run on existing DBs)
-- =============================================================================
-- When a scheduled_workout is deleted, set workout_sessions.scheduled_workout_id to NULL
-- so the session (and history) is preserved. Run in Supabase SQL editor:
--
-- alter table workout_sessions
--   drop constraint if exists workout_sessions_scheduled_workout_id_fkey,
--   add constraint workout_sessions_scheduled_workout_id_fkey
--   foreign key (scheduled_workout_id) references scheduled_workouts(id) on delete set null;
