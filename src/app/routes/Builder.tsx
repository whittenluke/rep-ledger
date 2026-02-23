import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useWorkoutTemplates, type WorkoutTemplate } from '@/hooks/useWorkoutTemplates'
import { cn } from '@/lib/utils'
import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

const MAX_TAGS = 3

function templateSummary(t: WorkoutTemplate): { exerciseCount: number; movement: string[]; muscles: string[]; equipment: string[] } {
  const rows = t.template_exercises ?? []
  const movement = [...new Set(rows.map((te) => te.exercises?.movement_pattern).filter(Boolean))] as string[]
  const muscles = [...new Set(rows.map((te) => te.exercises?.primary_muscle).filter(Boolean))] as string[]
  const equipment = [...new Set(rows.map((te) => te.exercises?.equipment).filter(Boolean))] as string[]
  return {
    exerciseCount: rows.length,
    movement: movement.slice(0, MAX_TAGS),
    muscles: muscles.slice(0, MAX_TAGS),
    equipment: equipment.slice(0, MAX_TAGS),
  }
}

export function Builder() {
  const navigate = useNavigate()
  const { templates, loading, error, create, remove } = useWorkoutTemplates()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  async function confirmDelete(id: string) {
    setDeleteError(null)
    try {
      await remove(id)
      setDeleteConfirm(null)
    } catch (err) {
      console.error(err)
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : typeof err === 'string'
              ? err
              : 'Something went wrong'
      setDeleteError(`Could not delete: ${message}`)
      setDeleteConfirm(null)
    }
  }

  async function handleNew() {
    try {
      const t = await create({ name: 'Untitled workout' })
      navigate(`/builder/${t.id}`)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="Workout Builder" />
        <button
          type="button"
          onClick={handleNew}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px]"
        >
          <Plus className="w-5 h-5" /> New
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-500">Failed to load templates.</p>
      )}
      {deleteError && (
        <p className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">
          {deleteError}
        </p>
      )}

      {loading ? (
        <LoadingState message="Loading templates…" />
      ) : templates.length === 0 ? (
        <EmptyState
          message="No templates yet"
          description="Create a workout template to schedule and run sessions."
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {templates.map((t) => {
            const { exerciseCount, movement, muscles, equipment } = templateSummary(t)
            const hasMeta = exerciseCount > 0 && (movement.length > 0 || muscles.length > 0 || equipment.length > 0)
            return (
              <li
                key={t.id}
                className={cn(
                  'flex items-center gap-0 rounded-lg border border-border bg-card',
                  'hover:border-accent/50 transition-colors'
                )}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/builder/${t.id}`)}
                  className="flex-1 flex flex-row items-center gap-2 p-3 text-left min-w-0 rounded-l-lg"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <span className="font-medium text-foreground truncate">{t.name}</span>
                    {hasMeta && (
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        <span>{exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}</span>
                        {movement.length > 0 && <span>{movement.join(', ')}</span>}
                        {muscles.length > 0 && <span>{muscles.join(', ')}</span>}
                        {equipment.length > 0 && <span>{equipment.join(', ')}</span>}
                      </div>
                    )}
                  </div>
                </button>
                <div className="relative shrink-0" ref={menuOpenId === t.id ? menuRef : null}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setMenuOpenId(menuOpenId === t.id ? null : t.id)
                    }}
                    className="p-2 rounded-r-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px]"
                    aria-label="Workout options"
                    aria-expanded={menuOpenId === t.id}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {menuOpenId === t.id && (
                    <div
                      className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-lg"
                      role="menu"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpenId(null)
                          navigate(`/builder/${t.id}`)
                        }}
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                        Edit workout
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-red-500 hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpenId(null)
                          setDeleteConfirm({ id: t.id, name: t.name })
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete workout
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-dialog-title" className="font-display text-lg font-semibold text-foreground">
              Delete workout?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete &quot;{deleteConfirm.name}&quot;? This cannot be undone.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(deleteConfirm.id)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
