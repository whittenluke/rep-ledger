import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSessionDetail, useWorkoutHistory } from '@/hooks/useWorkoutHistory'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { MoreVertical, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { detail, loading, error } = useSessionDetail(sessionId ?? null)
  const { deleteSession } = useWorkoutHistory()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  function openDeleteConfirm() {
    setMenuOpen(false)
    setDeleteConfirmOpen(true)
    setDeleteError(null)
  }

  async function handleConfirmDelete() {
    if (!sessionId) return
    setDeleteError(null)
    try {
      await deleteSession(sessionId)
      setDeleteConfirmOpen(false)
      navigate('/history', { replace: true })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete session')
    }
  }

  if (!sessionId) {
    return (
      <div className="p-4 pb-20">
        <PageHeader title="History" />
        <EmptyState
          message="No session selected"
          description="Open a session from the History list."
          action={
            <button
              type="button"
              onClick={() => navigate('/history')}
              className="px-4 py-2.5 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px]"
            >
              View history
            </button>
          }
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <LoadingState message="Loading session…" />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="p-4 pb-20">
        <PageHeader title="History" />
        <ErrorState
          message="Session not found"
          description="This session may have been deleted or the link is invalid."
          action={
            <button
              type="button"
              onClick={() => navigate('/history')}
              className="px-4 py-2.5 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px]"
            >
              Back to history
            </button>
          }
        />
      </div>
    )
  }

  // Group by template_exercise_id when present (same exercise twice = two blocks), else by exercise_id for legacy sets
  const setsByBlock = detail.sets.reduce<Record<string, typeof detail.sets>>((acc, set) => {
    const key = set.template_exercise_id ?? set.exercise_id ?? 'deleted'
    if (!acc[key]) acc[key] = []
    acc[key].push(set)
    return acc
  }, {})
  const blockKeys = Object.keys(setsByBlock).sort((a, b) => {
    const minSetA = Math.min(...setsByBlock[a].map((s) => s.set_number))
    const minSetB = Math.min(...setsByBlock[b].map((s) => s.set_number))
    return minSetA - minSetB
  })

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between gap-2 mb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Session options"
            aria-expanded={menuOpen}
          >
            <MoreVertical className="w-5 h-5" aria-hidden />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-lg"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-red-500 hover:bg-destructive/10"
                onClick={openDeleteConfirm}
              >
                <Trash2 className="w-4 h-4 shrink-0" aria-hidden />
                Delete session
              </button>
            </div>
          )}
        </div>
      </div>

      <PageHeader title={detail.template_name} />
      <p className="text-sm text-muted-foreground mt-1">
        {formatDate(detail.completed_at)} · {formatDuration(detail.durationSeconds)}
      </p>

      <div className="mt-6 space-y-6">
        {blockKeys.map((blockKey) => {
          const sets = setsByBlock[blockKey] ?? []
          const first = sets[0]
          const name = first?.exercises?.name ?? 'Unknown'
          const muscleGroup = first?.exercises?.primary_muscle
          const isTime = first?.exercises?.type === 'time'
          return (
            <div key={blockKey} className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="p-3 border-b border-border">
                <p className="font-medium text-foreground">{name}</p>
                {muscleGroup && (
                  <p className="text-sm text-muted-foreground">{muscleGroup}</p>
                )}
              </div>
              <ul className="divide-y divide-border">
                {sets
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((set) => (
                    <li key={set.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Set {set.set_number}</span>
                      <span className="text-foreground">
                        {isTime
                          ? `${set.actual_duration_seconds ?? '-'}s`
                          : `${set.actual_reps ?? '-'} reps${set.weight != null ? ` x ${set.weight}` : ''}`}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )
        })}
      </div>

      {deleteConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-session-title"
        >
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-xl">
            <h2 id="delete-session-title" className="font-display text-lg font-semibold text-foreground">
              Delete this workout?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This cannot be undone. The session and all its sets will be removed. Progress and PRs that used this session will update accordingly.
            </p>
            {deleteError && (
              <p className="mt-2 text-sm text-red-500" role="alert">
                {deleteError}
              </p>
            )}
            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setDeleteConfirmOpen(false); setDeleteError(null) }}
                className={cn(
                  'px-4 py-2.5 rounded-lg border border-border font-medium min-h-[44px]',
                  'bg-background text-foreground hover:bg-muted'
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-lg font-medium min-h-[44px] bg-red-600 text-white hover:bg-red-700"
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
