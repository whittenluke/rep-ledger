import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ScheduledWorkout {
  id: string
  scheduled_date: string
  template_id: string | null
  workout_templates: { name: string } | null
}

function monthBounds(year: number, month: number) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export function useCalendar(year: number, month: number) {
  const [scheduled, setScheduled] = useState<ScheduledWorkout[]>([])
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { start, end } = monthBounds(year, month)
    const startTs = `${start}T00:00:00.000Z`
    const endTs = `${end}T23:59:59.999Z`

    const [schedRes, sessionsRes] = await Promise.all([
      supabase
        .from('scheduled_workouts')
        .select('id, scheduled_date, template_id, workout_templates(name)')
        .gte('scheduled_date', start)
        .lte('scheduled_date', end)
        .order('scheduled_date'),
      supabase
        .from('workout_sessions')
        .select('completed_at')
        .not('completed_at', 'is', null)
        .gte('completed_at', startTs)
        .lte('completed_at', endTs),
    ])

    if (schedRes.error) {
      setError(schedRes.error)
      setScheduled([])
      setCompletedDates(new Set())
    } else {
      setScheduled((schedRes.data ?? []) as ScheduledWorkout[])
    }

    if (sessionsRes.error) {
      setCompletedDates(new Set())
    } else {
      const dates = new Set<string>()
      ;(sessionsRes.data ?? []).forEach((row: { completed_at: string }) => {
        if (row.completed_at) dates.add(row.completed_at.slice(0, 10))
      })
      setCompletedDates(dates)
    }

    setLoading(false)
  }, [year, month])

  useEffect(() => {
    fetch()
  }, [fetch])

  const createScheduled = useCallback(async (templateId: string, date: string) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Not authenticated')
    const { data, error: e } = await supabase
      .from('scheduled_workouts')
      .insert({ user_id: user.id, template_id: templateId, scheduled_date: date })
      .select('id, scheduled_date, template_id, workout_templates(name)')
      .single()
    if (e) throw e
    setScheduled((prev) => [...prev, data as ScheduledWorkout].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)))
    return data as ScheduledWorkout
  }, [])

  const removeScheduled = useCallback(async (id: string) => {
    const { error: e } = await supabase.from('scheduled_workouts').delete().eq('id', id)
    if (e) throw e
    setScheduled((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const getScheduledForDate = useCallback(
    (dateStr: string) => scheduled.find((s) => s.scheduled_date === dateStr),
    [scheduled]
  )

  return {
    scheduled,
    completedDates,
    loading,
    error,
    refetch: fetch,
    createScheduled,
    removeScheduled,
    getScheduledForDate,
  }
}
