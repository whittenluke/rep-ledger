import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkoutSession } from '@/hooks/useWorkoutSession'
import { useUserStore } from '@/store/user'
import { SetRow } from '@/components/workout/SetRow'
import { RestTimer } from '@/components/workout/RestTimer'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { Play } from 'lucide-react'

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ActiveWorkout() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const defaultRestSeconds = useUserStore((s) => s.defaultRestSeconds)
  const [restSecondsLeft, setRestSecondsLeft] = useState(0)
  const [restTimerAfterSetId, setRestTimerAfterSetId] = useState<string | null>(null)
  const [exerciseStarted, setExerciseStarted] = useState(false)
  const [highlightNextExercise, setHighlightNextExercise] = useState(false)

  const {
    templateName,
    currentExercise,
    currentExerciseIndex,
    exercises,
    isLastExercise,
    isFinished,
    sets,
    loading,
    error,
    updateSet,
    markSetComplete,
    addSet,
    removeSet,
    nextExercise,
    finishSession,
    elapsedSeconds,
  } = useWorkoutSession(id ?? null)

  const handleCompleteSet = useCallback(
    async (setId: string, setRow: (typeof sets)[0]) => {
      const payload =
        currentExercise?.type === 'time'
          ? {
              actual_duration_seconds:
                setRow.actual_duration_seconds ??
                setRow.target_duration_seconds ??
                currentExercise.target_duration_seconds ??
                0,
            }
          : {
              actual_reps:
                setRow.actual_reps ??
                setRow.target_reps ??
                currentExercise?.target_reps ??
                0,
              weight:
                setRow.weight ?? currentExercise?.target_weight ?? null,
            }
      await markSetComplete(setId, payload)
      if (defaultRestSeconds > 0) {
        setRestTimerAfterSetId(setId)
        setRestSecondsLeft(defaultRestSeconds)
      }
    },
    [markSetComplete, defaultRestSeconds, currentExercise]
  )

  useEffect(() => {
    setExerciseStarted(false)
  }, [currentExerciseIndex])

  const handleFinish = useCallback(async () => {
    if (!window.confirm('Finish this workout?')) return
    await finishSession()
    navigate('/')
  }, [finishSession, navigate])

  const handleRestComplete = useCallback(() => {
    const restSetIndex = restTimerAfterSetId
      ? sets.findIndex((s) => s.id === restTimerAfterSetId)
      : -1
    setRestSecondsLeft(0)
    setRestTimerAfterSetId(null)
    if (restSetIndex >= 0 && restSetIndex + 1 >= sets.length) {
      setHighlightNextExercise(true)
    }
  }, [restTimerAfterSetId, sets])

  useEffect(() => {
    if (!highlightNextExercise) return
    const t = setTimeout(() => setHighlightNextExercise(false), 4000)
    return () => clearTimeout(t)
  }, [highlightNextExercise])

  if (!id) {
    return (
      <div className="p-4 pb-20">
        <p className="text-muted-foreground">No workout selected.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <LoadingState message="Loading workout…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 pb-20">
        <p className="text-red-500">Something went wrong.</p>
        <button type="button" onClick={() => navigate('/')} className="mt-2 text-accent">
          Back to home
        </button>
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="p-4 pb-20 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="font-display text-xl font-semibold text-accent">Workout complete</p>
        <button
          type="button"
          onClick={handleFinish}
          className="mt-4 px-6 py-3 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px]"
        >
          Finish & save
        </button>
      </div>
    )
  }

  if (!currentExercise) {
    return (
      <div className="p-4 pb-20">
        <EmptyState
          message="No exercises in this workout"
          description="Add exercises to the template in Workout Builder."
        />
      </div>
    )
  }

  const isTimeBased = currentExercise?.type === 'time'

  if (!exerciseStarted) {
    return (
      <div className="p-4 pb-24 flex flex-col min-h-[60vh]">
        <header className="mb-4">
          <p className="font-display text-lg font-semibold text-foreground truncate">
            {templateName}
          </p>
          <p className="text-2xl font-display font-semibold tabular-nums text-accent">
            {formatElapsed(elapsedSeconds)}
          </p>
        </header>
        <p className="text-xs text-muted-foreground mb-1">
          Exercise {currentExerciseIndex + 1} of {exercises.length}
        </p>
        <h2 className="font-display text-2xl font-semibold text-foreground mb-1">
          {currentExercise.name}
        </h2>
        {currentExercise.primary_muscle && (
          <p className="text-sm text-muted-foreground mb-8">{currentExercise.primary_muscle}</p>
        )}
        <div className="flex-1 flex flex-col justify-center">
          <button
            type="button"
            onClick={() => setExerciseStarted(true)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-lg bg-accent text-primary-foreground font-semibold text-lg min-h-[56px]"
          >
            <Play className="w-6 h-6" aria-hidden />
            Start exercise
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24">
      <header className="mb-4">
        <p className="font-display text-lg font-semibold text-foreground truncate">
          {templateName}
        </p>
        <p className="text-2xl font-display font-semibold tabular-nums text-accent">
          {formatElapsed(elapsedSeconds)}
        </p>
      </header>

      <p className="text-xs text-muted-foreground mb-1">
        Exercise {currentExerciseIndex + 1} of {exercises.length}
      </p>
      <h2 className="font-display text-xl font-semibold text-foreground">
        {currentExercise.name}
      </h2>
      {currentExercise.primary_muscle && (
        <p className="text-sm text-muted-foreground mb-4">{currentExercise.primary_muscle}</p>
      )}

      <ul className="space-y-2 mb-2">
        {sets.map((set, index) => {
          const currentSetIndex = sets.findIndex((s) => !s.completed)
          const isCurrentSet = currentSetIndex === index
          return (
            <li key={set.id} className="flex flex-col gap-2">
              {isCurrentSet && (
                <p className="text-xs font-medium text-accent">Current set</p>
              )}
              <SetRow
                set={set}
                setNumberLabel={index + 1}
                isTimeBased={isTimeBased}
                targetReps={set.target_reps ?? currentExercise.target_reps ?? null}
                targetWeight={set.target_weight ?? currentExercise.target_weight ?? null}
                onActualRepsChange={(v) => updateSet(set.id, { actual_reps: v })}
                onActualDurationChange={(v) => updateSet(set.id, { actual_duration_seconds: v })}
                onWeightChange={(v) => updateSet(set.id, { weight: v })}
                onComplete={() => handleCompleteSet(set.id, set)}
                onRemove={() => removeSet(set.id).catch((err) => console.error(err))}
                canRemove={!set.completed && sets.length > 1}
                isCurrentSet={isCurrentSet}
              />
              {restTimerAfterSetId === set.id && restSecondsLeft > 0 && (
                <RestTimer
                  seconds={restSecondsLeft}
                  onComplete={handleRestComplete}
                  onSkip={handleRestComplete}
                />
              )}
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        onClick={() => addSet().catch((err) => console.error(err))}
        className="w-full py-2.5 rounded-lg border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-accent/50 min-h-[44px] mb-4"
      >
        + Add set
      </button>

      <div className="flex flex-col gap-2">
        {restTimerAfterSetId != null &&
        sets.findIndex((s) => s.id === restTimerAfterSetId) + 1 >= sets.length ? (
          <p className="text-center text-sm font-medium text-accent">
            Last set done. Tap Next exercise below when ready.
          </p>
        ) : highlightNextExercise ? (
          <p className="text-center text-sm font-medium text-accent">
            Rest done. Tap below to continue.
          </p>
        ) : null}
        {isLastExercise ? (
          <button
            type="button"
            onClick={handleFinish}
            className={cn(
              'w-full py-3 rounded-lg border font-medium min-h-[44px]',
              highlightNextExercise
                ? 'border-accent bg-accent/15 text-accent animate-rest-pulse'
                : 'border-border'
            )}
          >
            Finish workout
          </button>
        ) : (
          <button
            type="button"
            onClick={nextExercise}
            className={cn(
              'w-full py-3 rounded-lg font-medium min-h-[44px]',
              highlightNextExercise
                ? 'bg-accent text-primary-foreground ring-2 ring-accent ring-offset-2 ring-offset-background'
                : 'bg-accent text-primary-foreground'
            )}
          >
            Next exercise
          </button>
        )}
      </div>
    </div>
  )
}
