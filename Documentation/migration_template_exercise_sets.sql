-- Run this in Supabase SQL editor to add per-set targets for template exercises.
-- See schema.sql for full schema; this adds only the new table and RLS.

create table if not exists template_exercise_sets (
  id uuid primary key default gen_random_uuid(),
  template_exercise_id uuid references template_exercises on delete cascade not null,
  set_number integer not null,
  target_reps integer,
  target_duration_seconds integer,
  target_weight numeric,
  unique(template_exercise_id, set_number)
);

alter table template_exercise_sets enable row level security;

create policy "template_exercise_sets_owner" on template_exercise_sets
  for all using (
    exists (
      select 1 from template_exercises te
      join workout_templates wt on wt.id = te.template_id
      where te.id = template_exercise_sets.template_exercise_id
      and wt.user_id = auth.uid()
    )
  );
