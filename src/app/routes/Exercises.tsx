import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  useExercises,
  type Exercise,
  type ExerciseInsert,
  type ExerciseType,
  type MovementPattern,
  MOVEMENT_PATTERNS,
  EQUIPMENT_OPTIONS,
} from '@/hooks/useExercises'
import { cn } from '@/lib/utils'
import {
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_TO_PRIMARY_MUSCLES,
  type MuscleGroupLabel,
} from '@/lib/muscleGroupMapping'
import { Plus, Pencil, Trash2, Library, FilePlus, ChevronRight, ChevronDown, Dumbbell } from 'lucide-react'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

const defaultForm: ExerciseInsert = {
  name: '',
  primary_muscle: '',
  secondary_muscles: [],
  movement_pattern: 'Push',
  equipment: 'Bodyweight',
  is_bodyweight: true,
  notes: '',
  type: 'reps',
}

type FormState = ExerciseInsert & { secondary_muscles_str: string }

function formToPayload(form: FormState): ExerciseInsert {
  const secondary = form.secondary_muscles_str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return {
    name: form.name.trim(),
    primary_muscle: form.primary_muscle.trim(),
    secondary_muscles: secondary,
    movement_pattern: form.movement_pattern,
    equipment: form.equipment,
    is_bodyweight: form.is_bodyweight,
    notes: form.notes?.trim() || null,
    type: form.type ?? 'reps',
  }
}

