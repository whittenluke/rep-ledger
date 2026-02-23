import { useState, useRef, useEffect } from 'react'
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
import { PRIMARY_MUSCLES } from '@/lib/muscleGroupMapping'
import { Plus, Pencil, Trash2, Dumbbell, ChevronDown, Check, X } from 'lucide-react'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

const selectTriggerClass =
  'w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent flex items-center justify-between gap-2 min-h-[42px] text-left'
const selectPanelClass =
  'absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-auto'
const selectOptionClass =
  'px-3 py-2.5 text-sm text-foreground hover:bg-muted cursor-pointer flex items-center justify-between gap-2'

const defaultForm: ExerciseInsert = {
  name: '',
  primary_muscle: 'Pectorals',
  secondary_muscles: [],
  movement_pattern: 'Push',
  equipment: 'Bodyweight',
  is_bodyweight: true,
  notes: '',
  type: 'reps',
}

type FormState = ExerciseInsert

function formToPayload(form: FormState): ExerciseInsert {
  return {
    name: form.name.trim(),
    primary_muscle: form.primary_muscle.trim(),
    secondary_muscles: form.secondary_muscles,
    movement_pattern: form.movement_pattern,
    equipment: form.equipment,
    is_bodyweight: form.is_bodyweight,
    notes: form.notes?.trim() || null,
    type: form.type ?? 'reps',
  }
}

type OpenDropdown = 'primary' | 'secondary' | 'movement' | 'equipment' | null

