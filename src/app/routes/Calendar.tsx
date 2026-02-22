import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCalendar } from '@/hooks/useCalendar'
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates'
import { WeekView } from '@/components/calendar/WeekView'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { LoadingState } from '@/components/ui/LoadingSpinner'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function Calendar() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)

  const {
    scheduled,
    completedDates,
    loading,
    error,
    createScheduled,
    removeScheduled,
    getScheduledForDate,
  } = useCalendar(year, month)

  const { templates } = useWorkoutTemplates()

  const scheduledDates = useMemo(
    () => new Set(scheduled.map((s) => s.scheduled_date)),
    [scheduled]
  )

  const selectedScheduled = selectedDate ? getScheduledForDate(selectedDate) : null
  const isCompleted = selectedDate ? completedDates.has(selectedDate) : false

  function prevMonth() {
    if (month === 1) {
      setMonth(12)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  async function handleAssign(templateId: string) {
    if (!selectedDate) return
    try {
      await createScheduled(templateId, selectedDate)
      setAssignOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleRemove() {
    if (!selectedScheduled?.id) return
    if (!window.confirm('Remove this scheduled workout?')) return
    try {
      await removeScheduled(selectedScheduled.id)
      setSelectedDate(null)
    } catch (err) {
      console.error(err)
    }
  }

  function formatSelectedDate(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00')
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  }

  return (
    <div className="p-4 pb-20">
      <PageHeader title="Calendar" />

      <div className="flex items-center justify-between mt-4 mb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-display text-lg font-semibold">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Next month"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-2">Failed to load calendar.</p>
      )}

      {loading ? (
        <LoadingState message="Loading calendar…" />
      ) : (
        <WeekView
          year={year}
          month={month}
          scheduledDates={scheduledDates}
          completedDates={completedDates}
          onDayClick={setSelectedDate}
        />
      )}

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/50">
          <div
            className="w-full max-w-md bg-card border-t sm:border border-border rounded-t-2xl sm:rounded-2xl p-4 pb-8 mb-14 sm:mb-0 safe-area-pb"
            role="dialog"
            aria-label="Day details"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">
                {formatSelectedDate(selectedDate)}
              </h2>
              <button
                type="button"
                onClick={() => { setSelectedDate(null); setAssignOpen(false) }}
                className="p-2 rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!assignOpen ? (
              <>
                {selectedScheduled ? (
                  <div className="space-y-3">
                    <p className="text-foreground font-medium">
                      {selectedScheduled.workout_templates?.name ?? 'Workout'}
                    </p>
                    {isCompleted && (
                      <p className="text-sm text-muted-foreground">Completed</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(null)
                            navigate(`/session/${selectedScheduled.id}`)
                          }}
                          className="px-4 py-3 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px]"
                        >
                          Start workout
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleRemove}
                        className="px-4 py-3 rounded-lg border border-border min-h-[44px]"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignOpen(true)}
                        className="px-4 py-3 rounded-lg border border-border min-h-[44px]"
                      >
                        Add workout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-muted-foreground mb-3">No workout scheduled</p>
                    <button
                      type="button"
                      onClick={() => setAssignOpen(true)}
                      className="px-4 py-3 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px]"
                    >
                      Assign template
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Choose a template</p>
                <ul className="space-y-2 max-h-60 overflow-auto">
                  {templates.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => handleAssign(t.id)}
                        className="w-full text-left px-3 py-3 rounded-lg border border-border bg-background hover:border-accent/50 min-h-[44px]"
                      >
                        {t.name}
                      </button>
                    </li>
                  ))}
                </ul>
                {templates.length === 0 && (
                  <p className="text-sm text-muted-foreground">No templates. Create one in Workout Builder.</p>
                )}
                <button
                  type="button"
                  onClick={() => setAssignOpen(false)}
                  className="mt-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
