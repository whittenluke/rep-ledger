import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useActiveWorkoutStore } from '@/store/activeWorkout'
import { useCalendar } from '@/hooks/useCalendar'
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory'
import { useProgressAnalytics } from '@/hooks/useProgressAnalytics'
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates'
import { useStartWorkout } from '@/contexts/StartWorkoutContext'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { Calendar, CheckCircle2, ChevronRight, Dumbbell, Plus, Trash2 } from 'lucide-react'

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
  const { sessionId, scheduledWorkoutId, reset } = useActiveWorkoutStore()
  const hasInProgressSession = sessionId && scheduledWorkoutId

  const now = new Date()
  const todayStr = toLocalDateStr(now)
  const { scheduled, loading: calendarLoading, createScheduled, removeScheduled, refetch: refetchCalendar } = useCalendar(
    now.getFullYear(),
    now.getMonth() + 1
  )
  const { sessions: recentSessions, loading: historyLoading } = useWorkoutHistory()

  const { completedTodayList, notCompletedTodayList, lastThree } = useMemo(() => {
    const list = scheduled.filter((s) => s.scheduled_date === todayStr)
    const completedIds = new Set(
      recentSessions
        .filter((s) => s.scheduled_workout_id && list.some((t) => t.id === s.scheduled_workout_id))
        .map((s) => s.scheduled_workout_id as string)
    )
    const notCompleted = list.filter((s) => !completedIds.has(s.id))
    const completedList = list
      .filter((s) => completedIds.has(s.id))
      .map((s) => ({
        scheduled: s,
        session: recentSessions.find((r) => r.scheduled_workout_id === s.id)!,
      }))
    return {
      completedTodayList: completedList,
      notCompletedTodayList: notCompleted,
      lastThree: recentSessions.slice(0, 3),
    }
  }, [scheduled, todayStr, recentSessions])

  const { currentStreak, workoutsThisWeek, loading: analyticsLoading } = useProgressAnalytics()

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(todayStr)
  const [removeConfirm, setRemoveConfirm] = useState<{ id: string; name: string } | null>(null)
  const { templates } = useWorkoutTemplates()
  const { openStartWorkout } = useStartWorkout()

  const loading = calendarLoading || historyLoading || analyticsLoading

  function openScheduleModal() {
    setScheduleDate(todayStr)
    setScheduleModalOpen(true)
  }

  async function handleScheduleWorkout(templateId: string) {
    try {
      await createScheduled(templateId, scheduleDate)
      setScheduleModalOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  function openRemoveConfirm(id: string, name: string) {
    setRemoveConfirm({ id, name })
  }

  async function handleRemoveScheduledConfirm() {
    if (!removeConfirm) return
    const { id } = removeConfirm
    setRemoveConfirm(null)
    try {
      await removeScheduled(id)
      await refetchCalendar()
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
          ) : (
            <>
              {completedTodayList.length > 0 && (
                <div className="space-y-3">
                  {completedTodayList.map(({ scheduled: s, session }) => (
                    <div key={s.id} className="p-4 rounded-lg border-2 border-accent/70 bg-accent/5">
                      <p className="flex items-center gap-1.5 text-sm text-accent">
                        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden />
                        Workout completed
                      </p>
                      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground uppercase">
                        {s.workout_templates?.name ?? 'Workout'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatSessionDate(session.completed_at)} · {session.setsCount} sets · {formatDuration(session.durationSeconds)}
                      </p>
                      <Link
                        to={`/history/${session.id}`}
                        className={cn(
                          'mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
                          'border border-border bg-card font-medium min-h-[44px]',
                          'hover:border-accent/50 transition-colors'
                        )}
                      >
                        View session
                        <ChevronRight className="w-5 h-5" aria-hidden />
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {notCompletedTodayList.length > 0 && (
                <div className="space-y-3">
                  {notCompletedTodayList.map((s) => (
                    <div key={s.id} className="relative p-4 pr-12 rounded-lg border border-border bg-card">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          openRemoveConfirm(s.id, s.workout_templates?.name ?? 'Workout')
                        }}
                        className="absolute top-3 right-3 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Unschedule"
                      >
                        <Trash2 className="w-5 h-5" aria-hidden />
                      </button>
                      <p className="text-sm text-muted-foreground mb-1">Scheduled for today</p>
                      <p className="font-display text-xl font-semibold text-foreground">
                        {s.workout_templates?.name ?? 'Workout'}
                      </p>
                      <div className="mt-4">
                        <Link
                          to={`/session/${s.id}`}
                          className={cn(
                            'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
                            'bg-accent text-primary-foreground font-semibold min-h-[48px]',
                            'hover:opacity-90 transition-opacity'
                          )}
                        >
                          <Dumbbell className="w-5 h-5" aria-hidden />
                          Start workout
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {completedTodayList.length === 0 && notCompletedTodayList.length === 0 && (
                <div className="p-4 rounded-lg border border-border bg-card space-y-4">
                  <p className="text-muted-foreground">No workouts scheduled for today.</p>
                  <button
                    type="button"
                    onClick={openStartWorkout}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
                      'bg-accent text-primary-foreground font-semibold min-h-[48px]',
                      'hover:opacity-90 transition-opacity'
                    )}
                  >
                    <Dumbbell className="w-5 h-5" aria-hidden />
                    Start workout
                  </button>
                  <p className="text-xs text-muted-foreground">
                    Pick a template to start now, or schedule one for another day below.
                  </p>
                </div>
              )}

              <Link
                to="/calendar"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground min-h-[44px]"
              >
                <Calendar className="w-5 h-5" aria-hidden />
                Calendar
              </Link>
            </>
          )}

          {scheduleModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/50"
              role="dialog"
              aria-modal="true"
              aria-label="Schedule a workout"
            >
              <div className="w-full max-w-md bg-card border-t sm:border border-border rounded-t-2xl sm:rounded-2xl p-4 pb-8 safe-area-pb">
                <h2 className="font-display text-lg font-semibold mb-2">Schedule a workout</h2>
                <div className="mb-4">
                  <label htmlFor="schedule-date" className="block text-sm text-muted-foreground mb-1">
                    Date
                  </label>
                  <input
                    id="schedule-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-2">Choose a template</p>
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
                          onClick={() => handleScheduleWorkout(t.id)}
                          className="w-full text-left px-3 py-3 rounded-lg border border-border bg-background hover:border-accent/50 min-h-[44px] flex items-center justify-between gap-2"
                        >
                          <span className="font-medium truncate">{t.name}</span>
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  to="/builder"
                  onClick={() => setScheduleModalOpen(false)}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors min-h-[44px]"
                >
                  <Plus className="w-4 h-4" aria-hidden />
                  Create new workout
                </Link>
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="mt-4 w-full py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {removeConfirm && (
            <div
              className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center bg-black/50 p-0 sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Remove workout?"
            >
              <div className="w-full max-w-md bg-card border-t sm:border border-border rounded-t-2xl sm:rounded-2xl p-4 pb-8 safe-area-pb mb-20 sm:mb-0">
                <h2 className="font-display text-lg font-semibold mb-2">Remove?</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Remove &quot;{removeConfirm.name}&quot; from today? You can schedule it again anytime.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRemoveConfirm(null)}
                    className="flex-1 py-3 rounded-lg border border-border font-medium min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveScheduledConfirm}
                    className="flex-1 py-3 rounded-lg border border-red-500/50 text-red-500 font-medium min-h-[44px] hover:bg-red-500/10 transition-colors"
                  >
                    Remove
                  </button>
                </div>
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
