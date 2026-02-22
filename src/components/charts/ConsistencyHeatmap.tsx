import { useMemo } from 'react'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface ConsistencyHeatmapProps {
  workoutDays: Set<string>
  weeks?: number
  className?: string
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function ConsistencyHeatmap({
  workoutDays,
  weeks = 12,
  className,
}: ConsistencyHeatmapProps) {
  const { grid, startDate } = useMemo(() => {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - (weeks * 7 - 1))
    const startDay = start.getDay()
    const padStart = startDay
    const totalDays = weeks * 7
    const cells: { dateStr: string; isWorkout: boolean }[] = []
    for (let i = 0; i < padStart + totalDays; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + (i - padStart))
      const dateStr = toDateStr(d)
      cells.push({
        dateStr,
        isWorkout: workoutDays.has(dateStr),
      })
    }
    return { grid: cells, startDate: start }
  }, [workoutDays, weeks])

  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="text-[10px] text-muted-foreground py-0.5">
            {label}
          </div>
        ))}
        {grid.map((cell, i) => (
          <div
            key={i}
            className={cn(
              'aspect-square rounded-[2px] min-w-[12px] min-h-[12px]',
              cell.isWorkout ? 'bg-accent' : 'bg-muted'
            )}
            title={cell.dateStr}
          />
        ))}
      </div>
    </div>
  )
}
