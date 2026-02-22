import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface SessionRow {
  id: string
  completed_at: string
  template_id: string | null
}

export interface SetRow {
  session_id: string
  exercise_id: string
  actual_reps: number | null
  weight: number | null
}

const MS_PER_DAY = 86400000

/** YYYY-MM-DD in the user's local timezone (for date bucketing and consistency). */
function toLocalDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getWeekStart(d: Date) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.getFullYear(), d.getMonth(), diff)
}

export function useProgressAnalytics() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [sets, setSets] = useState<SetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: sessionsData, error: sessionsErr } = await supabase
      .from('workout_sessions')
      .select('id, completed_at, template_id')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
    if (sessionsErr) {
      setError(sessionsErr)
      setLoading(false)
      return
    }
    const sessionList = (sessionsData ?? []) as SessionRow[]
    setSessions(sessionList)
    if (sessionList.length === 0) {
      setSets([])
      setLoading(false)
      return
    }
    const ids = sessionList.map((s) => s.id)
    const { data: setsData, error: setsErr } = await supabase
      .from('session_sets')
      .select('session_id, exercise_id, actual_reps, weight')
      .in('session_id', ids)
    if (setsErr) {
      setSets([])
    } else {
      setSets((setsData ?? []) as SetRow[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const sessionById = sessions.reduce<Record<string, SessionRow>>((acc, s) => {
    acc[s.id] = s
    return acc
  }, {})

  const workoutDays = new Set(sessions.map((s) => toLocalDateStr(new Date(s.completed_at))))

  const currentStreak = (() => {
    let count = 0
    let d = new Date()
    while (true) {
      const str = toLocalDateStr(d)
      if (workoutDays.has(str)) count++
      else break
      d = new Date(d.getTime() - MS_PER_DAY)
    }
    return count
  })()

  const workoutsThisWeek = (() => {
    const weekStart = getWeekStart(new Date())
    let count = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)
      if (workoutDays.has(toLocalDateStr(d))) count++
    }
    return count
  })()

  const weeklyVolume = (() => {
    const weekToVolume: Record<string, number> = {}
    sets.forEach((set) => {
      const session = sessionById[set.session_id]
      if (!session?.completed_at) return
      const vol = (set.actual_reps ?? 0) * (set.weight ?? 0)
      if (vol <= 0) return
      const weekKey = toLocalDateStr(getWeekStart(new Date(session.completed_at)))
      weekToVolume[weekKey] = (weekToVolume[weekKey] ?? 0) + vol
    })
    return Object.entries(weekToVolume)
      .map(([week, volume]) => ({ week, volume }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-16)
  })()

  const templateIds = [...new Set(sessions.map((s) => s.template_id).filter(Boolean))] as string[]

  const volumeByTemplate = useCallback(
    (templateId: string) => {
      const sessionIds = new Set(sessions.filter((s) => s.template_id === templateId).map((s) => s.id))
      const weekToVolume: Record<string, number> = {}
      sets.forEach((set) => {
        if (!sessionIds.has(set.session_id)) return
        const session = sessionById[set.session_id]
        if (!session?.completed_at) return
        const vol = (set.actual_reps ?? 0) * (set.weight ?? 0)
        if (vol <= 0) return
        const weekKey = toLocalDateStr(getWeekStart(new Date(session.completed_at)))
        weekToVolume[weekKey] = (weekToVolume[weekKey] ?? 0) + vol
      })
      return Object.entries(weekToVolume)
        .map(([week, volume]) => ({ week, volume }))
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-16)
    },
    [sessions, sets, sessionById]
  )

  return {
    workoutDays,
    currentStreak,
    workoutsThisWeek,
    weeklyVolume,
    sessions,
    sets,
    sessionById,
    templateIds,
    volumeByTemplate,
    loading,
    error,
    refetch: fetch,
  }
}

export interface ExerciseProgress {
  maxWeightByDate: { date: string; maxWeight: number }[]
  volumeByDate: { date: string; volume: number }[]
  bestSet: { weight: number; reps: number; date: string } | null
}

export function useExerciseProgress(
  exerciseId: string | null,
  sessions: SessionRow[],
  sets: SetRow[],
  sessionById: Record<string, SessionRow>
): ExerciseProgress {
  const sessionIds = new Set(sessions.map((s) => s.id))
  const exerciseSets = sets.filter((s) => s.exercise_id === exerciseId && sessionIds.has(s.session_id))
  const dateToMaxWeight: Record<string, number> = {}
  const dateToVolume: Record<string, number> = {}
  let bestSet: { weight: number; reps: number; date: string } | null = null
  exerciseSets.forEach((set) => {
    const session = sessionById[set.session_id]
    if (!session?.completed_at) return
    const dateStr = toLocalDateStr(new Date(session.completed_at))
    const w = set.weight ?? 0
    const r = set.actual_reps ?? 0
    if (w > 0) {
      dateToMaxWeight[dateStr] = Math.max(dateToMaxWeight[dateStr] ?? 0, w)
    }
    const vol = r * w
    if (vol > 0) {
      dateToVolume[dateStr] = (dateToVolume[dateStr] ?? 0) + vol
    }
    const product = w * r
    if (product > 0 && (!bestSet || product > bestSet.weight * bestSet.reps)) {
      bestSet = { weight: w, reps: r, date: dateStr }
    }
  })
  const maxWeightByDate = Object.entries(dateToMaxWeight)
    .map(([date, maxWeight]) => ({ date, maxWeight }))
    .sort((a, b) => a.date.localeCompare(b.date))
  const volumeByDate = Object.entries(dateToVolume)
    .map(([date, volume]) => ({ date, volume }))
    .sort((a, b) => a.date.localeCompare(b.date))
  return { maxWeightByDate, volumeByDate, bestSet }
}
