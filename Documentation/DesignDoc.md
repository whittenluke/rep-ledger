# Rep Ledger — Workout Tracker PWA: Design Document

## Overview

A personal progressive web app (PWA) for tracking gym workouts. The user designs workout templates, schedules them on a calendar, runs guided workout sessions with live set/rep/weight tracking, and reviews progress over time with per-exercise and per-workout analytics.

The app should feel like a premium fitness tool — fast, focused, and tactile. Think dark theme, high contrast, industrial/utilitarian aesthetic. Not flashy — purposeful. Every screen should have one clear job.

---

## Tech Stack

- **Framework:** React 18 + Vite (with vite-plugin-pwa)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **State:** Zustand
- **Routing:** React Router v6
- **Charts:** Recharts
- **Backend:** Supabase (Postgres, Auth, Row Level Security)
- **PWA:** Service worker via vite-plugin-pwa, installable on Android

---

## Design Aesthetic

- **Theme:** Dark. Near-black backgrounds (`#0e0e0e`, `#141414`). White and light gray text. High-contrast accent color — a single vivid color (e.g. electric lime `#c8ff00` or vivid orange `#ff5c00`) used sparingly for CTAs and active states.
- **Typography:** A strong, condensed display font (e.g. Barlow Condensed or Bebas Neue) for headings and numbers. A clean, readable body font (e.g. DM Sans or IBM Plex Sans) for labels and body text.
- **Feel:** Utilitarian. Numbers should be BIG and legible. Think weightlifting meets industrial dashboard. No decorative gradients.
- **Motion:** Subtle transitions only. No heavy animations — this is used mid-workout. Fast page transitions, satisfying set completion micro-interactions (e.g. a quick flash when you log a set).

---

## Supabase Schema

The canonical schema (tables + RLS) lives in **`Documentation/schema.sql`**.

**Workflow:** We don’t use the Supabase CLI or migration files. When we need a schema change, we run the SQL in the Supabase SQL editor (or draft it in chat), apply it in the project, then record it in `schema.sql` so the repo stays in sync.

---

## App Structure

```
src/
  app/
    App.tsx                  # Router setup
    routes/
      Dashboard.tsx
      Calendar.tsx
      WorkoutBuilder.tsx
      ActiveWorkout.tsx
      History.tsx
      Progress.tsx
      ExerciseDetail.tsx
      Settings.tsx
  components/
    ui/                      # shadcn components
    layout/
      BottomNav.tsx          # Mobile bottom tab nav
      PageHeader.tsx
    workout/
      ExerciseCard.tsx       # Used in ActiveWorkout
      SetRow.tsx             # Individual set input row
      RestTimer.tsx
    calendar/
      WeekView.tsx
      DayCell.tsx
    charts/
      VolumeChart.tsx
      WeightProgressChart.tsx
      ConsistencyHeatmap.tsx
  store/
    activeWorkout.ts         # Zustand — live session state
    user.ts                  # Zustand — auth/user prefs
  lib/
    supabase.ts              # Supabase client
  hooks/
    useWorkoutSession.ts
    useExerciseHistory.ts
    useCalendar.ts
```

---

## Screens & Features

### 1. Dashboard (`/`)

- Today's scheduled workout (if any) with a big "Start Workout" CTA
- Recent activity summary (last 3 sessions)
- Quick stats: workouts this week, current streak
- If no workout today: prompt to pick one or rest day indicator

### 2. Calendar (`/calendar`)

- Monthly calendar view
- Each day shows a dot/badge if a workout is scheduled; color-coded if completed
- Tap a day to see what's scheduled, or assign a workout template to that day
- Tap a completed day to see that session's summary

### 3. Workout Builder (`/builder`)

- List of saved workout templates
- Create/edit a template: give it a name, add exercises, set target sets/reps/weight per exercise, drag to reorder
- Exercise picker: search/filter from your exercise library, or create a new exercise inline
- Exercise library tab: manage all exercises (name, muscle group, notes)

### 4. Active Workout (`/session/:id`)

This is the most important screen. Keep it focused.

- **Header:** workout name, elapsed time (running stopwatch)
- **Current exercise:** name + muscle group, large and clear
- **Set tracker:** list of sets for this exercise, each row shows:
  - Set number
  - Target reps × target weight (pre-filled from template)
  - Editable actual reps and weight inputs
  - Checkbox/button to mark set complete
