import { cn } from '@/lib/utils'
import { Check, Trash2 } from 'lucide-react'
import type { SessionSetRow } from '@/hooks/useWorkoutSession'

const inputClass =
  'px-3 py-2.5 rounded-lg bg-card border border-border text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px] min-w-[44px]'

interface SetRowProps {
  set: SessionSetRow
  /** Display label e.g. "Set 1" (use list index + 1 so order stays 1,2,3 after remove). */
  setNumberLabel?: number
  isTimeBased: boolean
  /** Template default for reps (pre-fills input, used on complete if user didn't change). */
  targetReps: number | null
  /** Template default for weight (pre-fills input, used on complete if user didn't change). */
  targetWeight: number | null
  onActualRepsChange: (value: number | null) => void
  onActualDurationChange: (value: number | null) => void
  onWeightChange: (value: number | null) => void
  onComplete: () => void
  onRemove?: () => void
  canRemove?: boolean
  /** This is the set you're on right now (first incomplete set). Stays until marked done. */
  isCurrentSet?: boolean
}

export function SetRow({
  set,
  setNumberLabel,
  isTimeBased,
  targetReps,
  targetWeight,
  onActualRepsChange,
  onActualDurationChange,
  onWeightChange,
  onComplete,
  onRemove,
  canRemove,
  isCurrentSet,
}: SetRowProps) {
  const displayReps = set.actual_reps ?? set.target_reps ?? targetReps
  const displayWeight = set.weight ?? targetWeight
  const displayDuration = set.actual_duration_seconds ?? set.target_duration_seconds
  const label = setNumberLabel ?? set.set_number

  const targetRepsLabel = set.target_reps ?? targetReps ?? '-'
  const targetWeightLabel =
    targetWeight != null && targetWeight > 0 ? targetWeight : '-'

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border p-3 transition-colors',
        isCurrentSet && 'border-2 border-accent bg-accent/10 ring-2 ring-accent ring-offset-2 ring-offset-background',
        !isCurrentSet && 'border-border bg-card',
        set.completed && !isCurrentSet && 'opacity-75 border-border/80 bg-muted/10'
      )}
    >
      <span className={cn(
        'w-10 text-sm font-medium shrink-0',
        isCurrentSet ? 'text-accent font-semibold' : 'text-muted-foreground'
      )}>
        Set {label}
      </span>
      <span className={cn(
        'w-24 text-sm shrink-0',
        isCurrentSet ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {isTimeBased
          ? `${displayDuration ?? '-'}s target`
          : `${targetRepsLabel} x ${targetWeightLabel} target`}
      </span>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {isTimeBased ? (
          <input
            type="number"
            min={0}
            placeholder="Sec"
            value={displayDuration ?? ''}
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
              placeholder={targetReps != null ? String(targetReps) : 'Reps'}
              value={displayReps ?? ''}
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
              placeholder={targetWeight != null && targetWeight > 0 ? String(targetWeight) : 'Wt'}
              value={displayWeight ?? ''}
              onChange={(e) => {
                const v = e.target.value
                onWeightChange(v === '' ? null : parseFloat(v) || 0)
              }}
              className={cn(inputClass, 'w-20 shrink-0')}
              inputMode="decimal"
              disabled={set.completed}
            />
          </>
        )}
      </div>
      <div className="w-11 shrink-0 flex items-center justify-center min-h-[44px]">
        {onRemove && canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="p-2.5 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Remove set"
          >
            <Trash2 className="w-5 h-5" aria-hidden />
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onComplete}
        className={cn(
          'w-[72px] shrink-0 px-3 py-2.5 rounded-lg font-medium min-h-[44px] flex items-center justify-center',
          set.completed
            ? 'bg-accent/25 text-accent border border-accent/40'
            : 'bg-accent text-primary-foreground'
        )}
      >
        {set.completed ? (
          <Check className="w-6 h-6" strokeWidth={2.5} aria-hidden />
        ) : (
          'Done'
        )}
      </button>
    </div>
  )
}
