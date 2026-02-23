import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type ExerciseType = 'reps' | 'time'

export const MOVEMENT_PATTERNS = ['Push', 'Pull', 'Hinge', 'Squat', 'Carry', 'Core', 'Cardio'] as const
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number]

export const EQUIPMENT_OPTIONS = [
  'Barbell',
  'Dumbbell',
  'Cable',
  'Machine',
  'Bodyweight',
  'Kettlebell',
  'Resistance Band',
] as const
export type Equipment = (typeof EQUIPMENT_OPTIONS)[number]

export interface Exercise {
  id: string
  user_id: string | null
  name: string
  primary_muscle: string
  secondary_muscles: string[]
  movement_pattern: MovementPattern
  equipment: Equipment
  is_bodyweight: boolean
  notes: string | null
  type: ExerciseType
  image_url: string | null
  created_at: string
}

export interface ExerciseInsert {
  name: string
  primary_muscle: string
  secondary_muscles?: string[]
  movement_pattern: MovementPattern
  equipment: Equipment
  is_bodyweight: boolean
  notes?: string | null
  type?: ExerciseType
}

export interface ExerciseUpdate {
  name?: string
  primary_muscle?: string
  secondary_muscles?: string[]
  movement_pattern?: MovementPattern
  equipment?: Equipment
  is_bodyweight?: boolean
  notes?: string | null
  type?: ExerciseType
}

const exerciseColumns =
  'id, user_id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, is_bodyweight, notes, type, image_url, created_at'

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [systemExercises, setSystemExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase
      .from('exercises')
      .select(exerciseColumns)
      .order('name')
    if (e) {
      setError(e)
      setExercises([])
      setSystemExercises([])
    } else {
      const list = (data ?? []) as Exercise[]
      setExercises(list.filter((ex) => ex.user_id != null))
      setSystemExercises(list.filter((ex) => ex.user_id == null))
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
      const row = {
        user_id: user.id,
        name: payload.name.trim(),
        primary_muscle: payload.primary_muscle.trim(),
        secondary_muscles: payload.secondary_muscles ?? [],
        movement_pattern: payload.movement_pattern,
        equipment: payload.equipment,
        is_bodyweight: payload.is_bodyweight,
        notes: payload.notes?.trim() || null,
        type: payload.type ?? 'reps',
      }
      const { data, error: e } = await supabase
        .from('exercises')
        .insert(row)
        .select(exerciseColumns)
        .single()
      if (e) throw e
      setExercises((prev) => [...prev, data as Exercise].sort((a, b) => a.name.localeCompare(b.name)))
      return data as Exercise
    },
    []
  )

  const update = useCallback(async (id: string, payload: ExerciseUpdate) => {
    const updates: Record<string, unknown> = { ...payload }
    if (payload.secondary_muscles !== undefined) updates.secondary_muscles = payload.secondary_muscles
    const { data, error: e } = await supabase
      .from('exercises')
      .update(updates)
      .eq('id', id)
      .select(exerciseColumns)
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

  return {
    exercises,
    systemExercises,
    loading,
    error,
    refetch: fetch,
    create,
    update,
    remove,
  }
}
