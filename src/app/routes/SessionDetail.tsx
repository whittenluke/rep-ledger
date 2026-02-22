import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSessionDetail } from '@/hooks/useWorkoutHistory'
import { LoadingState } from '@/components/ui/LoadingSpinner'

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

  if (!sessionId) {
    return (
      <div className="p-4 pb-20">
        <p className="text-muted-foreground">No session selected.</p>
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
        <p className="text-red-500">Session not found.</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-2 text-accent">
          Back
        </button>
      </div>
    )
  }

  const setsByExercise = detail.sets.reduce<Record<string, typeof detail.sets>>((acc, set) => {
    const key = set.exercise_id
    if (!acc[key]) acc[key] = []
    acc[key].push(set)
    return acc
  }, {})
  const exerciseIds = [...new Set(detail.sets.map((s) => s.exercise_id))]

  return (
    <div className="p-4 pb-20">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-muted-foreground hover:text-foreground mb-2"
      >
        ← Back
      </button>

      <PageHeader title={detail.template_name} />
      <p className="text-sm text-muted-foreground mt-1">
        {formatDate(detail.completed_at)} · {formatDuration(detail.durationSeconds)}
      </p>

      <div className="mt-6 space-y-6">
        {exerciseIds.map((exerciseId) => {
          const sets = setsByExercise[exerciseId] ?? []
          const first = sets[0]
          const name = first?.exercises?.name ?? 'Unknown'
          const muscleGroup = first?.exercises?.muscle_group
          const isTime = first?.exercises?.type === 'time'
          return (
            <div key={exerciseId} className="rounded-lg border border-border bg-card overflow-hidden">
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
    </div>
  )
}
