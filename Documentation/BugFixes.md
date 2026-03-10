# Bug Fixes — List and Course of Action

Bugs in priority order, with fix approach and tradeoffs. Work down the list.

---

## 1. PWA manifest icon paths (fixed)

**Bug:** Manifest in `vite.config.ts` referenced `/icon-192.png`, `/icon-512.png`, and maskable variants that did not exist. Actual assets in `public/` are `android-chrome-192x192.png` and `android-chrome-512x512.png`.

**Course of action:** Already corrected: manifest `icons` array now points at the existing android-chrome files for both `any` and `maskable` purposes.

**Tradeoff:** Reusing the same assets for maskable is a fallback; ideal would be dedicated maskable icons with safe-zone padding. Fine for now; can add later.

---

## 2. Same exercise twice in one workout — session_sets collision (fixed)

**Bug:** In `useWorkoutSession.ts`, session sets are fetched and created by `session_id` + `exercise_id` only. The `session_sets` table has no `template_exercise_id`. If a template has the same exercise twice (e.g. Dumbbell Curl at position 1 and 4), both blocks share one set of rows: the second block shows the first block’s sets, and its own sets are never created.

**Done:** Schema and app updated. **You must run this in the Supabase SQL editor** (for an existing DB) before the fix works:

```sql
ALTER TABLE session_sets ADD COLUMN IF NOT EXISTS template_exercise_id uuid REFERENCES template_exercises ON DELETE SET NULL;
```

- **Schema:** `Documentation/schema.sql` — `session_sets` now includes `template_exercise_id` (nullable). RLS unchanged (session ownership suffices).
- **useWorkoutSession:** Fetches and inserts by `template_exercise_id`; `addSet` includes it.
- **useWorkoutHistory / SessionDetail:** Selects `template_exercise_id`; groups by `template_exercise_id ?? exercise_id` and orders blocks by min set_number so duplicate exercises show as separate blocks in history.

**Decisions / tradeoffs:**

- **Nullable:** Existing rows have `template_exercise_id` null; history view groups those by `exercise_id` so old sessions still render. New sessions get the column set; duplicate exercises in one workout no longer collide.
- **Backfill:** Optional. Old sessions with the same exercise twice still show as one merged block until you backfill (e.g. from template order); new data is correct.

---

## 3. Template create flow not transactional; set insert errors ignored (fixed)

**Bug:** In `TemplateEdit.tsx`, `handleDoneNew` creates the template, then inserts each `template_exercise`, then for each exercise inserts `template_exercise_sets`. The set inserts are awaited but their errors are never checked. If a set insert fails, the template and template_exercises are already committed; the user can end up with a half-created template and no clear error.

**Course of action:**

1. **Check errors on every insert:** For each `template_exercise_sets` insert, capture the result and `if (res.error) throw res.error` (or equivalent) so the catch block runs.
2. **Rollback on failure:** If any step after template creation fails, remove the created template (and thus cascade-delete template_exercises and template_exercise_sets). So: on catch after a failure, call `supabase.from('workout_templates').delete().eq('id', templateId)` (and ensure RLS allows delete), then surface the error to the user (toast or inline message).
3. **Optional — true transaction:** Supabase doesn’t expose a multi-statement client transaction in the same way as raw SQL. Alternatives: (a) use a single RPC that does all inserts in one Postgres transaction, or (b) keep the current “create then rollback on failure” approach. (b) is simpler and avoids RPC; (a) is atomic but requires DB function and migration.

**Decisions / tradeoffs:**

- **Rollback vs RPC:** Application-level rollback (delete template on failure) is simpler and doesn’t require schema/migration. RPC gives atomicity and avoids a short window where a partial template exists; use if you want the strongest guarantee.

**Done:** Each `template_exercise_sets` insert now checks `if (setErr) throw setErr`; on catch, the created template is deleted (rollback) and `createError` state shows the message below the header buttons.

---

## 4. Export missing template_exercise_sets (fixed)

**Bug:** `exportUserData()` in `lib/exportData.ts` exports exercises, workout_templates, template_exercises, scheduled_workouts, workout_sessions, session_sets — but not `template_exercise_sets`. Per-set targets are part of the user’s programming data, so the export is not a faithful backup.

