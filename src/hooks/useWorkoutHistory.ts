import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface CompletedSession {
  id: string
  started_at: string
  completed_at: string
  template_name: string
  durationSeconds: number
  setsCount: number
  scheduled_workout_id: string | null
}

export function useWorkoutHistory() {
  const [sessions, setSessions] = useState<CompletedSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: sessionsData, error: sessionsErr } = await supabase
      .from('workout_sessions')
      .select('id, started_at, completed_at, template_id, scheduled_workout_id, workout_templates(name)')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
    if (sessionsErr) {
      setError(sessionsErr)
      setSessions([])
      setLoading(false)
      return
    }
    const list = (sessionsData ?? []) as Array<{
      id: string
      started_at: string
      completed_at: string
      template_id: string
      scheduled_workout_id: string | null
      workout_templates: { name: string } | null
    }>
    if (list.length === 0) {
      setSessions([])
      setLoading(false)
      return
    }
    const ids = list.map((s) => s.id)
    const { data: setsData } = await supabase
      .from('session_sets')
      .select('session_id')
      .in('session_id', ids)
    const countBySession = (setsData ?? []).reduce<Record<string, number>>((acc, row: { session_id: string }) => {
      acc[row.session_id] = (acc[row.session_id] ?? 0) + 1
      return acc
    }, {})
    setSessions(
      list.map((s) => {
        const start = new Date(s.started_at).getTime()
        const end = new Date(s.completed_at).getTime()
        return {
          id: s.id,
          started_at: s.started_at,
          completed_at: s.completed_at,
          template_name: (s.workout_templates?.name as string) ?? 'Workout',
          durationSeconds: Math.round((end - start) / 1000),
          setsCount: countBySession[s.id] ?? 0,
          scheduled_workout_id: s.scheduled_workout_id ?? null,
        }
      })
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { sessions, loading, error, refetch: fetch }
}

export interface SessionSetWithExercise {
  id: string
  exercise_id: string
  set_number: number
  actual_reps: number | null
  actual_duration_seconds: number | null
  weight: number | null
  completed: boolean
  exercises: { name: string; muscle_group: string | null; type: string } | null
}

export interface SessionDetail {
  id: string
  template_name: string
  started_at: string
  completed_at: string
  durationSeconds: number
  sets: SessionSetWithExercise[]
}

export function useSessionDetail(sessionId: string | null) {
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    if (!sessionId) {
      setDetail(null)
      return
    }
    setLoading(true)
    setError(null)
    const { data: sessionData, error: sessionErr } = await supabase
      .from('workout_sessions')
      .select('id, started_at, completed_at, workout_templates(name)')
      .eq('id', sessionId)
      .single()
    if (sessionErr || !sessionData) {
      setError(sessionErr ?? new Error('Not found'))
      setDetail(null)
      setLoading(false)
      return
    }
    const { data: setsData, error: setsErr } = await supabase
      .from('session_sets')
      .select('id, exercise_id, set_number, actual_reps, actual_duration_seconds, weight, completed, exercises(name, muscle_group, type)')
      .eq('session_id', sessionId)
      .order('exercise_id')
      .order('set_number')
    if (setsErr) {
      setError(setsErr)
      setDetail(null)
      setLoading(false)
      return
    }
    const start = new Date((sessionData.started_at as string)).getTime()
    const end = new Date((sessionData.completed_at as string)).getTime()
    setDetail({
      id: sessionData.id,
      template_name: (sessionData.workout_templates as { name: string } | null)?.name ?? 'Workout',
      started_at: sessionData.started_at as string,
      completed_at: sessionData.completed_at as string,
      durationSeconds: Math.round((end - start) / 1000),
      sets: (setsData ?? []) as SessionSetWithExercise[],
    })
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { detail, loading, error }
}
