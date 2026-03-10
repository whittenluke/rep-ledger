import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates'
import { useTemplateExercises } from '@/hooks/useTemplateExercises'
import {
  useExercises,
  MOVEMENT_PATTERNS,
  EQUIPMENT_OPTIONS,
  type MovementPattern,
  type Exercise,
} from '@/hooks/useExercises'
import {
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_TO_PRIMARY_MUSCLES,
  type MuscleGroupLabel,
} from '@/lib/muscleGroupMapping'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown, Trash2, Plus, ChevronRight, Dumbbell } from 'lucide-react'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent'

/** Per-set targets for a draft exercise (no DB id yet). */
interface DraftSet {
  set_number: number
  target_reps: number | null
  target_duration_seconds: number | null
  target_weight: number | null
}

/** Draft row when creating a new template (no id yet). */
interface DraftRow {
  exercise_id: string
  name: string
  primary_muscle: string | null
  type: 'reps' | 'time'
  equipment: string
  is_bodyweight: boolean
  target_sets: number
  target_reps: number
  target_duration_seconds: number | null
  target_weight: number | null
  sets: DraftSet[]
}

export function TemplateEdit() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isNew = id === undefined
  const { templates, loading: templatesLoading, update: updateTemplate, remove: removeTemplate, create: createTemplate } = useWorkoutTemplates()
  const { rows, loading, error: exercisesError, add, remove, reorder, addSet, removeSet, updateSet, refetch } = useTemplateExercises(isNew ? null : id ?? null)
  const { exercises, systemExercises } = useExercises()

  const template = isNew ? null : templates.find((t) => t.id === id)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [draftRows, setDraftRows] = useState<DraftRow[]>([])
  useEffect(() => {
    if (template) {
      setName(template.name)
      setNotes(template.notes ?? '')
    }
  }, [template])
  useEffect(() => {
    if (isNew) {
      setName('Untitled workout')
      setNotes('')
      setDraftRows([])
    }
  }, [isNew])

  // Backfill sets on draft rows that don't have them (e.g. from before per-set editing)
  useEffect(() => {
    if (!isNew) return
    setDraftRows((prev) => {
      const needsBackfill = prev.some((row) => !row.sets?.length)
      if (!needsBackfill) return prev
      return prev.map((row) => {
        if (row.sets?.length) return row
        const len = row.target_sets || (row.type === 'time' ? 1 : 3)
        const sets: DraftSet[] = Array.from({ length: len }, (_, i) => ({
          set_number: i + 1,
          target_reps: row.type === 'time' ? null : row.target_reps,
          target_duration_seconds: row.type === 'time' ? row.target_duration_seconds : null,
          target_weight: row.type === 'time' ? null : row.target_weight,
        }))
        return { ...row, sets }
      })
    })
  }, [isNew])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [addingSystemId, setAddingSystemId] = useState<string | null>(null)
  const [equipmentFilter, setEquipmentFilter] = useState<Set<string>>(() => new Set())
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<Set<MuscleGroupLabel>>(() => new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<MovementPattern>>(() => new Set())
  const [showSaved, setShowSaved] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const hasAutoFocusedName = useRef(false)

  useEffect(() => {
    if (id) hasAutoFocusedName.current = false
  }, [id])
  useEffect(() => {
    if (hasAutoFocusedName.current) return
    const shouldFocus = isNew || (!!template && name === 'Untitled workout' && rows.length === 0)
    if (!shouldFocus) return
    const t = setTimeout(() => {
      nameInputRef.current?.focus()
      hasAutoFocusedName.current = true
    }, 100)
    return () => clearTimeout(t)
  }, [isNew, template, name, rows.length])

  function openPicker() {
    setPickerOpen(true)
    setPickerQuery('')
    setEquipmentFilter(new Set())
    setMuscleGroupFilter(new Set())
    setExpandedGroups(new Set())
  }

  function toggleEquipment(eq: string) {
    setEquipmentFilter((prev) => {
      const next = new Set(prev)
      if (next.has(eq)) next.delete(eq)
      else next.add(eq)
      return next
    })
  }

  function toggleMuscleGroup(label: MuscleGroupLabel) {
    setMuscleGroupFilter((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  function toggleGroup(pattern: MovementPattern) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(pattern)) next.delete(pattern)
      else next.add(pattern)
      return next
    })
  }

  const allExercises: Exercise[] = [...exercises, ...systemExercises]

  const filteredBySearch =
    pickerQuery.trim() === ''
      ? allExercises
      : allExercises.filter(
          (ex) =>
            ex.name.toLowerCase().includes(pickerQuery.toLowerCase()) ||
            (ex.primary_muscle?.toLowerCase().includes(pickerQuery.toLowerCase()) ?? false) ||
            (ex.secondary_muscles ?? []).some((m) => m.toLowerCase().includes(pickerQuery.toLowerCase()))
        )

  const filteredByEquipment =
    equipmentFilter.size === 0
      ? filteredBySearch
      : filteredBySearch.filter((ex) => equipmentFilter.has(ex.equipment))

  const filteredByMuscleGroup =
    muscleGroupFilter.size === 0
      ? filteredByEquipment
      : filteredByEquipment.filter((ex) => {
          for (const label of muscleGroupFilter) {
            const muscles = new Set(MUSCLE_GROUP_TO_PRIMARY_MUSCLES[label])
            const involves =
              muscles.has(ex.primary_muscle) ||
              (ex.secondary_muscles ?? []).some((m) => muscles.has(m))
            if (!involves) return false
          }
          return true
        })

  const groupedByPattern: { pattern: MovementPattern; exercises: Exercise[] }[] = MOVEMENT_PATTERNS.map(
    (pattern) => ({
      pattern,
      exercises: filteredByMuscleGroup.filter((ex) => ex.movement_pattern === pattern),
    })
  ).filter((g) => g.exercises.length > 0)

  const saveNameAndNotes = useCallback(async () => {
    if (!id) return
    const trimmedName = name.trim() || 'Untitled workout'
    if (trimmedName !== template?.name || notes !== (template?.notes ?? '')) {
      await updateTemplate(id, { name: trimmedName, notes: notes.trim() || null })
    }
  }, [id, name, notes, template, updateTemplate])

  const handleSaveAndLeave = useCallback(async () => {
    await saveNameAndNotes()
    setShowSaved(true)
    setTimeout(() => navigate('/builder'), 1500)
  }, [saveNameAndNotes, navigate])

  const handleBackNew = useCallback(() => {
    navigate('/builder')
  }, [navigate])

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const handleDoneNew = useCallback(async () => {
    setCreating(true)
    setCreateError(null)
    let templateId: string | null = null
    try {
      const trimmedName = name.trim() || 'Untitled workout'
      const t = await createTemplate({ name: trimmedName, notes: notes.trim() || null })
      templateId = t.id
      for (let i = 0; i < draftRows.length; i++) {
        const row = draftRows[i]
        const sets = row.sets ?? []
        const targetSets = sets.length || row.target_sets || (row.type === 'time' ? 1 : 3)
        const { data: te, error: teErr } = await supabase
          .from('template_exercises')
          .insert({
            template_id: templateId,
            exercise_id: row.exercise_id,
            position: i,
            target_sets: targetSets,
            target_reps: row.target_reps,
            target_duration_seconds: row.target_duration_seconds,
            target_weight: row.target_weight,
            notes: null,
          })
          .select('id')
          .single()
        if (teErr) throw teErr
        const setList = sets.length ? sets : Array.from({ length: targetSets }, (_, s) => ({
          set_number: s + 1,
          target_reps: row.type === 'time' ? null : row.target_reps,
          target_duration_seconds: row.type === 'time' ? row.target_duration_seconds : null,
          target_weight: row.type === 'time' ? null : row.target_weight,
        }))
        for (const set of setList) {
          const { error: setErr } = await supabase.from('template_exercise_sets').insert({
            template_exercise_id: te.id,
            set_number: set.set_number,
            target_reps: set.target_reps,
            target_duration_seconds: set.target_duration_seconds,
            target_weight: set.target_weight,
          })
          if (setErr) throw setErr
        }
      }
      setShowSaved(true)
      setTimeout(() => navigate('/builder', { state: { fromCreate: true } }), 800)
    } catch (err) {
      if (templateId) {
        await supabase.from('workout_templates').delete().eq('id', templateId)
      }
      const message = err instanceof Error ? err.message : String(err)
      setCreateError(message)
      console.error(err)
    } finally {
      setCreating(false)
    }
  }, [name, notes, draftRows, createTemplate, navigate])

  const handleAddExercise = useCallback(
    async (exerciseId: string, exerciseType: 'reps' | 'time' = 'reps') => {
      if (!id) return
      await add({
        exercise_id: exerciseId,
        target_sets: 3,
        target_reps: exerciseType === 'time' ? 1 : 10,
        target_duration_seconds: exerciseType === 'time' ? 60 : null,
        target_weight: null,
        notes: null,
      })
      setPickerOpen(false)
      setPickerQuery('')
    },
    [id, add]
  )

  const handleAddFromPicker = useCallback(
    async (ex: Exercise) => {
      if (isNew) {
        const exType = (ex.type ?? 'reps') as 'reps' | 'time'
        const defaultReps = exType === 'time' ? 1 : 10
        const defaultDuration = exType === 'time' ? 60 : null
        const defaultSets: DraftSet[] = Array.from({ length: exType === 'time' ? 1 : 3 }, (_, i) => ({
          set_number: i + 1,
          target_reps: exType === 'time' ? null : defaultReps,
          target_duration_seconds: defaultDuration,
          target_weight: exType === 'time' ? null : null,
        }))
        setDraftRows((prev) => [
          ...prev,
          {
            exercise_id: ex.id,
            name: ex.name,
            primary_muscle: ex.primary_muscle ?? null,
            type: exType,
            equipment: ex.equipment,
            is_bodyweight: ex.is_bodyweight,
            target_sets: defaultSets.length,
            target_reps: defaultReps,
            target_duration_seconds: defaultDuration,
            target_weight: null,
            sets: defaultSets,
          },
        ])
        setPickerOpen(false)
        setPickerQuery('')
        return
      }
      if (!id) return
      try {
        setAddingSystemId(ex.id)
        await handleAddExercise(ex.id, ex.type ?? 'reps')
      } catch (err) {
        console.error(err)
      } finally {
        setAddingSystemId(null)
      }
    },
    [isNew, id, handleAddExercise]
  )

  const handleDeleteTemplate = useCallback(async () => {
    if (!id || !window.confirm('Delete this template? This cannot be undone.')) return
    await removeTemplate(id)
    navigate('/builder')
  }, [id, removeTemplate, navigate])

  const updateDraftSet = useCallback((rowIndex: number, setIndex: number, payload: Partial<DraftSet>) => {
    setDraftRows((prev) =>
      prev.map((row, ri) => {
        if (ri !== rowIndex || !row.sets?.length) return row
        const sets = row.sets.map((s, si) =>
          si === setIndex ? { ...s, ...payload } : s
        )
        return { ...row, sets, target_sets: sets.length }
      })
    )
  }, [])

  const addDraftSet = useCallback((rowIndex: number) => {
    setDraftRows((prev) =>
      prev.map((row, ri) => {
        if (ri !== rowIndex) return row
        const sets = row.sets ?? []
        const last = sets[sets.length - 1]
        const nextNumber = sets.length + 1
        const newSet: DraftSet = {
          set_number: nextNumber,
          target_reps: row.type === 'time' ? null : (last?.target_reps ?? row.target_reps ?? 10),
          target_duration_seconds: row.type === 'time' ? (last?.target_duration_seconds ?? row.target_duration_seconds ?? 60) : null,
          target_weight: row.type === 'time' ? null : (last?.target_weight ?? row.target_weight ?? null),
        }
        return { ...row, sets: [...sets, newSet], target_sets: sets.length + 1 }
      })
    )
  }, [])

  const removeDraftSet = useCallback((rowIndex: number, setIndex: number) => {
    setDraftRows((prev) =>
      prev.map((row, ri) => {
        if (ri !== rowIndex || !row.sets?.length) return row
        const sets = row.sets.filter((_, si) => si !== setIndex).map((s, i) => ({ ...s, set_number: i + 1 }))
        return { ...row, sets, target_sets: sets.length }
      })
    )
  }, [])

  if (!isNew && id && templatesLoading && templates.length === 0) {
    return (
      <div className="p-4 pb-20">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }
  if (!isNew && id && !template && !templatesLoading) {
    return (
      <div className="p-4 pb-20">
        <p className="text-muted-foreground">Template not found.</p>
        <button type="button" onClick={() => navigate('/builder')} className="mt-2 text-accent">
          Back to Builder
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={isNew ? handleBackNew : handleSaveAndLeave}
          disabled={showSaved}
          className="text-muted-foreground hover:text-foreground disabled:opacity-80 min-h-[44px]"
        >
          {showSaved ? (
            <span className="text-accent font-medium">Saved ✓</span>
          ) : (
            '← Back'
          )}
        </button>
        <button
          type="button"
          onClick={isNew ? handleDoneNew : handleSaveAndLeave}
          disabled={showSaved || (isNew && creating)}
          className="px-4 py-2 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px] disabled:opacity-80"
        >
          {showSaved ? 'Saved ✓' : isNew && creating ? 'Creating…' : 'Done'}
        </button>
      </div>

      {isNew && createError && (
        <p className="mt-3 text-sm text-red-500" role="alert">
          {createError}
        </p>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Name</label>
          <input
            ref={nameInputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveNameAndNotes}
            placeholder="Template name"
            className={inputClass}
          />
        </div>
        {!isNew && (
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNameAndNotes}
              placeholder="Optional notes"
              rows={2}
              className={cn(inputClass, 'resize-none')}
            />
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-display text-lg font-semibold">Exercises</span>
          <button
            type="button"
            onClick={openPicker}
            disabled={!isNew && !id}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px] disabled:opacity-50"
          >
            <Plus className="w-5 h-5" /> Add exercise
          </button>
        </div>

        {isNew ? (
          draftRows.length === 0 ? (
            <EmptyState
              message="No exercises in this template"
              description="Tap Add exercise to build your workout."
            />
          ) : (
            <ul className="space-y-2">
              {draftRows.map((r, rowIndex) => {
                const sets = r.sets ?? []
                const isBodyweight = r.is_bodyweight
                const draftEx = [...exercises, ...systemExercises].find((e) => e.id === r.exercise_id)
                const setRowInputClass = cn(
                  inputClass,
                  'min-h-[36px] py-1.5 px-2 text-sm min-w-0 border-border/80'
                )
                return (
                  <li key={`${r.exercise_id}-${rowIndex}`} className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
                      {draftEx?.image_url ? (
                        <img
                          src={draftEx.image_url}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover shrink-0 bg-muted"
                        />
                      ) : (
                        <span className="w-16 h-16 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                          <Dumbbell className="w-8 h-8 text-muted-foreground" aria-hidden />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[r.primary_muscle, r.equipment].filter(Boolean).join(' · ') || '\u00a0'}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <button
                          type="button"
                          onClick={() => setDraftRows((prev) => prev.filter((_, i) => i !== rowIndex))}
                          className="p-2 rounded hover:bg-muted min-w-[36px] min-h-[36px] flex items-center justify-center text-red-500"
                          aria-label="Remove exercise"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraftRows((prev) => {
                            const next = [...prev]
                            const [removed] = next.splice(rowIndex, 1)
                            next.splice(rowIndex - 1, 0, removed)
                            return next
                          })}
                          disabled={rowIndex === 0}
                          className="p-2 rounded hover:bg-muted min-w-[36px] min-h-[36px] flex items-center justify-center disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraftRows((prev) => {
                            const next = [...prev]
                            const [removed] = next.splice(rowIndex, 1)
                            next.splice(rowIndex + 1, 0, removed)
                            return next
                          })}
                          disabled={rowIndex === draftRows.length - 1}
                          className="p-2 rounded hover:bg-muted min-w-[36px] min-h-[36px] flex items-center justify-center disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 w-full">
                      {sets.map((set, setIndex) => (
                        <div
                          key={`set-${rowIndex}-${setIndex}`}
                          className="flex items-center gap-2 w-full py-1 min-h-[36px] border-b border-border/50 last:border-b-0"
                        >
                          <span className="text-xs text-muted-foreground shrink-0 w-9">Set {setIndex + 1}</span>
                          {r.type === 'time' ? (
                            <>
                              <input
                                type="number"
                                min={1}
                                value={set.target_duration_seconds ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value
                                  updateDraftSet(rowIndex, setIndex, {
                                    target_duration_seconds: v === '' ? null : parseInt(v, 10) || 0,
                                  })
                                }}
                                placeholder="sec"
                                className={cn(setRowInputClass, 'flex-1 min-w-0')}
                                inputMode="numeric"
                                aria-label="Target time (sec)"
                              />
                              <span className="text-xs text-muted-foreground shrink-0">sec</span>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <input
                                type="number"
                                min={1}
                                value={set.target_reps ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value
                                  updateDraftSet(rowIndex, setIndex, {
                                    target_reps: v === '' ? null : parseInt(v, 10) || 0,
                                  })
                                }}
                                placeholder="reps"
                                className={cn(setRowInputClass, 'flex-[25] min-w-0')}
                                inputMode="numeric"
                                aria-label="Reps"
                              />
                              <span className="text-xs text-muted-foreground shrink-0">reps</span>
                              {!isBodyweight && (
                                <>
                                  <span className="text-xs text-muted-foreground shrink-0">×</span>
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={set.target_weight ?? ''}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      updateDraftSet(rowIndex, setIndex, {
                                        target_weight: v === '' ? null : parseFloat(v) || 0,
                                      })
                                    }}
                                    placeholder="lbs"
                                    className={cn(setRowInputClass, 'flex-[40] min-w-0')}
                                    inputMode="decimal"
                                    aria-label="Weight (lbs)"
                                  />
                                </>
                              )}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeDraftSet(rowIndex, setIndex)}
                            disabled={sets.length <= 1}
                            className="p-1.5 rounded hover:bg-muted text-red-500 disabled:opacity-30 min-w-[32px] min-h-[32px] flex items-center justify-center shrink-0"
                            aria-label={`Remove set ${setIndex + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addDraftSet(rowIndex)}
                        className="mt-1.5 text-sm text-accent hover:underline py-1"
                      >
                        + Add set
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )
        ) : exercisesError ? (
          <ErrorState
            message="Couldn't load exercises"
            description="Check your connection and try again."
            action={
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2.5 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px]"
              >
                Try again
              </button>
            }
          />
        ) : loading ? (
          <LoadingState message="Loading exercises…" />
        ) : rows.length === 0 ? (
          <EmptyState
            message="No exercises in this template"
            description="Tap Add exercise to build your workout."
          />
        ) : (
          <ul className="space-y-2">
            {rows.map((r, index) => (
              <li key={r.id} className="rounded-lg border border-border bg-card overflow-hidden">
                {/* Exercise header: thumbnail, name, muscle, reorder/delete — one row */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
                  {r.exercises?.image_url ? (
                    <img
                      src={r.exercises.image_url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0 bg-muted"
                    />
                  ) : (
                    <span className="w-16 h-16 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                      <Dumbbell className="w-8 h-8 text-muted-foreground" aria-hidden />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{r.exercises?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[r.exercises?.primary_muscle, r.exercises?.equipment].filter(Boolean).join(' · ') || '\u00a0'}
                    </p>
                  </div>
                  <div className="flex items-center shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="p-2 rounded hover:bg-muted min-w-[36px] min-h-[36px] flex items-center justify-center text-red-500"
                      aria-label="Remove exercise"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => reorder(index, index - 1)}
                      disabled={index === 0}
                      className="p-2 rounded hover:bg-muted min-w-[36px] min-h-[36px] flex items-center justify-center disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => reorder(index, index + 1)}
                      disabled={index === rows.length - 1}
                      className="p-2 rounded hover:bg-muted min-w-[36px] min-h-[36px] flex items-center justify-center disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Sets as tight table rows — edge to edge, proportional flex inputs */}
                <div className="px-3 py-1.5 w-full">
                  {(() => {
                    const sets = r.sets ?? []
                    const hasRealSets = sets.length > 0
                    const virtualCount = !hasRealSets && (r.target_sets ?? 0) > 0 ? r.target_sets : 0
                    const displaySets = hasRealSets
                      ? sets
                      : Array.from({ length: virtualCount }, (_, i) => ({
                          id: `virtual-${r.id}-${i}`,
                          set_number: i + 1,
                          target_reps: r.target_reps ?? null,
                          target_duration_seconds: r.target_duration_seconds ?? null,
                          target_weight: r.target_weight ?? null,
                          _virtual: true as const,
                        }))
                    const isBodyweight = r.exercises?.is_bodyweight === true
                    const setRowInputClass = cn(
                      inputClass,
                      'min-h-[36px] py-1.5 px-2 text-sm min-w-0 border-border/80'
                    )
                    return (
                      <>
                        {displaySets.map((set, setIndex) => {
                          const isVirtual = '_virtual' in set && set._virtual
                          return (
                            <div
                              key={set.id}
                              className="flex items-center gap-2 w-full py-1 min-h-[36px] border-b border-border/50 last:border-b-0"
                            >
                              <span className="text-xs text-muted-foreground shrink-0 w-9">Set {setIndex + 1}</span>
                              {r.exercises?.type === 'time' ? (
                                <>
                                  {isVirtual ? (
                                    <span className="text-sm text-muted-foreground">
                                      {set.target_duration_seconds ?? '—'}s
                                    </span>
                                  ) : (
                                    <>
                                      <input
                                        type="number"
                                        min={1}
                                        value={set.target_duration_seconds ?? ''}
                                        onChange={(e) => {
                                          const v = e.target.value
                                          updateSet(set.id, {
                                            target_duration_seconds: v === '' ? null : parseInt(v, 10) || 0,
                                          })
                                        }}
                                        placeholder="sec"
                                        className={cn(setRowInputClass, 'flex-1 min-w-0')}
                                        inputMode="numeric"
                                        aria-label="Target time (sec)"
                                      />
                                      <span className="text-xs text-muted-foreground shrink-0">sec</span>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  {isVirtual ? (
                                    <span className="text-sm text-muted-foreground truncate min-w-0">
                                      {set.target_reps ?? '—'} reps
                                      {!isBodyweight && (
                                        <> × {set.target_weight != null && set.target_weight > 0 ? set.target_weight : '—'} lbs</>
                                      )}
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <input
                                        type="number"
                                        min={1}
                                        value={set.target_reps ?? ''}
                                        onChange={(e) => {
                                          const v = e.target.value
                                          updateSet(set.id, {
                                            target_reps: v === '' ? null : parseInt(v, 10) || 0,
                                          })
                                        }}
                                        placeholder="reps"
                                        className={cn(setRowInputClass, 'flex-[25] min-w-0')}
                                        inputMode="numeric"
                                        aria-label="Reps"
                                      />
                                      <span className="text-xs text-muted-foreground shrink-0">reps</span>
                                      {!isBodyweight && (
                                        <>
                                          <span className="text-xs text-muted-foreground shrink-0">×</span>
                                          <input
                                            type="number"
                                            min={0}
                                            step={0.5}
                                            value={set.target_weight ?? ''}
                                            onChange={(e) => {
                                              const v = e.target.value
                                              updateSet(set.id, {
                                                target_weight: v === '' ? null : parseFloat(v) || 0,
                                              })
                                            }}
                                            placeholder="lbs"
                                            className={cn(setRowInputClass, 'flex-[40] min-w-0')}
                                            inputMode="decimal"
                                            aria-label="Weight (lbs)"
                                          />
                                        </>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                              {!isVirtual && (
                                <button
                                  type="button"
                                  onClick={() => removeSet(set.id, r.id)}
                                  disabled={(r.sets?.length ?? 0) <= 1}
                                  className="p-1.5 rounded hover:bg-muted text-red-500 disabled:opacity-30 min-w-[32px] min-h-[32px] flex items-center justify-center shrink-0"
                                  aria-label={`Remove set ${setIndex + 1}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )
                        })}
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await addSet(r.id)
                            } catch (err) {
                              console.error(err)
                              await refetch()
                            }
                          }}
                          className="mt-1.5 text-sm text-accent hover:underline py-1"
                        >
                          + Add set
                        </button>
                      </>
                    )
                  })()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {id && (() => {
        const hasCustomName = name.trim() !== '' && name.trim() !== 'Untitled workout'
        const hasExercises = rows.length > 0
        const showDelete = hasCustomName && hasExercises
        return showDelete ? (
          <div className="mt-8 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleDeleteTemplate}
              className="text-sm text-red-500 hover:underline"
            >
              Delete template
            </button>
          </div>
        ) : null
      })()}

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background" role="dialog" aria-modal="true" aria-label="Add exercise">
          <div className="p-4 border-b border-border flex flex-col gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="search"
                placeholder="Search exercises…"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                className={cn(inputClass, 'flex-1')}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="px-3 py-2 rounded-lg border border-border min-h-[44px]"
              >
                Done
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleEquipment(eq)}
                  className={cn(
                    'shrink-0 px-3 py-2 rounded-lg border text-sm font-medium min-h-[44px] transition-colors',
                    equipmentFilter.has(eq)
                      ? 'bg-accent text-primary-foreground border-accent'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent/50'
                  )}
                >
                  {eq}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {MUSCLE_GROUP_LABELS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleMuscleGroup(label)}
                  className={cn(
                    'shrink-0 px-3 py-2 rounded-lg border text-sm font-medium min-h-[44px] transition-colors',
                    muscleGroupFilter.has(label)
                      ? 'bg-accent text-primary-foreground border-accent'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent/50'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 pb-20 safe-area-pb space-y-4">
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Exercises</h3>
              {allExercises.length === 0 ? (
                <p className="text-muted-foreground text-sm">No exercises yet. Create one in My Exercises first.</p>
              ) : groupedByPattern.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matches.</p>
              ) : (
                <div className="space-y-1">
                  {groupedByPattern.map(({ pattern, exercises: patternExercises }) => {
                    const isExpanded = expandedGroups.has(pattern)
                    const sectionId = `template-picker-${pattern}`
                    return (
                      <div key={pattern} role="region" aria-labelledby={`${sectionId}-heading`}>
                        <button
                          type="button"
                          id={`${sectionId}-heading`}
                          aria-expanded={isExpanded}
                          aria-controls={sectionId}
                          onClick={() => toggleGroup(pattern)}
                          className="w-full flex items-center gap-2 py-3 px-2 rounded-lg hover:bg-muted/50 min-h-[44px] text-left"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden />
                          )}
                          <span className="font-display font-semibold text-foreground">
                            {pattern} ({patternExercises.length})
                          </span>
                        </button>
                        {isExpanded && (
                          <ul id={sectionId} className="space-y-2 pl-7 pr-0 pt-1 pb-2">
                            {patternExercises.map((ex) => {
                              const isUserExercise = ex.user_id != null
                              return (
                                <li key={ex.id}>
                                  <button
                                    type="button"
                                    onClick={() => handleAddFromPicker(ex)}
                                    disabled={addingSystemId !== null}
                                    className="w-full text-left p-3 rounded-lg border border-border bg-card hover:border-accent/50 min-h-[44px] disabled:opacity-50 flex items-center gap-3"
                                  >
                                    {ex.image_url ? (
                                      <img
                                        src={ex.image_url}
                                        alt=""
                                        className="w-20 h-20 rounded-lg object-cover shrink-0 bg-muted"
                                      />
                                    ) : (
                                      <span className="w-20 h-20 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                                        <Dumbbell className="w-8 h-8 text-muted-foreground" aria-hidden />
                                      </span>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium text-foreground">{ex.name}</p>
                                        <span
                                          className={cn(
                                            'text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded',
                                            isUserExercise
                                              ? 'bg-accent/20 text-accent'
                                              : 'bg-muted text-muted-foreground'
                                          )}
                                        >
                                          {isUserExercise ? 'My' : 'System'}
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {ex.primary_muscle}
                                        {ex.movement_pattern ? ` · ${ex.movement_pattern}` : ''}
                                        {ex.equipment ? ` · ${ex.equipment}` : ''}
                                      </p>
                                      {addingSystemId === ex.id && (
                                        <p className="text-xs text-muted-foreground mt-1">Adding…</p>
                                      )}
                                    </div>
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
