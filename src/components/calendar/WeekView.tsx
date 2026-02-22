import { useMemo } from 'react'
import { DayCell } from './DayCell'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface WeekViewProps {
  year: number
  month: number
  scheduledDates: Set<string>
  completedDates: Set<string>
  onDayClick: (dateStr: string) => void
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function WeekView({
  year,
  month,
  scheduledDates,
  completedDates,
  onDayClick,
}: WeekViewProps) {
  const { cells, startPad } = useMemo(() => {
    const first = new Date(year, month - 1, 1)
    const last = new Date(year, month, 0)
    const firstDayOfWeek = first.getDay()
    const daysInMonth = last.getDate()
    const startPad = firstDayOfWeek
    const totalCells = startPad + daysInMonth
    const rows = Math.ceil(totalCells / 7)
    const cells: (Date | null)[] = []
    let dayIndex = 0
    for (let i = 0; i < rows * 7; i++) {
      if (i < startPad) {
        cells.push(null)
      } else if (dayIndex < daysInMonth) {
        cells.push(new Date(year, month - 1, dayIndex + 1))
        dayIndex++
      } else {
        cells.push(null)
      }
    }
    return { cells, startPad }
  }, [year, month])

  const todayStr = toDateStr(new Date())

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-1">
        {DAY_LABELS.map((label) => (
          <div key={label} className="py-1 font-medium">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border border-border rounded-lg overflow-hidden">
        {cells.map((date, i) => {
          const dateStr = date ? toDateStr(date) : ''
          const isCurrentMonth = !!date && date.getMonth() === month - 1
          return (
            <DayCell
              key={i}
              date={date}
              isCurrentMonth={!!date}
              isToday={dateStr === todayStr}
              isScheduled={dateStr ? scheduledDates.has(dateStr) : false}
              isCompleted={dateStr ? completedDates.has(dateStr) : false}
              onClick={() => dateStr && onDayClick(dateStr)}
            />
          )
        })}
      </div>
    </div>
  )
}
