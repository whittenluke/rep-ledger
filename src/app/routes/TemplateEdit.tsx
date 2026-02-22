import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates'
import { useTemplateExercises } from '@/hooks/useTemplateExercises'
import { useExercises } from '@/hooks/useExercises'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent'

export function TemplateEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { templates, loading: templatesLoading, update: updateTemplate, remove: removeTemplate } = useWorkoutTemplates()
  const { rows, loading, add, update, remove, reorder } = useTemplateExercises(id ?? null)
  const { exercises } = useExercises()

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

  const filteredExercises = exercises.filter(
    (ex) =>
      !rows.some((r) => r.exercise_id === ex.id) &&
      (pickerQuery.trim() === '' ||
        ex.name.toLowerCase().includes(pickerQuery.toLowerCase()) ||
        (ex.primary_muscle?.toLowerCase().includes(pickerQuery.toLowerCase()) ?? false) ||
        (ex.secondary_muscles ?? []).some((m) => m.toLowerCase().includes(pickerQuery.toLowerCase())))
  )

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
            onClick={() => setPickerOpen(true)}
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
                className="p-3 rounded-lg border border-border bg-card flex flex-col gap-2"
              >
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
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <label className="block text-muted-foreground text-xs">Sets</label>
                    <input
                      type="number"
                      min={1}
                      value={r.target_sets}
                      onChange={(e) =>
                        update(r.id, { target_sets: parseInt(e.target.value, 10) || 1 })
                      }
                      className={cn(inputClass, 'py-1.5')}
                    />
                  </div>
                  {r.exercises?.type === 'time' ? (
                    <div className="col-span-2">
                      <label className="block text-muted-foreground text-xs">Target time (sec)</label>
                      <input
                        type="number"
                        min={1}
                        value={r.target_duration_seconds ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          update(r.id, { target_duration_seconds: v === '' ? null : parseInt(v, 10) || 0 })
                        }}
                        placeholder="e.g. 60"
                        className={cn(inputClass, 'py-1.5')}
                        inputMode="numeric"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-muted-foreground text-xs">Reps</label>
                        <input
                          type="number"
                          min={1}
                          value={r.target_reps}
                          onChange={(e) =>
                            update(r.id, { target_reps: parseInt(e.target.value, 10) || 1 })
                          }
                          className={cn(inputClass, 'py-1.5')}
                          inputMode="numeric"
                        />
                      </div>
                      <div>
                        <label className="block text-muted-foreground text-xs">Weight</label>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={r.target_weight ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            update(r.id, { target_weight: v === '' ? null : parseFloat(v) || 0 })
                          }}
                          placeholder="-"
                          className={cn(inputClass, 'py-1.5')}
                          inputMode="decimal"
                        />
                      </div>
                    </>
                  )}
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
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="p-4 border-b border-border flex items-center gap-2">
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
              className="px-3 py-2 rounded-lg border border-border"
            >
              Done
            </button>
          </div>
          <ul className="flex-1 overflow-auto p-4 space-y-2">
            {filteredExercises.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {exercises.length === 0
                  ? 'Add exercises in the Exercise library first.'
                  : pickerQuery.trim()
                    ? 'No matching exercises.'
                    : 'All your exercises are already in this template.'}
              </p>
            ) : (
              filteredExercises.map((ex) => (
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
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
