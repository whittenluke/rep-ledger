import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useActiveWorkoutStore } from '@/store/activeWorkout'
import { useCalendar } from '@/hooks/useCalendar'
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory'
import { useProgressAnalytics } from '@/hooks/useProgressAnalytics'
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { Calendar, ChevronRight, Dumbbell } from 'lucide-react'

function toLocalDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatSessionDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function Dashboard() {
  const navigate = useNavigate()
  const { sessionId, scheduledWorkoutId, reset } = useActiveWorkoutStore()
  const hasInProgressSession = sessionId && scheduledWorkoutId

  const now = new Date()
  const todayStr = toLocalDateStr(now)
  const { scheduled, loading: calendarLoading, getScheduledForDate, createScheduled } = useCalendar(
    now.getFullYear(),
    now.getMonth() + 1
  )
  const todaysScheduled = scheduled.find((s) => s.scheduled_date === todayStr) ?? null

  const { sessions: recentSessions, loading: historyLoading } = useWorkoutHistory()
  const lastThree = recentSessions.slice(0, 3)

  const { currentStreak, workoutsThisWeek, loading: analyticsLoading } = useProgressAnalytics()

  const [pickOneOpen, setPickOneOpen] = useState(false)
  const { templates } = useWorkoutTemplates()

  const loading = calendarLoading || historyLoading || analyticsLoading

  async function handleAssignToday(templateId: string) {
    try {
      const created = await createScheduled(templateId, todayStr)
      setPickOneOpen(false)
      navigate(`/session/${created.id}`)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-4 pb-20 space-y-6">
      <PageHeader title="Today" />

      {hasInProgressSession && (
        <div className="p-3 rounded-lg border border-accent/50 bg-accent/10 flex flex-col gap-2">
          <p className="text-sm font-medium">You have an in-progress workout.</p>
          <div className="flex gap-2">
            <Link
              to={`/session/${scheduledWorkoutId}`}
              className="px-3 py-2 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px] flex items-center justify-center"
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

      {!hasInProgressSession && (
        <>
          {loading ? (
            <LoadingState message="Loading…" />
          ) : todaysScheduled ? (
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-1">Scheduled for today</p>
              <p className="font-display text-xl font-semibold text-foreground">
                {todaysScheduled.workout_templates?.name ?? 'Workout'}
              </p>
              <Link
                to={`/session/${todaysScheduled.id}`}
                className={cn(
                  'mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
                  'bg-accent text-primary-foreground font-semibold min-h-[48px]',
                  'hover:opacity-90 transition-opacity'
                )}
              >
                <Dumbbell className="w-5 h-5" aria-hidden />
                Start workout
              </Link>
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-muted-foreground">No workout scheduled for today.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Schedule one from the calendar or start a quick session.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setPickOneOpen(true)}
                  className="px-4 py-3 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px]"
                >
                  Pick a workout
                </button>
                <Link
                  to="/calendar"
                  className="px-4 py-3 rounded-lg border border-border flex items-center justify-center gap-2 min-h-[44px] text-foreground"
                >
                  <Calendar className="w-5 h-5" aria-hidden />
                  Calendar
                </Link>
              </div>
            </div>
          )}

          {pickOneOpen && (
            <div
              className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/50"
              role="dialog"
              aria-modal="true"
              aria-label="Pick a workout for today"
            >
              <div className="w-full max-w-md bg-card border-t sm:border border-border rounded-t-2xl sm:rounded-2xl p-4 pb-8 safe-area-pb">
                <h2 className="font-display text-lg font-semibold mb-2">Schedule for today</h2>
                <p className="text-sm text-muted-foreground mb-4">Choose a template to start</p>
                {templates.length === 0 ? (
                  <EmptyState
                    message="No templates yet"
                    description="Create one in Workout Builder first."
                  />
                ) : (
                  <ul className="space-y-2 max-h-60 overflow-auto">
                    {templates.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => handleAssignToday(t.id)}
                          className="w-full text-left px-3 py-3 rounded-lg border border-border bg-background hover:border-accent/50 min-h-[44px] flex items-center justify-between gap-2"
                        >
                          <span className="font-medium truncate">{t.name}</span>
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => setPickOneOpen(false)}
                  className="mt-4 w-full py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && (
        <>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">Quick stats</h2>
            <div className="flex gap-4">
              <div className="flex-1 p-3 rounded-lg border border-border bg-card">
                <p className="text-2xl font-display font-semibold text-accent">{workoutsThisWeek}</p>
                <p className="text-xs text-muted-foreground">This week</p>
              </div>
              <div className="flex-1 p-3 rounded-lg border border-border bg-card">
                <p className="text-2xl font-display font-semibold text-accent">{currentStreak}</p>
                <p className="text-xs text-muted-foreground">
                  Day streak
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">Recent activity</h2>
            {lastThree.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed workouts yet.</p>
            ) : (
              <ul className="space-y-2">
                {lastThree.map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/history/${s.id}`}
                      className={cn(
                        'block p-3 rounded-lg border border-border bg-card',
                        'hover:border-accent/50 transition-colors min-h-[44px]'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{s.template_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatSessionDate(s.completed_at)} · {s.setsCount} sets ·{' '}
                            {formatDuration(s.durationSeconds)}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