export function Exercises() {
  const { exercises, systemExercises, loading, error, create, cloneFromSystem, update, remove } = useExercises()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addMode, setAddMode] = useState<'choice' | 'library' | 'create' | null>(null)
  const [form, setForm] = useState<FormState>({
    ...defaultForm,
    secondary_muscles_str: '',
  })
  const [libraryQuery, setLibraryQuery] = useState('')
  const [cloningId, setCloningId] = useState<string | null>(null)
  const [equipmentFilter, setEquipmentFilter] = useState<Set<string>>(() => new Set())
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<Set<MuscleGroupLabel>>(() => new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<MovementPattern>>(() => new Set())

  function openAdd() {
    setAddMode('choice')
    setForm({ ...defaultForm, secondary_muscles_str: '' })
    setLibraryQuery('')
  }

  function openFromLibrary() {
    setAddMode('library')
    setLibraryQuery('')
    setEquipmentFilter(new Set())
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

  function openCreateNew() {
    setAddMode('create')
  }

  function closeAddModal() {
    setAddMode(null)
    setCloningId(null)
  }

  function openEdit(ex: Exercise) {
    setEditingId(ex.id)
    setAddMode(null)
    setForm({
      name: ex.name,
      primary_muscle: ex.primary_muscle,
      secondary_muscles: ex.secondary_muscles ?? [],
      secondary_muscles_str: (ex.secondary_muscles ?? []).join(', '),
      movement_pattern: ex.movement_pattern,
      equipment: ex.equipment,
      is_bodyweight: ex.is_bodyweight,
      notes: ex.notes ?? '',
      type: ex.type ?? 'reps',
    })
  }

  function cancelForm() {
    setEditingId(null)
    setAddMode(null)
    setForm({ ...defaultForm, secondary_muscles_str: '' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = formToPayload(form)
    if (!payload.name || !payload.primary_muscle) return
    try {
      if (editingId) {
        await update(editingId, payload)
        cancelForm()
      } else {
        await create(payload)
        closeAddModal()
        setForm({ ...defaultForm, secondary_muscles_str: '' })
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleCloneFromSystem(systemExercise: Exercise) {
    try {
      setCloningId(systemExercise.id)
      await cloneFromSystem(systemExercise)
      closeAddModal()
    } catch (err) {
      console.error(err)
    } finally {
      setCloningId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this exercise?')) return
    try {
      await remove(id)
      if (editingId === id) cancelForm()
    } catch (err) {
      console.error(err)
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent'

  const filteredBySearch =
    libraryQuery.trim() === ''
      ? systemExercises
      : systemExercises.filter(
          (ex) =>
            ex.name.toLowerCase().includes(libraryQuery.toLowerCase()) ||
            ex.primary_muscle.toLowerCase().includes(libraryQuery.toLowerCase()) ||
            (ex.secondary_muscles ?? []).some((m) => m.toLowerCase().includes(libraryQuery.toLowerCase()))
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

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="Exercise library" />
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px]"
        >
          <Plus className="w-5 h-5" /> Add
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-500">Failed to load exercises. Try refreshing.</p>
      )}

      {/* Add flow: choice modal */}
      {addMode === 'choice' && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/60 sm:bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Add exercise"
        >
          <div
            className="w-full max-w-md bg-card border-t sm:border border-border rounded-t-2xl sm:rounded-2xl p-4 pb-8 safe-area-pb"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg font-semibold text-foreground mb-3">Add exercise</h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={openFromLibrary}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-background hover:border-accent/50 min-h-[48px] text-left"
              >
                <Library className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="font-medium">From exercise library</span>
              </button>
              <button
                type="button"
                onClick={openCreateNew}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-background hover:border-accent/50 min-h-[48px] text-left"
              >
                <FilePlus className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="font-medium">Create new</span>
              </button>
            </div>
            <button
              type="button"
              onClick={closeAddModal}
              className="mt-4 w-full py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add flow: pick from system library */}
      {addMode === 'library' && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background"
          role="dialog"
          aria-modal="true"
          aria-label="Pick from library"
        >
          <div className="p-4 border-b border-border flex flex-col gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="search"
                placeholder="Search library…"
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
                className={cn(inputClass, 'flex-1')}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setAddMode('choice')}
                className="px-3 py-2 rounded-lg border border-border min-h-[44px]"
              >
                Back
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
          <div className="flex-1 overflow-auto p-4 pb-20 safe-area-pb">
            {systemExercises.length === 0 ? (
              <EmptyState
                message="No system exercises yet"
                description="Create a new exercise to get started."
              />
            ) : groupedByPattern.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matches.</p>
            ) : (
              <div className="space-y-1">
                {groupedByPattern.map(({ pattern, exercises }) => {
                  const isExpanded = expandedGroups.has(pattern)
                  const sectionId = `library-section-${pattern}`
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
                          {pattern} ({exercises.length})
                        </span>
                      </button>
                      {isExpanded && (
                        <ul id={sectionId} className="space-y-2 pl-7 pr-0 pt-1 pb-2">
                          {exercises.map((ex) => (
                            <li key={ex.id}>
                              <button
                                type="button"
                                onClick={() => handleCloneFromSystem(ex)}
                                disabled={cloningId !== null}
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
          </div>
        </div>
      )}

      {/* Add flow: create new form (inline or in modal) */}
      {(addMode === 'create' || editingId) && (
        <form onSubmit={handleSubmit} className="mt-4 p-4 rounded-lg border border-border bg-card space-y-3">
          <input
            required
            placeholder="Exercise name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
          />
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Type</label>
            <div className="flex gap-2">
              {(['reps', 'time'] as ExerciseType[]).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    checked={form.type === t}
                    onChange={() => setForm((f) => ({ ...f, type: t }))}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-sm">{t === 'reps' ? 'Reps' : 'Time (hold)'}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Primary muscle (anatomical name)</label>
            <input
              required
              placeholder="e.g. Pectorals, Deltoids"
              value={form.primary_muscle}
              onChange={(e) => setForm((f) => ({ ...f, primary_muscle: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Secondary muscles (comma-separated)</label>
            <input
              placeholder="e.g. Deltoids, Triceps"
              value={form.secondary_muscles_str}
              onChange={(e) => setForm((f) => ({ ...f, secondary_muscles_str: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Movement pattern</label>
            <select
              value={form.movement_pattern}
              onChange={(e) => setForm((f) => ({ ...f, movement_pattern: e.target.value as Exercise['movement_pattern'] }))}
              className={inputClass}
            >
              {MOVEMENT_PATTERNS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Equipment</label>
            <select
              value={form.equipment}
              onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value as Exercise['equipment'] }))}
              className={inputClass}
            >
              {EQUIPMENT_OPTIONS.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_bodyweight}
              onChange={(e) => setForm((f) => ({ ...f, is_bodyweight: e.target.checked }))}
              className="rounded border-border text-accent focus:ring-accent"
            />
            <span className="text-sm">Bodyweight (no weight logged in session)</span>
          </label>
          <textarea
            placeholder="Notes"
            value={form.notes ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className={cn(inputClass, 'resize-none')}
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-primary-foreground font-medium">
              {editingId ? 'Save' : 'Add'}
            </button>
            <button
              type="button"
              onClick={editingId ? cancelForm : () => { closeAddModal(); setAddMode(null); setForm({ ...defaultForm, secondary_muscles_str: '' }); }}
              className="px-4 py-2 rounded-lg border border-border"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingState message="Loading exercises…" />
      ) : exercises.length === 0 ? (
        <EmptyState
          message="No exercises yet"
          description="Add from the library or create a new exercise."
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {exercises.map((ex) => (
            <li
              key={ex.id}
              className={cn(
                'flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-card',
                editingId === ex.id && 'ring-2 ring-accent'
              )}
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
                <p className="font-medium text-foreground truncate">{ex.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {[ex.primary_muscle, ex.movement_pattern, ex.type === 'time' ? 'Time' : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(ex)}
                  className="p-2 rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Edit"
                >
                  <Pencil className="w-5 h-5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ex.id)}
                  className="p-2 rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500"
                  aria-label="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
