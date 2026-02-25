import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface WorkoutTemplate {
  id: string
  user_id: string
  name: string
  notes: string | null
  created_at: string
  template_exercises?: Array<{
    exercise_id: string
    exercises: { movement_pattern: string; primary_muscle: string; equipment: string } | null
  }>
}

export interface WorkoutTemplateInsert {
  name: string
  notes?: string | null
}

export function useWorkoutTemplates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase
      .from('workout_templates')
      .select('id, user_id, name, notes, created_at, template_exercises(exercise_id, exercises(movement_pattern, primary_muscle, equipment))')
      .order('name')
    if (e) {
      setError(e)
      setTemplates([])
    } else {
      setTemplates((data ?? []) as unknown as WorkoutTemplate[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const create = useCallback(async (payload: WorkoutTemplateInsert) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Not authenticated')
    const { data, error: e } = await supabase
      .from('workout_templates')
      .insert({ ...payload, user_id: user.id })
      .select('id, user_id, name, notes, created_at')
      .single()
    if (e) throw e
    setTemplates((prev) => [...prev, data as WorkoutTemplate].sort((a, b) => a.name.localeCompare(b.name)))
    return data as WorkoutTemplate
  }, [])

  const update = useCallback(async (id: string, payload: { name?: string; notes?: string | null }) => {
    const { data, error: e } = await supabase
      .from('workout_templates')
      .update(payload)
      .eq('id', id)
      .select('id, user_id, name, notes, created_at')
      .single()
    if (e) throw e
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? (data as WorkoutTemplate) : t)).sort((a, b) => a.name.localeCompare(b.name))
    )
    return data as WorkoutTemplate
  }, [])

  const remove = useCallback(async (id: string) => {
    // Dissociate sessions that used this template (keep history, drop template link)
    await supabase.from('workout_sessions').update({ template_id: null }).eq('template_id', id)
    // Remove any scheduled calendar entries that use this template
    await supabase.from('scheduled_workouts').delete().eq('template_id', id)
    const { error: e } = await supabase.from('workout_templates').delete().eq('id', id)
    if (e) throw e
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { templates, loading, error, refetch: fetch, create, update, remove }
}
