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
  const { sessions, loading, error, refetch } = useWorkoutHistory()

  return (
    <div className="flex flex-col min-h-[calc(100dvh-80px)] p-4 pb-20">
      <PageHeader title="History" />

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex flex-wrap items-center gap-2" role="alert">
          <span>Failed to load history.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="font-medium underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading history…" />
      ) : sessions.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center">
          <EmptyState
            message="No completed workouts yet"
            description="Finish a workout from the calendar or dashboard to see it here."
          />
        </div>
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
