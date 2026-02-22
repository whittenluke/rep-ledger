import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCalendar } from '@/hooks/useCalendar'
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory'
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dumbbell, ChevronRight, Plus } from 'lucide-react'
import type { ScheduledWorkout } from '@/hooks/useCalendar'

function toLocalDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface StartWorkoutSheetProps {
  open: boolean
  onClose: () => void
}

export function StartWorkoutSheet({ open, onClose }: StartWorkoutSheetProps) {
  const navigate = useNavigate()
  const now = new Date()
  const todayStr = toLocalDateStr(now)
  const { scheduled, loading: calendarLoading, createScheduled, refetch: refetchCalendar } = useCalendar(
    now.getFullYear(),
    now.getMonth() + 1
  )
  const { sessions: recentSessions, loading: historyLoading } = useWorkoutHistory()
  const { templates } = useWorkoutTemplates()
  const [startingTemplateId, setStartingTemplateId] = useState<string | null>(null)

  const notCompletedTodayList = useMemo(() => {
    const list = scheduled.filter((s) => s.scheduled_date === todayStr)
    const completedIds = new Set(
      recentSessions
        .filter((s) => s.scheduled_workout_id && list.some((t) => t.id === s.scheduled_workout_id))
        .map((s) => s.scheduled_workout_id as string)
    )
    return list.filter((s) => !completedIds.has(s.id))
  }, [scheduled, todayStr, recentSessions])

  const loading = calendarLoading || historyLoading

  function handleStartScheduled(s: ScheduledWorkout) {
    onClose()
    navigate(`/session/${s.id}`)
  }

  async function handleStartFromTemplate(templateId: string) {
    try {
      setStartingTemplateId(templateId)
      const created = await createScheduled(templateId, todayStr)
      await refetchCalendar()
      onClose()
      navigate(`/session/${created.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setStartingTemplateId(null)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/60 sm:bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Start workout"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md bg-card border-t sm:border border-border rounded-t-2xl sm:rounded-2xl shadow-xl animate-in slide-in-from-bottom duration-200 sm:animate-in sm:fade-in sm:zoom-in-95 sm:duration-200 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="font-display text-lg font-semibold text-foreground">Start workout</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-4 pb-8 safe-area-pb overflow-y-auto">
          {loading ? (
            <LoadingState message="Loading…" />
          ) : notCompletedTodayList.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">Today&apos;s scheduled workouts</p>
              <ul className="space-y-2">
                {notCompletedTodayList.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => handleStartScheduled(s)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-accent text-primary-foreground font-semibold min-h-[48px] hover:opacity-90 transition-opacity"
                    >
                      <span className="flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 shrink-0" aria-hidden />
                        {s.workout_templates?.name ?? 'Workout'}
                      </span>
                      <ChevronRight className="w-5 h-5 shrink-0" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground mt-4 mb-2">Or start a different template</p>
              {templates.length === 0 ? (
                <EmptyState
                  message="No templates yet"
                  description="Create one in Workout Builder first."
                />
              ) : (
                <ul className="space-y-2">
                  {templates
                    .filter((t) => !notCompletedTodayList.some((s) => s.template_id === t.id))
                    .map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => handleStartFromTemplate(t.id)}
                          disabled={startingTemplateId !== null}
                          className="w-full text-left px-4 py-3 rounded-lg border border-border bg-background hover:border-accent/50 min-h-[44px] flex items-center justify-between gap-2 disabled:opacity-50"
                        >
                          <span className="font-medium truncate">{t.name}</span>
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">No workout scheduled for today. Pick a template to start now.</p>
              {templates.length === 0 ? (
                <EmptyState
                  message="No templates yet"
                  description="Create one in Workout Builder first."
                />
              ) : (
                <ul className="space-y-2">
                  {templates.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => handleStartFromTemplate(t.id)}
                        disabled={startingTemplateId !== null}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border bg-background hover:border-accent/50 min-h-[48px] disabled:opacity-50"
                      >
                        <span className="font-medium truncate">{t.name}</span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {templates.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/builder')
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors min-h-[44px]"
            >
              <Plus className="w-4 h-4" aria-hidden />
              Create new template
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
