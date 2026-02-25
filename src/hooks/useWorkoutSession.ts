import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useActiveWorkoutStore } from '@/store/activeWorkout'

export interface SessionSetTarget {
  target_reps: number | null
  target_duration_seconds: number | null
  target_weight: number | null
}

export interface SessionExercise {
  template_exercise_id: string
  exercise_id: string
  position: number
  name: string
  primary_muscle: string | null
  type: 'reps' | 'time'
  target_sets: number
  target_reps: number
  target_duration_seconds: number | null
  target_weight: number | null
  /** Per-set targets from template (when present). Used to create session_sets and for display. */
  set_targets?: SessionSetTarget[]
}

export interface SessionSetRow {
  id: string
  set_number: number
  target_reps: number | null
  target_duration_seconds: number | null
  target_weight: number | null
  actual_reps: number | null
  actual_duration_seconds: number | null
  weight: number | null
  completed: boolean
}

export function useWorkoutSession(scheduledWorkoutId: string | null) {
  const [templateName, setTemplateName] = useState('')
  const [exercises, setExercises] = useState<SessionExercise[]>([])
  const [sessionId, setSessionIdState] = useState<string | null>(null)
  const [sets, setSets] = useState<SessionSetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const {
    sessionId: storedSessionId,
    startedAt,
    scheduledWorkoutId: storedScheduledId,
    currentExerciseIndex,
    setSession,
    setCurrentExerciseIndex,
    nextExercise: storeNextExercise,
    reset: resetStore,
  } = useActiveWorkoutStore()

  const currentExercise = exercises[currentExerciseIndex] ?? null
  const isLastExercise = exercises.length > 0 && currentExerciseIndex >= exercises.length - 1
  const isFinished = exercises.length > 0 && currentExerciseIndex >= exercises.length

  const ensureSession = useCallback(async (): Promise<string> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Not authenticated')
    if (!scheduledWorkoutId) throw new Error('No scheduled workout')

    const { data: scheduled } = await supabase
      .from('scheduled_workouts')
      .select('id, template_id, workout_templates(name)')
      .eq('id', scheduledWorkoutId)
      .single()

    if (!scheduled?.template_id) throw new Error('Scheduled workout or template not found')

    const templateId = scheduled.template_id as string
    setTemplateName((scheduled.workout_templates as unknown as { name: string } | null)?.name ?? 'Workout')

    let sid = storedSessionId && storedScheduledId === scheduledWorkoutId ? storedSessionId : null
    if (!sid) {
      const { data: newSession, error: insertErr } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          scheduled_workout_id: scheduledWorkoutId,
          template_id: templateId,
        })
        .select('id, started_at')
        .single()
      if (insertErr) throw insertErr
      sid = newSession!.id
      setSession(sid, (newSession!.started_at as string) ?? new Date().toISOString(), scheduledWorkoutId!)
    }

    setSessionIdState(sid)
    return sid
  }, [scheduledWorkoutId, storedSessionId, storedScheduledId, setSession])

  const loadTemplateExercises = useCallback(async (templateId: string) => {
    const { data: teData, error: e } = await supabase
      .from('template_exercises')
      .select('id, exercise_id, position, target_sets, target_reps, target_duration_seconds, target_weight, exercises(name, primary_muscle, type)')
      .eq('template_id', templateId)
      .order('position')
    if (e) throw e
    const rows = (teData ?? []) as Array<{
      id: string
      exercise_id: string
      position: number
      target_sets: number
      target_reps: number
      target_duration_seconds: number | null
      target_weight: number | null
      exercises: { name: string; primary_muscle: string | null; type: 'reps' | 'time' } | null
    }>
    const teIds = rows.map((r) => r.id)
    const { data: setData } = await supabase
      .from('template_exercise_sets')
      .select('template_exercise_id, set_number, target_reps, target_duration_seconds, target_weight')
      .in('template_exercise_id', teIds.length ? teIds : ['00000000-0000-0000-0000-000000000000'])
      .order('set_number')
    const setRows = (setData ?? []) as Array<{
      template_exercise_id: string
      set_number: number
      target_reps: number | null
      target_duration_seconds: number | null
      target_weight: number | null
    }>
    const setsByTeId = new Map<string, SessionSetTarget[]>()
    for (const s of setRows) {
      const list = setsByTeId.get(s.template_exercise_id) ?? []
      list.push({
        target_reps: s.target_reps,
        target_duration_seconds: s.target_duration_seconds,
        target_weight: s.target_weight,
      })
      setsByTeId.set(s.template_exercise_id, list)
    }
    setExercises(
      rows.map((r) => {
        const setTargets = setsByTeId.get(r.id)
        return {
          template_exercise_id: r.id,
          exercise_id: r.exercise_id,
          position: r.position,
          name: r.exercises?.name ?? 'Unknown',
          primary_muscle: r.exercises?.primary_muscle ?? null,
          type: r.exercises?.type ?? 'reps',
          target_sets: setTargets?.length ?? r.target_sets,
          target_reps: r.target_reps,
          target_duration_seconds: r.target_duration_seconds,
          target_weight: r.target_weight,
          set_targets: setTargets?.length ? setTargets : undefined,
        }
      })
    )
  }, [])

  const ensureSetsForExercise = useCallback(
    async (sid: string, ex: SessionExercise): Promise<SessionSetRow[]> => {
      const { data: existing } = await supabase
        .from('session_sets')
        .select('id, set_number, target_reps, actual_reps, weight, actual_duration_seconds, completed')
        .eq('session_id', sid)
        .eq('exercise_id', ex.exercise_id)
        .order('set_number')
      const existingList = (existing ?? []) as Array<{
        id: string
        set_number: number
        target_reps: number | null
        actual_reps: number | null
        weight: number | null
        actual_duration_seconds: number | null
        completed: boolean
      }>
      const targetCount = ex.set_targets?.length ?? ex.target_sets
      const need = targetCount - existingList.length
      if (need > 0) {
        for (let i = 0; i < need; i++) {
          const setIndex = existingList.length + i
          const setNumber = setIndex + 1
          const t = ex.set_targets?.[setIndex]
          const targetReps = ex.type === 'time' ? null : (t?.target_reps ?? ex.target_reps)
          const { data: inserted, error: insErr } = await supabase
            .from('session_sets')
            .insert({
              session_id: sid,
              exercise_id: ex.exercise_id,
              set_number: setNumber,
              target_reps: targetReps,
              completed: false,
            })
            .select('id, set_number, target_reps, actual_reps, actual_duration_seconds, weight, completed')
            .single()
          if (insErr) throw insErr
          existingList.push({
            id: inserted.id,
            set_number: inserted.set_number,
            target_reps: inserted.target_reps,
            actual_reps: null,
            weight: null,
            actual_duration_seconds: null,
            completed: false,
          })
        }
      }
      const withTargets = existingList.map((s, i) => {
        const t = ex.set_targets?.[i]
        return {
          id: s.id,
          set_number: s.set_number,
          target_reps: s.target_reps ?? t?.target_reps ?? (ex.type === 'time' ? null : ex.target_reps),
          target_duration_seconds: t?.target_duration_seconds ?? (ex.type === 'time' ? ex.target_duration_seconds : null),
          target_weight: t?.target_weight ?? ex.target_weight ?? null,
          actual_reps: s.actual_reps,
          actual_duration_seconds: s.actual_duration_seconds,
          weight: s.weight,
          completed: s.completed,
        }
      })
      setSets(withTargets)
      return withTargets
    },
    []
  )

  useEffect(() => {
    if (!scheduledWorkoutId) {
      setLoading(false)
      return
    }
    let cancelled = false
    async function run() {
      try {
        setLoading(true)
        setError(null)
        const sid = await ensureSession()
        if (cancelled) return
        const { data: sessionRow } = await supabase
          .from('workout_sessions')
          .select('template_id')
          .eq('id', sid)
          .single()
        const templateId = sessionRow?.template_id as string
        if (!templateId) return
        await loadTemplateExercises(templateId)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [scheduledWorkoutId])

  useEffect(() => {
    if (!sessionId || exercises.length === 0) return
    const clamped = Math.min(currentExerciseIndex, Math.max(0, exercises.length - 1))
    if (clamped !== currentExerciseIndex) {
      setCurrentExerciseIndex(clamped)
      return
    }
    const ex = exercises[clamped]
    if (ex) ensureSetsForExercise(sessionId, ex)
    else setSets([])
  }, [sessionId, currentExerciseIndex, exercises])

  const updateSet = useCallback(
    async (
      setId: string,
      payload: {
        actual_reps?: number | null
        actual_duration_seconds?: number | null
        weight?: number | null
      }
    ) => {
      const { error: e } = await supabase
        .from('session_sets')
        .update(payload)
        .eq('id', setId)
      if (e) throw e
      setSets((prev) =>
        prev.map((s) => (s.id === setId ? { ...s, ...payload } : s))
      )
    },
    []
  )

  const markSetComplete = useCallback(
    async (
      setId: string,
      payload: {
        actual_reps?: number | null
        actual_duration_seconds?: number | null
        weight?: number | null
      }
    ) => {
      const { error: e } = await supabase
        .from('session_sets')
        .update({ ...payload, completed: true })
        .eq('id', setId)
        .select('id, set_number, target_reps, actual_reps, actual_duration_seconds, weight, completed')
        .single()
      if (e) throw e
      setSets((prev) =>
        prev.map((s) => (s.id === setId ? { ...s, ...payload, completed: true } : s))
      )
    },
    []
  )

  const addSet = useCallback(async () => {
    if (!sessionId || !currentExercise) return
    const nextSetNumber = sets.length + 1
    const { data: inserted, error: insErr } = await supabase
      .from('session_sets')
      .insert({
        session_id: sessionId,
        exercise_id: currentExercise.exercise_id,
        set_number: nextSetNumber,
        target_reps: currentExercise.type === 'time' ? null : currentExercise.target_reps,
        completed: false,
      })
      .select('id, set_number, target_reps, actual_reps, actual_duration_seconds, weight, completed')
      .single()
    if (insErr) throw insErr
    const newRow: SessionSetRow = {
      id: inserted.id,
      set_number: inserted.set_number,
      target_reps: inserted.target_reps,
      target_duration_seconds: currentExercise.type === 'time' ? currentExercise.target_duration_seconds : null,
      target_weight: currentExercise.type === 'time' ? null : (currentExercise.target_weight ?? null),
      actual_reps: null,
      actual_duration_seconds: null,
      weight: null,
      completed: false,
    }
    setSets((prev) => [...prev, newRow])
  }, [sessionId, currentExercise, sets.length])

  const removeSet = useCallback(async (setId: string) => {
    const { error: e } = await supabase.from('session_sets').delete().eq('id', setId)
    if (e) throw e
    setSets((prev) => prev.filter((s) => s.id !== setId))
  }, [])

  const nextExercise = useCallback(() => {
    if (currentExerciseIndex < exercises.length - 1) {
      storeNextExercise()
    }
  }, [currentExerciseIndex, exercises.length, storeNextExercise])

  const finishSession = useCallback(async () => {
    if (!sessionId) return
    await supabase
      .from('workout_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', sessionId)
    resetStore()
  }, [sessionId, resetStore])

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  useEffect(() => {
    if (!startedAt) {
      setElapsedSeconds(0)
      return
    }
    setElapsedSeconds(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    const interval = setInterval(
      () =>
        setElapsedSeconds(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)),
      1000
    )
    return () => clearInterval(interval)
  }, [startedAt])

  return {
    templateName,
    exercises,
    currentExercise,
    currentExerciseIndex,
    isLastExercise,
    isFinished,
    sets,
    loading,
    error,
    sessionId,
    updateSet,
    markSetComplete,
    addSet,
    removeSet,
    nextExercise,
    finishSession,
    elapsedSeconds,
  }
}
