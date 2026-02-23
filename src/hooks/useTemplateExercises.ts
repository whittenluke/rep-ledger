import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface TemplateExerciseSetRow {
  id: string
  template_exercise_id: string
  set_number: number
  target_reps: number | null
  target_duration_seconds: number | null
  target_weight: number | null
}

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
  exercises: { name: string; primary_muscle: string | null; type: 'reps' | 'time'; image_url: string | null; is_bodyweight: boolean; equipment: string } | null
  sets: TemplateExerciseSetRow[]
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
    const { data: teData, error: e } = await supabase
      .from('template_exercises')
      .select('id, template_id, exercise_id, position, target_sets, target_reps, target_duration_seconds, target_weight, notes, exercises(name, primary_muscle, type, image_url, is_bodyweight, equipment)')
      .eq('template_id', templateId)
      .order('position')
    if (e) {
      setError(e)
      setRows([])
      setLoading(false)
      return
    }
    const teRows = (teData ?? []) as Omit<TemplateExerciseRow, 'sets'>[]
    const teIds = teRows.map((r) => r.id)
    let allSets: TemplateExerciseSetRow[] = []
    const { data: setData, error: setQueryError } = await supabase
      .from('template_exercise_sets')
      .select('id, template_exercise_id, set_number, target_reps, target_duration_seconds, target_weight')
      .in('template_exercise_id', teIds.length ? teIds : ['00000000-0000-0000-0000-000000000000'])
      .order('set_number')
    if (!setQueryError) allSets = (setData ?? []) as TemplateExerciseSetRow[]
    const setsByTeId = new Map<string, TemplateExerciseSetRow[]>()
    for (const s of allSets) {
      const list = setsByTeId.get(s.template_exercise_id) ?? []
      list.push(s)
      setsByTeId.set(s.template_exercise_id, list)
    }
    let needBackfill = false
    for (const row of teRows) {
      const sets = setsByTeId.get(row.id) ?? []
      if (sets.length === 0 && row.target_sets > 0) {
        needBackfill = true
        break
      }
    }
    if (needBackfill) {
      try {
        for (const row of teRows) {
          const sets = setsByTeId.get(row.id) ?? []
          if (sets.length === 0 && row.target_sets > 0) {
            const isTime = row.exercises?.type === 'time'
            for (let i = 0; i < row.target_sets; i++) {
              const { error: insErr } = await supabase.from('template_exercise_sets').insert({
                template_exercise_id: row.id,
                set_number: i + 1,
                target_reps: isTime ? null : row.target_reps,
                target_duration_seconds: isTime ? row.target_duration_seconds : null,
                target_weight: isTime ? null : row.target_weight,
              })
              if (insErr) break
            }
          }
        }
        const { data: setData2, error: setQueryError2 } = await supabase
          .from('template_exercise_sets')
          .select('id, template_exercise_id, set_number, target_reps, target_duration_seconds, target_weight')
          .in('template_exercise_id', teIds)
          .order('set_number')
        if (!setQueryError2 && setData2?.length) {
          const allSets2 = setData2 as TemplateExerciseSetRow[]
          setsByTeId.clear()
          for (const s of allSets2) {
            const list = setsByTeId.get(s.template_exercise_id) ?? []
            list.push(s)
            setsByTeId.set(s.template_exercise_id, list)
          }
        }
      } catch {
        /* backfill failed (e.g. table missing); leave setsByTeId as-is so rows get empty or partial sets */
      }
    }
    const rowsWithSets: TemplateExerciseRow[] = teRows.map((r) => ({
      ...r,
      sets: (setsByTeId.get(r.id) ?? []).sort((a, b) => a.set_number - b.set_number),
    }))
    setRows(rowsWithSets)
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
        .select('id, template_id, exercise_id, position, target_sets, target_reps, target_duration_seconds, target_weight, notes, exercises(name, primary_muscle, type, image_url, is_bodyweight, equipment)')
        .single()
      if (e) throw e
      const row = data as TemplateExerciseRow
      const isTime = payload.target_duration_seconds != null
      const numSets = row.target_sets || 3
      const newSetRows: TemplateExerciseSetRow[] = []
      try {
        for (let i = 0; i < numSets; i++) {
          const { data: setRow, error: setErr } = await supabase
            .from('template_exercise_sets')
            .insert({
              template_exercise_id: row.id,
              set_number: i + 1,
              target_reps: isTime ? null : (row.target_reps ?? 10),
              target_duration_seconds: isTime ? (row.target_duration_seconds ?? 60) : null,
              target_weight: isTime ? null : row.target_weight,
            })
            .select('id, template_exercise_id, set_number, target_reps, target_duration_seconds, target_weight')
            .single()
          if (!setErr && setRow) newSetRows.push(setRow as TemplateExerciseSetRow)
        }
      } catch {
        /* table may not exist yet; add row with empty sets so picker closes and exercise appears */
      }
      const rowWithSets: TemplateExerciseRow = { ...row, sets: newSetRows }
      setRows((prev) => [...prev, rowWithSets].sort((a, b) => a.position - b.position))
      return rowWithSets
    },
    [templateId, rows.length]
  )

  const update = useCallback(async (id: string, payload: TemplateExerciseUpdate) => {
    const { data, error: e } = await supabase
      .from('template_exercises')
      .update(payload)
      .eq('id', id)
      .select('id, template_id, exercise_id, position, target_sets, target_reps, target_duration_seconds, target_weight, notes, exercises(name, primary_muscle, type, image_url, is_bodyweight, equipment)')
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

  const backfillSetsForRow = useCallback(
    async (templateExerciseId: string) => {
      const row = rows.find((r) => r.id === templateExerciseId)
      if (!row || row.sets.length > 0 || row.target_sets <= 0) return
      const isTime = row.exercises?.type === 'time'
      for (let i = 0; i < row.target_sets; i++) {
        const { error: insErr } = await supabase.from('template_exercise_sets').insert({
          template_exercise_id: templateExerciseId,
          set_number: i + 1,
          target_reps: isTime ? null : row.target_reps,
          target_duration_seconds: isTime ? row.target_duration_seconds : null,
          target_weight: isTime ? null : row.target_weight,
        })
        if (insErr) throw insErr
      }
      await fetch()
    },
    [rows, fetch]
  )

  const addSet = useCallback(
    async (templateExerciseId: string) => {
      const row = rows.find((r) => r.id === templateExerciseId)
      if (!row) return
      if (row.sets.length === 0 && row.target_sets > 0) {
        await backfillSetsForRow(templateExerciseId)
        return
      }
      const nextSetNumber = row.sets.length + 1
      const lastSet = row.sets[row.sets.length - 1]
      const isTime = row.exercises?.type === 'time'
      const { data: inserted, error: e } = await supabase
        .from('template_exercise_sets')
        .insert({
          template_exercise_id: templateExerciseId,
          set_number: nextSetNumber,
          target_reps: isTime ? null : (lastSet?.target_reps ?? row.target_reps ?? 10),
          target_duration_seconds: isTime ? (lastSet?.target_duration_seconds ?? row.target_duration_seconds ?? 60) : null,
          target_weight: isTime ? null : (lastSet?.target_weight ?? row.target_weight),
        })
        .select('id, template_exercise_id, set_number, target_reps, target_duration_seconds, target_weight')
        .single()
      if (e) throw e
      const newSet = inserted as TemplateExerciseSetRow
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== templateExerciseId) return r
          return {
            ...r,
            sets: [...r.sets, newSet].sort((a, b) => a.set_number - b.set_number),
            target_sets: r.target_sets + 1,
          }
        })
      )
      await supabase.from('template_exercises').update({ target_sets: row.target_sets + 1 }).eq('id', templateExerciseId)
    },
    [rows, backfillSetsForRow]
  )

  const removeSet = useCallback(async (templateExerciseSetId: string, templateExerciseId: string) => {
    const { error: e } = await supabase.from('template_exercise_sets').delete().eq('id', templateExerciseSetId)
    if (e) throw e
    const row = rows.find((r) => r.id === templateExerciseId)
    if (!row) return
    const newSets = row.sets.filter((s) => s.id !== templateExerciseSetId)
    const renumbered = newSets.map((s, i) => ({ ...s, set_number: i + 1 }))
    for (let i = 0; i < renumbered.length; i++) {
      await supabase.from('template_exercise_sets').update({ set_number: i + 1 }).eq('id', renumbered[i].id)
    }
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== templateExerciseId) return r
        return { ...r, sets: renumbered, target_sets: Math.max(0, r.target_sets - 1) }
      })
    )
    await supabase.from('template_exercises').update({ target_sets: Math.max(0, row.target_sets - 1) }).eq('id', templateExerciseId)
  }, [rows])

  const updateSet = useCallback(
    async (
      templateExerciseSetId: string,
      payload: {
        target_reps?: number | null
        target_duration_seconds?: number | null
        target_weight?: number | null
      }
    ) => {
      const { data, error: e } = await supabase
        .from('template_exercise_sets')
        .update(payload)
        .eq('id', templateExerciseSetId)
        .select('id, template_exercise_id, set_number, target_reps, target_duration_seconds, target_weight')
        .single()
      if (e) throw e
      const updated = data as TemplateExerciseSetRow
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== updated.template_exercise_id) return r
          return {
            ...r,
            sets: r.sets.map((s) => (s.id === templateExerciseSetId ? updated : s)),
          }
        })
      )
    },
    []
  )

  return { rows, loading, error, refetch: fetch, add, update, remove, reorder, addSet, removeSet, updateSet }
}
