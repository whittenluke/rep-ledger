import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useExercises, type Exercise, type ExerciseInsert, type ExerciseType } from '@/hooks/useExercises'
import { cn } from '@/lib/utils'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

export function Exercises() {
  const { exercises, loading, error, create, update, remove } = useExercises()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState<ExerciseInsert>({ name: '', muscle_group: '', notes: '', type: 'reps' })

  function openAdd() {
    setIsAdding(true)
    setEditingId(null)
    setForm({ name: '', muscle_group: '', notes: '', type: 'reps' })
  }

  function openEdit(ex: Exercise) {
    setEditingId(ex.id)
    setIsAdding(false)
    setForm({
      name: ex.name,
      muscle_group: ex.muscle_group ?? '',
      notes: ex.notes ?? '',
      type: ex.type ?? 'reps',
    })
  }

  function cancelForm() {
    setIsAdding(false)
    setEditingId(null)
    setForm({ name: '', muscle_group: '', notes: '', type: 'reps' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      muscle_group: form.muscle_group.trim() || null,
      notes: form.notes.trim() || null,
      type: form.type ?? 'reps',
    }
    if (!payload.name) return
    try {
      if (isAdding) {
        await create(payload)
        cancelForm()
      } else if (editingId) {
        await update(editingId, payload)
        cancelForm()
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

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="mt-4 p-4 rounded-lg border border-border bg-card space-y-3">
          <input
            required
            placeholder="Exercise name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
          />
          <div>
            <span className="block text-sm text-muted-foreground mb-1">Type</span>
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
          <input
            placeholder="Muscle group"
            value={form.muscle_group}
            onChange={(e) => setForm((f) => ({ ...f, muscle_group: e.target.value }))}
            className={inputClass}
          />
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className={cn(inputClass, 'resize-none')}
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-primary-foreground font-medium">
              {isAdding ? 'Add' : 'Save'}
            </button>
            <button type="button" onClick={cancelForm} className="px-4 py-2 rounded-lg border border-border">
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
          description="Add your first exercise to build workout templates."
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
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{ex.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {ex.muscle_group ? [ex.muscle_group, ex.type === 'time' ? 'Time' : null].filter(Boolean).join(' · ') : ex.type === 'time' ? 'Time' : ''}
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
