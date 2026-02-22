import { cn } from '@/lib/utils'

interface DayCellProps {
  date: Date | null
  isCurrentMonth: boolean
  isToday: boolean
  isScheduled: boolean
  isCompleted: boolean
  onClick: () => void
}

export function DayCell({
  date,
  isCurrentMonth,
  isToday,
  isScheduled,
  isCompleted,
  onClick,
}: DayCellProps) {
  if (!date) {
    return <div className="aspect-square p-1" />
  }

  const day = date.getDate()

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'aspect-square p-1 flex flex-col items-center justify-center rounded-lg min-h-[44px]',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset',
        isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50',
        isToday && 'ring-2 ring-accent ring-inset'
      )}
    >
      <span className="text-sm font-medium">{day}</span>
      <div className="flex gap-0.5 mt-0.5">
        {isCompleted && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"
            title="Completed"
            aria-hidden
          />
        )}
        {isScheduled && !isCompleted && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0"
            title="Scheduled"
            aria-hidden
          />
        )}
      </div>
    </button>
  )
}
