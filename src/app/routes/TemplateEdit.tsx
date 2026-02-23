import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
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

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent'

export function TemplateEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { templates, loading: templatesLoading, update: updateTemplate, remove: removeTemplate } = useWorkoutTemplates()
  const { rows, loading, add, remove, reorder, addSet, removeSet, updateSet, refetch } = useTemplateExercises(id ?? null)
  const { exercises, systemExercises, ensureInLibrary } = useExercises()

  const template = templates.find((t) => t.id === id)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  useEffect(() => {
    if (template) {
      setName(template.name)
      setNotes(template.notes ?? '')
    }
  }, [template])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [addingSystemId, setAddingSystemId] = useState<string | null>(null)
  const [equipmentFilter, setEquipmentFilter] = useState<Set<string>>(() => new Set())
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<Set<MuscleGroupLabel>>(() => new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<MovementPattern>>(() => new Set())

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

  const filteredExercises = exercises.filter(
    (ex) =>
      !rows.some((r) => r.exercise_id === ex.id) &&
      (pickerQuery.trim() === '' ||
        ex.name.toLowerCase().includes(pickerQuery.toLowerCase()) ||
        (ex.primary_muscle?.toLowerCase().includes(pickerQuery.toLowerCase()) ?? false) ||
        (ex.secondary_muscles ?? []).some((m) => m.toLowerCase().includes(pickerQuery.toLowerCase())))
  )

  const systemFilteredBySearch =
    pickerQuery.trim() === ''
      ? systemExercises
      : systemExercises.filter(
          (ex) =>
            ex.name.toLowerCase().includes(pickerQuery.toLowerCase()) ||
            (ex.primary_muscle?.toLowerCase().includes(pickerQuery.toLowerCase()) ?? false) ||
            (ex.secondary_muscles ?? []).some((m) => m.toLowerCase().includes(pickerQuery.toLowerCase()))
        )

  const systemFilteredByEquipment =
    equipmentFilter.size === 0
      ? systemFilteredBySearch
      : systemFilteredBySearch.filter((ex) => equipmentFilter.has(ex.equipment))

  const systemFilteredByMuscleGroup =
    muscleGroupFilter.size === 0
      ? systemFilteredByEquipment
      : systemFilteredByEquipment.filter((ex) => {
          for (const label of muscleGroupFilter) {
            const muscles = new Set(MUSCLE_GROUP_TO_PRIMARY_MUSCLES[label])
            const involves =
              muscles.has(ex.primary_muscle) ||
              (ex.secondary_muscles ?? []).some((m) => muscles.has(m))
            if (!involves) return false
          }
          return true
        })

  const systemGroupedByPattern: { pattern: MovementPattern; exercises: Exercise[] }[] = MOVEMENT_PATTERNS.map(
    (pattern) => ({
      pattern,
      exercises: systemFilteredByMuscleGroup.filter((ex) => ex.movement_pattern === pattern),
    })
  ).filter((g) => g.exercises.length > 0)

  const saveNameAndNotes = useCallback(async () => {
    if (!id) return
    const trimmedName = name.trim() || 'Untitled workout'
    if (trimmedName !== template?.name || notes !== (template?.notes ?? '')) {
      await updateTemplate(id, { name: trimmedName, notes: notes.trim() || null })
    }
  }, [id, name, notes, template, updateTemplate])

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

  const handleAddFromSystem = useCallback(
    async (systemEx: (typeof systemExercises)[number]) => {
      if (!id) return
      try {
        setAddingSystemId(systemEx.id)
        const userEx = await ensureInLibrary(systemEx)
        await handleAddExercise(userEx.id, userEx.type ?? 'reps')
      } catch (err) {
        console.error(err)
      } finally {
        setAddingSystemId(null)
      }
    },
    [id, ensureInLibrary, handleAddExercise]
  )

  const handleDeleteTemplate = useCallback(async () => {
    if (!id || !window.confirm('Delete this template? This cannot be undone.')) return
    await removeTemplate(id)
    navigate('/builder')
  }, [id, removeTemplate, navigate])

  if (id && templatesLoading && templates.length === 0) {
    return (
      <div className="p-4 pb-20">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }
  if (id && !template && !templatesLoading) {
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
        <button type="button" onClick={() => navigate('/builder')} className="text-muted-foreground hover:text-foreground">
          ← Back
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveNameAndNotes}
            placeholder="Template name"
            className={inputClass}
          />
        </div>
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
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-display text-lg font-semibold">Exercises</span>
          <button
            type="button"
            onClick={openPicker}
            disabled={!id}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px] disabled:opacity-50"
          >
            <Plus className="w-5 h-5" /> Add exercise
          </button>
        </div>

        {loading ? (
          <LoadingState message="Loading exercises…" />
        ) : rows.length === 0 ? (
          <EmptyState
            message="No exercises in this template"
            description="Tap Add exercise to build your workout."
          />
        ) : (
          <ul className="space-y-2">
            {rows.map((r, index) => (
              <li
                key={r.id}
                className="rounded-lg border border-border bg-card overflow-hidden flex flex-row min-h-[140px]"
              >
                <div className="w-28 shrink-0 self-stretch flex flex-col bg-muted">
                  {r.exercises?.image_url ? (
                    <img
                      src={r.exercises.image_url}
                      alt=""
                      className="w-full h-full min-h-[140px] object-cover"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[140px] flex items-center justify-center">
                      <Dumbbell className="w-10 h-10 text-muted-foreground" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {r.exercises?.name ?? 'Unknown'}
                      </p>
                      {r.exercises?.primary_muscle && (
                        <p className="text-sm text-muted-foreground">{r.exercises.primary_muscle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => reorder(index, index - 1)}
                        disabled={index === 0}
                        className="p-2 rounded hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ChevronUp className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => reorder(index, index + 1)}
                        disabled={index === rows.length - 1}
                        className="p-2 rounded hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(r.id)}
                        className="p-2 rounded hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Sets</span>
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
                        className="text-sm text-accent hover:underline min-h-[44px] flex items-center"
                      >
                        + Add set
                      </button>
                    </div>
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
                      return displaySets.map((set, setIndex) => {
                        const isVirtual = '_virtual' in set && set._virtual
                        return (
                          <div
                            key={set.id}
                            className="flex flex-wrap items-center gap-2 py-1.5 px-2 rounded bg-muted/50"
                          >
                            <span className="text-xs text-muted-foreground w-14 shrink-0">Set {setIndex + 1}</span>
                            {r.exercises?.type === 'time' ? (
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                {isVirtual ? (
                                  <span className="text-sm text-muted-foreground">
                                    {set.target_duration_seconds ?? '—'}s
                                  </span>
                                ) : (
                                  <>
                                    <label className="sr-only">Target time (sec)</label>
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
                                      className={cn(inputClass, 'py-1.5 flex-1 max-w-[100px]')}
                                      inputMode="numeric"
                                    />
                                    <span className="text-xs text-muted-foreground">sec</span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <>
                                {isVirtual ? (
                                  <span className="text-sm text-muted-foreground">
                                    {set.target_reps ?? '—'} reps × {set.target_weight != null && set.target_weight > 0 ? set.target_weight : '—'}
                                  </span>
                                ) : (
                                  <>
                                    <span className="text-xs text-muted-foreground shrink-0">reps</span>
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
                                      placeholder="—"
                                      className={cn(inputClass, 'py-1.5 w-16')}
                                      inputMode="numeric"
                                      aria-label="Target reps"
                                    />
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
                                      placeholder="weight"
                                      className={cn(inputClass, 'py-1.5 w-20')}
                                      inputMode="decimal"
                                      aria-label="Target weight"
                                    />
                                  </>
                                )}
                              </>
                            )}
                            {!isVirtual && (
                              <button
                                type="button"
                                onClick={() => removeSet(set.id, r.id)}
                                disabled={(r.sets?.length ?? 0) <= 1}
                                className="p-2 rounded hover:bg-muted text-red-500 disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                aria-label={`Remove set ${setIndex + 1}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {id && (
        <div className="mt-8 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleDeleteTemplate}
            className="text-sm text-red-500 hover:underline"
          >
            Delete template
          </button>
        </div>
      )}

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
            {filteredExercises.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Your exercises</h3>
                <ul className="space-y-2">
                  {filteredExercises.map((ex) => (
                    <li key={ex.id}>
                      <button
                        type="button"
                        onClick={() => handleAddExercise(ex.id, ex.type ?? 'reps')}
                        className="w-full text-left p-3 rounded-lg border border-border bg-card hover:border-accent/50 min-h-[44px]"
                      >
                        <p className="font-medium text-foreground">{ex.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {[ex.primary_muscle, ex.type === 'time' ? 'Time (hold)' : null].filter(Boolean).join(' · ') || '\u00a0'}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">System library</h3>
              {systemExercises.length === 0 ? (
                <p className="text-muted-foreground text-sm">No system exercises available.</p>
              ) : systemGroupedByPattern.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matches.</p>
              ) : (
                <div className="space-y-1">
                  {systemGroupedByPattern.map(({ pattern, exercises: patternExercises }) => {
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
                            {patternExercises.map((ex) => (
                              <li key={ex.id}>
                                <button
                                  type="button"
                                  onClick={() => handleAddFromSystem(ex)}
                                  disabled={addingSystemId !== null}
                                  className="w-full text-left p-3 rounded-lg border border-border bg-card hover:border-accent/50 min-h-[44px] disabled:opacity-50 flex items-center gap-3"
                                >
                                  {ex.image_url ? (
                                    <img
                                      src={ex.image_url}
                                      alt=""
                                      className="w-12 h-12 rounded-lg object-cover shrink-0 bg-muted"
                                    />
                                  ) : (
                                    <span className="w-12 h-12 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                                      <Dumbbell className="w-5 h-5 text-muted-foreground" aria-hidden />
                                    </span>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-foreground">{ex.name}</p>
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
                            ))}
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
