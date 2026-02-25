import { useState, useRef, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  useExercises,
  type Exercise,
  type ExerciseInsert,
  type ExerciseType,
  MOVEMENT_PATTERNS,
  EQUIPMENT_OPTIONS,
} from '@/hooks/useExercises'
import { cn } from '@/lib/utils'
import { PRIMARY_MUSCLES } from '@/lib/muscleGroupMapping'
import { Plus, Pencil, Trash2, Dumbbell, ChevronDown, Check, X, MoreVertical, Copy } from 'lucide-react'
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
  const isBodyweight = form.equipment === 'Bodyweight' || form.is_bodyweight
  return {
    name: form.name.trim(),
    primary_muscle: form.primary_muscle.trim(),
    secondary_muscles: form.secondary_muscles ?? [],
    movement_pattern: form.movement_pattern,
    equipment: form.equipment,
    is_bodyweight: isBodyweight,
    notes: form.notes?.trim() || null,
    type: form.type ?? 'reps',
  }
}

type OpenDropdown = 'primary' | 'secondary' | 'movement' | 'equipment' | null

export function Exercises() {
  const { exercises, loading, error, refetch, create, update, remove } = useExercises()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addMode, setAddMode] = useState<'create' | 'duplicate' | null>(null)
  const [form, setForm] = useState<FormState>({ ...defaultForm })
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!menuOpenId) return
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

  function openAdd() {
    startCreateNew()
  }

  function closeAddModal() {
    setAddMode(null)
  }

  function startCreateNew() {
    setAddMode('create')
    setForm({ ...defaultForm })
  }

  function startDuplicateFrom(ex: Exercise) {
    setForm({
      name: `${ex.name} (copy)`,
      primary_muscle: ex.primary_muscle,
      secondary_muscles: ex.secondary_muscles ?? [],
      movement_pattern: ex.movement_pattern,
      equipment: ex.equipment,
      is_bodyweight: ex.is_bodyweight,
      notes: ex.notes ?? '',
      type: ex.type ?? 'reps',
    })
    setAddMode('create')
    setMenuOpenId(null)
  }

  function openEdit(ex: Exercise) {
    setEditingId(ex.id)
    setAddMode(null)
    setMenuOpenId(null)
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
    setForm((f) => {
      const list = f.secondary_muscles ?? []
      return {
        ...f,
        secondary_muscles: list.includes(muscle)
          ? list.filter((m) => m !== muscle)
          : [...list, muscle],
      }
    })
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
    setDeleteError(null)
    try {
      await remove(id)
      if (editingId === id) cancelForm()
    } catch (err) {
      console.error(err)
      const msg =
        err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === '23503'
          ? 'Cannot delete: this exercise is used in a workout or in history. Remove it from templates first.'
          : err instanceof Error
            ? err.message
            : 'Could not delete exercise.'
      setDeleteError(msg)
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent'

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="My Exercises" />
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px]"
        >
          <Plus className="w-5 h-5" /> Add
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex flex-wrap items-center gap-2" role="alert">
          <span>Failed to load exercises.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="font-medium underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}
      {deleteError && (
        <p className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">
          {deleteError}
        </p>
      )}

      {/* Add flow: pick exercise to duplicate */}
      {addMode === 'duplicate' && (
        <div className="mt-4 p-4 rounded-lg border border-border bg-card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Choose an exercise to duplicate</p>
            <button
              type="button"
              onClick={closeAddModal}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
          </div>
          <ul className="space-y-2 max-h-60 overflow-auto">
            {exercises.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => startDuplicateFrom(ex)}
                  className="w-full text-left p-3 rounded-lg border border-border bg-background hover:border-accent/50 min-h-[44px] flex items-center gap-3"
                >
                  {ex.image_url ? (
                    <img src={ex.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-muted" />
                  ) : (
                    <span className="w-10 h-10 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-muted-foreground" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{ex.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {ex.primary_muscle}
                      {ex.movement_pattern ? ` · ${ex.movement_pattern}` : ''}
                    </p>
                  </div>
                  <Copy className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              </li>
            ))}
          </ul>
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
                    {(form.secondary_muscles ?? []).length === 0 ? 'Add secondary muscles' : 'Add or remove'}
                  </span>
                  <ChevronDown className={cn('w-4 h-4 shrink-0 text-muted-foreground', openDropdown === 'secondary' && 'rotate-180')} />
                </button>
                {openDropdown === 'secondary' && (
                  <ul className={selectPanelClass} role="listbox" aria-multiselectable="true">
                    {PRIMARY_MUSCLES.map((m) => (
                      <li
                        key={m}
                        role="option"
                        aria-selected={(form.secondary_muscles ?? []).includes(m)}
                        className={cn(selectOptionClass, (form.secondary_muscles ?? []).includes(m) && 'bg-muted/50')}
                        onClick={() => toggleSecondaryMuscle(m)}
                      >
                        {m}
                        {(form.secondary_muscles ?? []).includes(m) && <Check className="w-4 h-4 text-accent shrink-0" />}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {(form.secondary_muscles ?? []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(form.secondary_muscles ?? []).map((m) => (
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
          {form.equipment !== 'Bodyweight' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_bodyweight}
                onChange={(e) => setForm((f) => ({ ...f, is_bodyweight: e.target.checked }))}
                className="rounded border-border text-accent focus:ring-accent"
              />
              <span className="text-sm">Bodyweight (no weight logged in session)</span>
            </label>
          )}
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
                <dl className="mt-1.5 space-y-0.5 text-sm">
                  <div className="flex min-w-0 items-baseline gap-x-3">
                    <dt className="w-20 shrink-0 text-muted-foreground text-xs font-medium uppercase tracking-wide">Primary</dt>
                    <dd className="min-w-0 truncate text-foreground">{ex.primary_muscle}</dd>
                  </div>
                  <div className="flex min-w-0 items-baseline gap-x-3">
                    <dt className="w-20 shrink-0 text-muted-foreground text-xs font-medium uppercase tracking-wide">Equipment</dt>
                    <dd className="min-w-0 truncate text-foreground">{ex.equipment}</dd>
                  </div>
                  <div className="flex min-w-0 items-baseline gap-x-3">
                    <dt className="w-20 shrink-0 text-muted-foreground text-xs font-medium uppercase tracking-wide">Type</dt>
                    <dd className="min-w-0 truncate text-foreground">{ex.type === 'time' ? 'Time' : 'Reps'}</dd>
                  </div>
                </dl>
              </div>
              <div className="relative shrink-0" ref={menuOpenId === ex.id ? menuRef : null}>
                <button
                  type="button"
                  onClick={() => setMenuOpenId(menuOpenId === ex.id ? null : ex.id)}
                  className="p-2 rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Exercise options"
                  aria-expanded={menuOpenId === ex.id}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {menuOpenId === ex.id && (
                  <div
                    className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-lg"
                    role="menu"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                      onClick={() => openEdit(ex)}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground shrink-0" />
                      Edit exercise
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                      onClick={() => startDuplicateFrom(ex)}
                    >
                      <Copy className="w-4 h-4 text-muted-foreground shrink-0" />
                      Duplicate exercise
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-red-500 hover:bg-destructive/10"
                      onClick={() => {
                        setMenuOpenId(null)
                        handleDelete(ex.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                      Delete exercise
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