export function Exercises() {
  const { exercises, loading, error, create, update, remove } = useExercises()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addMode, setAddMode] = useState<'create' | null>(null)
  const [form, setForm] = useState<FormState>({ ...defaultForm })
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (openDropdown === null) return
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openDropdown])

  function openAdd() {
    setAddMode('create')
    setForm({ ...defaultForm })
  }

  function closeAddModal() {
    setAddMode(null)
  }

  function openEdit(ex: Exercise) {
    setEditingId(ex.id)
    setAddMode(null)
    setForm({
      name: ex.name,
      primary_muscle: ex.primary_muscle,
      secondary_muscles: ex.secondary_muscles ?? [],
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
    setForm({ ...defaultForm })
  }

  function toggleSecondaryMuscle(muscle: string) {
    setForm((f) => ({
      ...f,
      secondary_muscles: f.secondary_muscles.includes(muscle)
        ? f.secondary_muscles.filter((m) => m !== muscle)
        : [...f.secondary_muscles, muscle],
    }))
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
        setForm({ ...defaultForm })
      }
    } catch (err) {
      console.error(err)
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
          <div ref={dropdownRef}>
            <div>
            <label className="block text-sm text-muted-foreground mb-1">Primary muscle</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'primary' ? null : 'primary')}
                className={selectTriggerClass}
                aria-expanded={openDropdown === 'primary'}
                aria-haspopup="listbox"
              >
                <span>
                  {!PRIMARY_MUSCLES.includes(form.primary_muscle as (typeof PRIMARY_MUSCLES)[number]) &&
                  form.primary_muscle
                    ? form.primary_muscle
                    : form.primary_muscle || 'Select'}
                </span>
                <ChevronDown className={cn('w-4 h-4 shrink-0 text-muted-foreground', openDropdown === 'primary' && 'rotate-180')} />
              </button>
              {openDropdown === 'primary' && (
                <ul className={selectPanelClass} role="listbox">
                  {!PRIMARY_MUSCLES.includes(form.primary_muscle as (typeof PRIMARY_MUSCLES)[number]) &&
                    form.primary_muscle && (
                      <li
                        role="option"
                        aria-selected={true}
                        className={cn(selectOptionClass, 'bg-muted/50')}
                        onClick={() => setOpenDropdown(null)}
                      >
                        {form.primary_muscle}
                        <Check className="w-4 h-4 text-accent shrink-0" />
                      </li>
                    )}
                  {PRIMARY_MUSCLES.map((m) => (
                    <li
                      key={m}
                      role="option"
                      aria-selected={form.primary_muscle === m}
                      className={cn(selectOptionClass, form.primary_muscle === m && 'bg-muted/50')}
                      onClick={() => {
                        setForm((f) => ({ ...f, primary_muscle: m }))
                        setOpenDropdown(null)
                      }}
                    >
                      {m}
                      {form.primary_muscle === m && <Check className="w-4 h-4 text-accent shrink-0" />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Secondary muscles</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'secondary' ? null : 'secondary')}
                className={selectTriggerClass}
                aria-expanded={openDropdown === 'secondary'}
                aria-haspopup="listbox"
              >
                <span className="text-muted-foreground">
                  {form.secondary_muscles.length === 0 ? 'Add secondary muscles' : 'Add or remove'}
                </span>
                <ChevronDown className={cn('w-4 h-4 shrink-0 text-muted-foreground', openDropdown === 'secondary' && 'rotate-180')} />
              </button>
              {openDropdown === 'secondary' && (
                <ul className={selectPanelClass} role="listbox" aria-multiselectable="true">
                  {PRIMARY_MUSCLES.map((m) => (
                    <li
                      key={m}
                      role="option"
                      aria-selected={form.secondary_muscles.includes(m)}
                      className={cn(selectOptionClass, form.secondary_muscles.includes(m) && 'bg-muted/50')}
                      onClick={() => toggleSecondaryMuscle(m)}
                    >
                      {m}
                      {form.secondary_muscles.includes(m) && <Check className="w-4 h-4 text-accent shrink-0" />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {form.secondary_muscles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.secondary_muscles.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-sm text-foreground"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => toggleSecondaryMuscle(m)}
                      className="p-0.5 rounded-full hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground min-w-[24px] min-h-[24px] flex items-center justify-center"
                      aria-label={`Remove ${m}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Movement pattern</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'movement' ? null : 'movement')}
                className={selectTriggerClass}
                aria-expanded={openDropdown === 'movement'}
                aria-haspopup="listbox"
              >
                <span>{form.movement_pattern}</span>
                <ChevronDown className={cn('w-4 h-4 shrink-0 text-muted-foreground', openDropdown === 'movement' && 'rotate-180')} />
              </button>
              {openDropdown === 'movement' && (
                <ul className={selectPanelClass} role="listbox">
                  {MOVEMENT_PATTERNS.map((p) => (
                    <li
                      key={p}
                      role="option"
                      aria-selected={form.movement_pattern === p}
                      className={cn(selectOptionClass, form.movement_pattern === p && 'bg-muted/50')}
                      onClick={() => {
                        setForm((f) => ({ ...f, movement_pattern: p }))
                        setOpenDropdown(null)
                      }}
                    >
                      {p}
                      {form.movement_pattern === p && <Check className="w-4 h-4 text-accent shrink-0" />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div ref={openDropdown === 'equipment' ? dropdownRef : undefined}>
            <label className="block text-sm text-muted-foreground mb-1">Equipment</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'equipment' ? null : 'equipment')}
                className={selectTriggerClass}
                aria-expanded={openDropdown === 'equipment'}
                aria-haspopup="listbox"
              >
                <span>{form.equipment}</span>
                <ChevronDown className={cn('w-4 h-4 shrink-0 text-muted-foreground', openDropdown === 'equipment' && 'rotate-180')} />
              </button>
              {openDropdown === 'equipment' && (
                <ul className={selectPanelClass} role="listbox">
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <li
                      key={eq}
                      role="option"
                      aria-selected={form.equipment === eq}
                      className={cn(selectOptionClass, form.equipment === eq && 'bg-muted/50')}
                      onClick={() => {
                        setForm((f) => ({ ...f, equipment: eq }))
                        setOpenDropdown(null)
                      }}
                    >
                      {eq}
                      {form.equipment === eq && <Check className="w-4 h-4 text-accent shrink-0" />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
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
              onClick={editingId ? cancelForm : () => { closeAddModal(); setAddMode(null); setForm({ ...defaultForm }); }}
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
          description="Create a new exercise."
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
