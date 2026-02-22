import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type ExerciseType = 'reps' | 'time'

export interface Exercise {
  id: string
  user_id: string
  name: string
  muscle_group: string | null
  notes: string | null
  type?: ExerciseType
  created_at: string
}

export interface ExerciseInsert {
  name: string
  muscle_group?: string | null
  notes?: string | null
  type?: ExerciseType
}

export interface ExerciseUpdate {
  name?: string
  muscle_group?: string | null
  notes?: string | null
  type?: ExerciseType
}

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase
      .from('exercises')
      .select('id, user_id, name, muscle_group, notes, type, created_at')
      .order('name')
    if (e) {
      setError(e)
      setExercises([])
    } else {
      setExercises((data ?? []) as Exercise[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const create = useCallback(
    async (payload: ExerciseInsert) => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')
      const { data, error: e } = await supabase
        .from('exercises')
        .insert({ ...payload, type: payload.type ?? 'reps', user_id: user.id })
        .select('id, user_id, name, muscle_group, notes, type, created_at')
        .single()
      if (e) throw e
      setExercises((prev) => [...prev, data as Exercise].sort((a, b) => a.name.localeCompare(b.name)))
      return data as Exercise
    },
    []
  )

  const update = useCallback(async (id: string, payload: ExerciseUpdate) => {
    const { data, error: e } = await supabase
      .from('exercises')
      .update(payload)
      .eq('id', id)
      .select('id, user_id, name, muscle_group, notes, type, created_at')
      .single()
    if (e) throw e
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? (data as Exercise) : ex)).sort((a, b) => a.name.localeCompare(b.name))
    )
    return data as Exercise
  }, [])

  const remove = useCallback(async (id: string) => {
    const { error: e } = await supabase.from('exercises').delete().eq('id', id)
    if (e) throw e
    setExercises((prev) => prev.filter((ex) => ex.id !== id))
  }, [])

  return { exercises, loading, error, refetch: fetch, create, update, remove }
}
