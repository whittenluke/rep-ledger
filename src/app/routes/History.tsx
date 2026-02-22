import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function History() {
  const navigate = useNavigate()
  const { sessions, loading, error } = useWorkoutHistory()

  return (
    <div className="p-4 pb-20">
      <PageHeader title="History" />

      {error && (
        <p className="mt-4 text-sm text-red-500">Failed to load history.</p>
      )}

      {loading ? (
        <LoadingState message="Loading history…" />
      ) : sessions.length === 0 ? (
        <EmptyState
          message="No completed workouts yet"
          description="Finish a workout from the calendar or dashboard to see it here."
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => navigate(`/history/${s.id}`)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-card',
                  'text-left hover:border-accent/50 transition-colors min-h-[44px]'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{s.template_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(s.completed_at)} · {formatDuration(s.durationSeconds)} · {s.setsCount} sets
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
