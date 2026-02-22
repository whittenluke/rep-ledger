import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface TemplateExerciseRow {
  id: string
  template_id: string
  exercise_id: string
  position: number
  target_sets: number
  target_reps: number
  target_duration_seconds: number | null
  target_weight: number | null
  notes: string | null
  exercises: { name: string; muscle_group: string | null; type: 'reps' | 'time' } | null
}

export interface TemplateExerciseInsert {
  exercise_id: string
  position: number
  target_sets: number
  target_reps: number
  target_duration_seconds?: number | null
  target_weight?: number | null
  notes?: string | null
}

export interface TemplateExerciseUpdate {
  target_sets?: number
  target_reps?: number
  target_duration_seconds?: number | null
  target_weight?: number | null
  notes?: string | null
  position?: number
}

export function useTemplateExercises(templateId: string | null) {
  const [rows, setRows] = useState<TemplateExerciseRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    if (!templateId) {
      setRows([])
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase
      .from('template_exercises')
      .select('id, template_id, exercise_id, position, target_sets, target_reps, target_duration_seconds, target_weight, notes, exercises(name, muscle_group, type)')
      .eq('template_id', templateId)
      .order('position')
    if (e) {
      setError(e)
      setRows([])
    } else {
      setRows((data ?? []) as TemplateExerciseRow[])
    }
    setLoading(false)
  }, [templateId])

  useEffect(() => {
    fetch()
  }, [fetch])

  const add = useCallback(
    async (payload: Omit<TemplateExerciseInsert, 'position'>) => {
      if (!templateId) throw new Error('No template')
      const position = rows.length
      const { data, error: e } = await supabase
        .from('template_exercises')
        .insert({ ...payload, template_id: templateId, position, target_duration_seconds: payload.target_duration_seconds ?? null })
        .select('id, template_id, exercise_id, position, target_sets, target_reps, target_duration_seconds, target_weight, notes, exercises(name, muscle_group, type)')
        .single()
      if (e) throw e
      setRows((prev) => [...prev, data as TemplateExerciseRow].sort((a, b) => a.position - b.position))
      return data as TemplateExerciseRow
    },
    [templateId, rows.length]
  )

  const update = useCallback(async (id: string, payload: TemplateExerciseUpdate) => {
    const { data, error: e } = await supabase
      .from('template_exercises')
      .update(payload)
      .eq('id', id)
      .select('id, template_id, exercise_id, position, target_sets, target_reps, target_duration_seconds, target_weight, notes, exercises(name, muscle_group, type)')
      .single()
    if (e) throw e
    setRows((prev) =>
      prev.map((r) => (r.id === id ? (data as TemplateExerciseRow) : r)).sort((a, b) => a.position - b.position)
    )
    return data as TemplateExerciseRow
  }, [])

  const remove = useCallback(async (id: string) => {
    const { error: e } = await supabase.from('template_exercises').delete().eq('id', id)
    if (e) throw e
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id)
      return next.map((r, i) => ({ ...r, position: i }))
    })
  }, [])

  const reorder = useCallback(async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    const reordered = [...rows]
    const [removed] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, removed)
    setRows(reordered.map((r, i) => ({ ...r, position: i })))
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from('template_exercises').update({ position: i }).eq('id', reordered[i].id)
    }
  }, [rows])

  return { rows, loading, error, refetch: fetch, add, update, remove, reorder }
}