- "Next Exercise" button advances to the next exercise
- Optional rest timer (configurable, starts automatically after completing a set)
- Progress indicator: "Exercise 2 of 5"
- Finish workout button (with confirmation)
- Any set changes made during the session are saved as the actual values (not overwriting the template targets)

### 5. History (`/history`)

- Chronological list of completed workout sessions
- Each card: date, workout name, duration, sets completed
- Tap to drill into full session detail (every exercise, every set, weights used)

### 6. Progress (`/progress`)

Top-level analytics:

- **Consistency:** Calendar heatmap showing workout days. Streak counter.
- **Volume over time:** Total weekly volume (sets × reps × weight) as a line chart
- **By workout:** Filter down to a specific template, see frequency and volume trends
- **By exercise:** Search/select any exercise, see:
  - Max weight over time (line chart)
  - Total volume over time
  - Best set ever (weight × reps)

### 7. Settings (`/settings`)

- Weight unit preference (kg / lbs)
- Default rest timer duration
- Account (Supabase auth — email/password or magic link)
- Data export (JSON)

---

## Navigation

Mobile bottom tab bar with 5 tabs:

- **Home** — Dashboard
- **Calendar**
- **(Center FAB)** — "Start Today's Workout" or "Log Workout"
- **Progress**
- **More** — History, Builder, Settings

---

## Session Persistence

- No offline layer needed for now — all data reads and writes go directly to Supabase.
- Persist the active workout Zustand store to **localStorage** using zustand/middleware (persist). This protects against the screen locking or the browser tab refreshing mid-session. It's ~3 lines of config and prevents the most painful possible data loss scenario. On app load, if a persisted in-progress session is found, prompt the user to resume or discard it.
- Keep all Supabase calls behind hooks (`useWorkoutSession`, `useExerciseHistory`, etc.) rather than calling the client directly in components. This keeps the door open to adding an offline layer later without touching any UI code.

---

## PWA Requirements

vite-plugin-pwa config should include:

- **name:** "Rep Ledger"
- **short_name:** "RepLedger"
- **theme_color:** your chosen accent color
- **background_color:** `#0e0e0e`
- **display:** standalone
- **orientation:** portrait
- Icons at 192×192 and 512×512
- **Cache strategy:** StaleWhileRevalidate for API calls, CacheFirst for static assets
- Prompt user to install on first visit (custom install banner, not browser default)

---

## Key UX Rules

1. The app should never lose session data. Zustand active session state is persisted to localStorage — if the user closes the browser mid-workout, they're prompted to resume on next open.
2. All number inputs on the active workout screen should be large enough to tap easily with gym gloves / sweaty fingers. Minimum 44px touch targets.
3. Keep the active workout screen free of clutter. One exercise at a time. No sidebars.
4. Weight and reps inputs should use numeric keyboard on mobile (`inputMode="numeric"`).

---

## Suggested Build Order

1. ~~Supabase project setup + schema migration~~ ✅
2. ~~Auth (magic link is fine for personal use)~~ ✅
3. ~~Exercise library CRUD~~ ✅
4. ~~Workout template builder~~ ✅
5. ~~Calendar — schedule workouts to days~~ ✅
6. ~~Active workout session screen (most complex, most important)~~ ✅
7. ~~Session persistence to Supabase + Zustand localStorage persist middleware~~ ✅
8. ~~History screen~~ ✅
9. ~~Progress/analytics screens~~ ✅
10. ~~PWA manifest + service worker~~ ✅
11. ~~Polish: install prompt, icons, loading states, empty states~~ ✅
12. ~~Complete Dashboard (today's scheduled workout + Start CTA, recent activity, quick stats, pick one or rest day)~~ ✅
13. ~~Start workout without Calendar: center FAB and/or Dashboard "Start" (use today's scheduled or pick template)~~ ✅
14. ~~Build out Settings (weight unit, default rest timer, account, data export JSON, persist prefs)~~ ✅
15. ~~Active workout UX review (touch targets, rest timer, set-complete micro-interaction)~~ ✅
16. Calendar: tap completed day to view session summary
17. Exercise list categorization (group/filter by muscle group for easier browsing)
18. Builder: delete template from list (e.g. long-press or row action) for discoverability
19. Error and empty state pass on critical flows
