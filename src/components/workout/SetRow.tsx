import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react'
import type { SessionSetRow } from '@/hooks/useWorkoutSession'

const inputClass =
  'px-3 py-2.5 rounded-lg bg-card border border-border text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px] min-w-[44px]'

/** Optional override when completing a time-based set (e.g. actual duration when done early or at 0). */
export type SetCompleteOverride = { actual_duration_seconds?: number }

interface SetRowProps {
  set: SessionSetRow
  /** Display label e.g. "Set 1" (use list index + 1 so order stays 1,2,3 after remove). */
  setNumberLabel?: number
  isTimeBased: boolean
  /** Template default for reps (pre-fills input, used on complete if user didn't change). */
  targetReps: number | null
  /** Template default for weight (pre-fills input, used on complete if user didn't change). */
  targetWeight: number | null
  /** Target duration in seconds for time-based sets; used for countdown and auto-complete. */
  targetDurationSeconds?: number | null
  onActualRepsChange: (value: number | null) => void
  onActualDurationChange: (value: number | null) => void
  onWeightChange: (value: number | null) => void
  onComplete: (override?: SetCompleteOverride) => void
  onRemove?: () => void
  canRemove?: boolean
  /** This is the set you're on right now (first incomplete set). Stays until marked done. */
  isCurrentSet?: boolean
  /** When true, do not start the countdown (e.g. rest timer is running after the previous set). */
  restTimerActive?: boolean
}

export function SetRow({
  set,
  setNumberLabel,
  isTimeBased,
  targetReps,
  targetWeight,
  targetDurationSeconds,
  onActualRepsChange,
  onActualDurationChange,
  onWeightChange,
  onComplete,
  onRemove,
  onRestart,
  canRemove,
  isCurrentSet,
  restTimerActive = false,
}: SetRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const displayReps = set.actual_reps ?? set.target_reps ?? targetReps
  const displayWeight = set.weight ?? targetWeight
  const displayDuration = set.actual_duration_seconds ?? set.target_duration_seconds
  const label = setNumberLabel ?? set.set_number

  const targetRepsLabel = set.target_reps ?? targetReps ?? '-'
  const targetWeightLabel =
    targetWeight != null && targetWeight > 0 ? targetWeight : '-'

  // Countdown for time-based current set: start when we become current and rest is not active, tick every second, auto-complete at 0
  const targetSec = targetDurationSeconds ?? set.target_duration_seconds ?? 0
  const showCountdown =
    isTimeBased && isCurrentSet && !set.completed && targetSec > 0 && !restTimerActive
  const startedAtRef = useRef<number | null>(null)
  const [tick, setTick] = useState(0)

  if (showCountdown && startedAtRef.current === null) {
    startedAtRef.current = Date.now()
  }
  if (!showCountdown) {
    startedAtRef.current = null
  }

  const elapsed = showCountdown && startedAtRef.current != null
    ? Math.floor((Date.now() - startedAtRef.current) / 1000)
    : 0
  const secondsLeft = showCountdown ? Math.max(0, targetSec - elapsed) : 0

  useEffect(() => {
    if (!showCountdown || secondsLeft <= 0) return
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [showCountdown, secondsLeft, tick])

  const hasAutoCompletedRef = useRef(false)
  if (!showCountdown) hasAutoCompletedRef.current = false
  useEffect(() => {
    if (showCountdown && secondsLeft <= 0 && !hasAutoCompletedRef.current) {
      hasAutoCompletedRef.current = true
      onComplete({ actual_duration_seconds: targetSec })
    }
  }, [showCountdown, secondsLeft, targetSec, onComplete])

  const handleCompleteClick = () => {
    if (isTimeBased && showCountdown && startedAtRef.current != null) {
      const elapsedSec = Math.min(
        targetSec,
        Math.floor((Date.now() - startedAtRef.current) / 1000)
      )
      onComplete({ actual_duration_seconds: elapsedSec })
    } else {
      onComplete()
    }
  }

  const highlightAsCurrent = isCurrentSet && !restTimerActive

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border p-3 transition-colors',
        highlightAsCurrent && 'border-2 border-accent bg-accent/10 ring-2 ring-accent ring-offset-2 ring-offset-background',
        !highlightAsCurrent && 'border-border bg-card',
        set.completed && !isCurrentSet && 'opacity-75 border-border/80 bg-muted/10'
      )}
    >
      <span className={cn(
        'w-10 text-sm font-medium shrink-0',
        highlightAsCurrent ? 'text-accent font-semibold' : 'text-muted-foreground'
      )}>
        Set {label}
      </span>
      <span className={cn(
        'w-24 text-sm shrink-0',
        highlightAsCurrent ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {isTimeBased
          ? `${displayDuration ?? '-'}s target`
          : `${targetRepsLabel} x ${targetWeightLabel} target`}
      </span>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {isTimeBased ? (
          showCountdown ? (
            <span
              className={cn(
                'flex-1 text-center font-display text-3xl font-bold tabular-nums min-h-[44px] flex items-center justify-center',
                secondsLeft > 0 ? 'text-accent' : 'text-muted-foreground'
              )}
              aria-live="polite"
              aria-atomic="true"
            >
              {secondsLeft}s
            </span>
          ) : (
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
          )
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
      <div className="flex items-center gap-1 shrink-0 min-h-[44px]">
        {((set.completed && onRestart) || (canRemove && onRemove)) ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((o) => !o)
              }}
              className="p-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              aria-label="Set options"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="w-5 h-5" aria-hidden />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-border bg-card py-1 shadow-lg"
                role="menu"
              >
                {set.completed && onRestart && (
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setMenuOpen(false)
                      onRestart()
                    }}
                  >
                    <RotateCcw className="w-4 h-4 text-muted-foreground" />
                    Restart set
                  </button>
                )}
                {canRemove && onRemove && (
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-red-500 hover:bg-red-500/10"
                    onClick={() => {
                      setMenuOpen(false)
                      onRemove()
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete set
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="w-11 min-h-[44px]" />
        )}
        <button
          type="button"
          onClick={handleCompleteClick}
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
    </div>
  )
}
