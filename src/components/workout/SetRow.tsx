import { cn } from '@/lib/utils'
import type { SessionSetRow } from '@/hooks/useWorkoutSession'

const inputClass =
  'px-3 py-2.5 rounded-lg bg-card border border-border text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px] min-w-[44px]'

interface SetRowProps {
  set: SessionSetRow
  isTimeBased: boolean
  onActualRepsChange: (value: number | null) => void
  onActualDurationChange: (value: number | null) => void
  onWeightChange: (value: number | null) => void
  onComplete: () => void
}

export function SetRow({
  set,
  isTimeBased,
  onActualRepsChange,
  onActualDurationChange,
  onWeightChange,
  onComplete,
}: SetRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-3 rounded-lg border border-border bg-card',
        set.completed && 'border-accent/50 bg-accent/5'
      )}
    >
      <span className="w-8 text-sm font-medium text-muted-foreground shrink-0">
        Set {set.set_number}
      </span>
      <span className="text-sm text-muted-foreground shrink-0">
        {isTimeBased
          ? `${set.target_duration_seconds ?? '—'}s`
          : `${set.target_reps ?? '—'} × target`}
      </span>
      <div className="flex-1 flex items-center gap-2 flex-wrap">
        {isTimeBased ? (
          <input
            type="number"
            min={0}
            placeholder="Sec"
            value={set.actual_duration_seconds ?? ''}
            onChange={(e) => {
              const v = e.target.value
              onActualDurationChange(v === '' ? null : parseInt(v, 10) || 0)
            }}
            className={cn(inputClass, 'flex-1 min-w-0')}
            inputMode="numeric"
            disabled={set.completed}
          />
        ) : (
          <>
            <input
              type="number"
              min={0}
              placeholder="Reps"
              value={set.actual_reps ?? ''}
              onChange={(e) => {
                const v = e.target.value
                onActualRepsChange(v === '' ? null : parseInt(v, 10) || 0)
              }}
              className={cn(inputClass, 'flex-1 min-w-0')}
              inputMode="numeric"
              disabled={set.completed}
            />
            <input
              type="number"
              min={0}
              step={0.5}
              placeholder="Wt"
              value={set.weight ?? ''}
              onChange={(e) => {
                const v = e.target.value
                onWeightChange(v === '' ? null : parseFloat(v) || 0)
              }}
              className={cn(inputClass, 'w-20')}
              inputMode="decimal"
              disabled={set.completed}
            />
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onComplete}
        className={cn(
          'shrink-0 px-3 py-2.5 rounded-lg font-medium min-h-[44px] min-w-[44px]',
          set.completed
            ? 'bg-accent/20 text-accent'
            : 'bg-accent text-primary-foreground'
        )}
      >
        {set.completed ? '✓' : 'Done'}
      </button>
    </div>
  )
}
