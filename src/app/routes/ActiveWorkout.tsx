import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkoutSession } from '@/hooks/useWorkoutSession'
import { useUserStore } from '@/store/user'
import { SetRow } from '@/components/workout/SetRow'
import { RestTimer } from '@/components/workout/RestTimer'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

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
    nextExercise,
    finishSession,
    elapsedSeconds,
  } = useWorkoutSession(id ?? null)

  const handleCompleteSet = useCallback(
    async (
      setId: string,
      payload: {
        actual_reps?: number | null
        actual_duration_seconds?: number | null
        weight?: number | null
      }
    ) => {
      await markSetComplete(setId, payload)
      if (defaultRestSeconds > 0) setRestSecondsLeft(defaultRestSeconds)
    },
    [markSetComplete, defaultRestSeconds]
  )

  const handleFinish = useCallback(async () => {
    if (!window.confirm('Finish this workout?')) return
    await finishSession()
    navigate('/')
  }, [finishSession, navigate])

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

  const isTimeBased = currentExercise.type === 'time'

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
      {currentExercise.muscle_group && (
        <p className="text-sm text-muted-foreground mb-4">{currentExercise.muscle_group}</p>
      )}

      <ul className="space-y-2 mb-4">
        {sets.map((set) => (
          <li key={set.id}>
            <SetRow
              set={set}
              isTimeBased={isTimeBased}
              onActualRepsChange={(v) => updateSet(set.id, { actual_reps: v })}
              onActualDurationChange={(v) => updateSet(set.id, { actual_duration_seconds: v })}
              onWeightChange={(v) => updateSet(set.id, { weight: v })}
              onComplete={() => {
                if (isTimeBased) {
                  handleCompleteSet(set.id, {
                    actual_duration_seconds: set.actual_duration_seconds ?? 0,
                  })
                } else {
                  handleCompleteSet(set.id, {
                    actual_reps: set.actual_reps ?? 0,
                    weight: set.weight ?? null,
                  })
                }
              }}
            />
          </li>
        ))}
      </ul>

      {restSecondsLeft > 0 && (
        <RestTimer
          seconds={restSecondsLeft}
          onComplete={() => setRestSecondsLeft(0)}
          onSkip={() => setRestSecondsLeft(0)}
          className="mb-4"
        />
      )}

      <div className="flex flex-col gap-2">
        {isLastExercise ? (
          <button
            type="button"
            onClick={handleFinish}
            className="w-full py-3 rounded-lg border border-border font-medium min-h-[44px]"
          >
            Finish workout
          </button>
        ) : (
          <button
            type="button"
            onClick={nextExercise}
            className="w-full py-3 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px]"
          >
            Next exercise
          </button>
        )}
      </div>
    </div>
  )
}