**Course of action:**

1. After fetching `template_exercises`, collect their IDs.
2. If non-empty, query `template_exercise_sets` with `.in('template_exercise_id', teIds)`.
3. Add a new field to the export payload, e.g. `template_exercise_sets: array`, and include the result. Update the `ExportedData` type accordingly.
4. If you ever add an import path, ensure it restores `template_exercise_sets` in the correct order (template_exercise_id, set_number).

**Decisions / tradeoffs:**

- Straightforward addition; no schema change. Export format version can stay 1 or bump to 2 if you want to signal “includes template_exercise_sets” to future import logic.

**Done:** After loading `template_exercises`, we collect their IDs, fetch `template_exercise_sets` with `.in('template_exercise_id', templateExerciseIds)` (ordered by template_exercise_id, set_number), and add `template_exercise_sets` to `ExportedData` and the returned payload. Export version remains 1.

---

## 5. Session-set persistence incomplete (target_duration_seconds, target_weight) (fixed)

**Bug:** In `useWorkoutSession.ts`, when creating session_sets, only `target_reps` (and session_id, exercise_id, set_number, completed) are persisted. `target_duration_seconds` and `target_weight` are reconstructed in memory from template/template_exercise_sets. If the template changes later, or for immutable session snapshots, the “what the user saw when they performed the workout” is not fully stored.

**Course of action:**

1. **Schema:** Add to `session_sets` if not present: `target_duration_seconds integer`, `target_weight numeric`. (Check current schema; they may already exist as optional columns.)
2. **useWorkoutSession:** In `ensureSetsForExercise`, when inserting new sets, include `target_duration_seconds` and `target_weight` from the same per-set target (or exercise defaults) you use for the in-memory row. When selecting existing sets, select these columns and use them in the returned rows so the UI and history show stored values.
3. **addSet:** When adding an ad-hoc set, persist `target_duration_seconds` and `target_weight` for the new row from the current exercise’s defaults or set_targets.

**Decisions / tradeoffs:**

- **Backfill:** Existing session_sets rows will have nulls; history view can fall back to “reconstruct from template at view time” for old data, or leave as null. New sessions get full fidelity.
- **Schema:** If columns already exist, this is code-only. If not, add columns (nullable) and document in `schema.sql`.

**Done:** Schema now includes `target_duration_seconds` and `target_weight` on `session_sets`. In `ensureSetsForExercise`, new sets are inserted with those fields (from per-set targets or exercise defaults), and the select returns them; withTargets uses stored values first, then template. `addSet` persists target_duration_seconds and target_weight. For existing DBs run: `ALTER TABLE session_sets ADD COLUMN target_duration_seconds integer; ALTER TABLE session_sets ADD COLUMN target_weight numeric;`

---

## 6. Analytics / history load large data client-side

**Bug:** `useProgressAnalytics` (and any history paths that depend on it) loads all completed sessions and all session_sets for those sessions, then computes streaks and volume in the browser. For a solo app this is acceptable; for growth it becomes a performance and cost problem.

**Course of action (defer):**

1. **Short term:** No change; acceptable for current scale.
2. **Later options:** (a) Server-side aggregation: Supabase RPC or Edge Function that returns pre-aggregated weekly volume, streak, etc. (b) Limit/pagination: e.g. last N sessions or last 12 months for analytics. (c) Hybrid: fetch minimal session list client-side, then fetch sets or aggregates per template or time window as needed.

**Decisions / tradeoffs:**

- Not urgent; fix when usage or data size justifies. Prioritize bugs 2–5 first for correctness and data fidelity.

---

## Summary order

| # | Bug | Priority | Blocker? |
|---|-----|----------|----------|
| 1 | PWA manifest icons | Done | — |
| 2 | Same exercise twice → set collision | High | Yes (logic) |
| 3 | Template create not transactional | High | Yes (data integrity) |
| 4 | Export missing template_exercise_sets | Medium | No (backup fidelity) |
| 5 | Session sets missing target_duration/weight | Medium | No (historical fidelity) |
| 6 | Analytics client-side scale | Low | No (future perf) |

Work through 2 → 3 → 4 → 5 in that order; 6 when needed.
