import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useActiveWorkoutStore } from '@/store/activeWorkout'

export function Dashboard() {
  const { sessionId, scheduledWorkoutId, reset } = useActiveWorkoutStore()
  const hasInProgressSession = sessionId && scheduledWorkoutId

  return (
    <div className="p-4 pb-20">
      <PageHeader title="Today" />
      {hasInProgressSession && (
        <div className="mt-4 p-3 rounded-lg border border-accent/50 bg-accent/10 flex flex-col gap-2">
          <p className="text-sm font-medium">You have an in-progress workout.</p>
          <div className="flex gap-2">
            <Link
              to={`/session/${scheduledWorkoutId}`}
              className="px-3 py-2 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px] flex items-center"
            >
              Resume
            </Link>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Discard this workout? Progress will be lost.')) reset()
              }}
              className="px-3 py-2 rounded-lg border border-border min-h-[44px]"
            >
              Discard
            </button>
          </div>
        </div>
      )}
      <p className="mt-4 text-muted-foreground">Dashboard placeholder. Today’s workout and quick stats will go here.</p>
    </div>
  )
}
