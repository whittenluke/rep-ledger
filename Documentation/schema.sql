-- Rep Ledger — Supabase schema
--
-- Workflow: This file is the source of truth for the database schema.
-- We are not using the Supabase CLI or migrations. When we need to change
-- the schema, we run the SQL in the Supabase SQL editor (or discuss in chat),
-- apply it in the project, then record it here so schema.sql stays in sync.

-- =============================================================================
-- Tables (users managed by Supabase Auth)
-- =============================================================================

-- Exercises: user_id NULL = system exercise (read-only for users); non-null = user's own exercise.
-- Users can pick system exercises and clone them to customize (insert new row with user_id set).
-- Primary muscle: anatomical name (e.g. Pectorals, Deltoids). Used for filter/group in UI.
-- Secondary muscles: array of anatomical names; useful for search ("everything that works Triceps").
-- Movement pattern: for balanced programming (Push/Pull/Hinge/Squat/Carry/Core/Cardio).
-- Equipment: what you use to perform the exercise.
-- is_bodyweight: when true, weight is not logged during a session (e.g. Push Up, Plank).
-- image_url: optional URL to an exercise image (e.g. Supabase Storage public URL).
create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,                    -- null = system exercise
  name text not null,
  primary_muscle text not null,                           -- anatomical, e.g. "Pectorals", "Deltoids"
  secondary_muscles text[] not null default '{}',        -- e.g. array["Deltoids", "Triceps"]
  movement_pattern text not null check (movement_pattern in (
    'Push', 'Pull', 'Hinge', 'Squat', 'Carry', 'Core', 'Cardio'
  )),
  equipment text not null check (equipment in (
    'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Resistance Band'
  )),
  is_bodyweight boolean not null default true,            -- if true, session weight field N/A
  notes text,
  type text not null default 'reps' check (type in ('reps', 'time')),
  image_url text,                                         -- e.g. Supabase Storage public URL
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

-- Per-set targets for a template exercise (reps/weight or duration). One row per set.
-- When empty, template_exercises.target_sets/target_reps/target_weight define defaults.
create table template_exercise_sets (
  id uuid primary key default gen_random_uuid(),
  template_exercise_id uuid references template_exercises on delete cascade not null,
  set_number integer not null,       -- 1-based order
  target_reps integer,               -- null for time-based
  target_duration_seconds integer,   -- for time-based sets
  target_weight numeric,
  unique(template_exercise_id, set_number)
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

-- template_exercise_id: links each set to a specific template-exercise slot so the same
-- exercise can appear twice in one workout without sets colliding. Nullable for existing rows.
-- For existing DBs: ALTER TABLE session_sets ADD COLUMN template_exercise_id uuid REFERENCES template_exercises ON DELETE SET NULL;
create table session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workout_sessions on delete cascade,
  template_exercise_id uuid references template_exercises on delete set null,
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
alter table template_exercise_sets enable row level security;
alter table scheduled_workouts enable row level security;
alter table workout_sessions enable row level security;
alter table session_sets enable row level security;

-- Exercises: users can read system exercises (user_id is null) and their own; only mutate their own
create policy "exercises_select" on exercises
  for select using (user_id is null or user_id = auth.uid());
create policy "exercises_insert" on exercises
  for insert with check (user_id = auth.uid());
create policy "exercises_update" on exercises
  for update using (user_id = auth.uid());
create policy "exercises_delete" on exercises
  for delete using (user_id = auth.uid());

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

-- Template exercise sets: access via parent template exercise (and thus template ownership)
create policy "template_exercise_sets_owner" on template_exercise_sets
  for all using (
    exists (
      select 1 from template_exercises te
      join workout_templates wt on wt.id = te.template_id
      where te.id = template_exercise_sets.template_exercise_id
      and wt.user_id = auth.uid()
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
