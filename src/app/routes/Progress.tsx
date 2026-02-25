import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useProgressAnalytics, useExerciseProgress } from '@/hooks/useProgressAnalytics'
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates'
import { useExercises } from '@/hooks/useExercises'
import { useUserStore } from '@/store/user'
import { ConsistencyHeatmap } from '@/components/charts/ConsistencyHeatmap'
import { VolumeChart } from '@/components/charts/VolumeChart'
import { WeightProgressChart } from '@/components/charts/WeightProgressChart'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

export function Progress() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)

  const {
    workoutDays,
    currentStreak,
    weeklyVolume,
    sessions,
    sets,
    sessionById,
    templateIds,
    volumeByTemplate,
    loading,
    error,
    refetch,
  } = useProgressAnalytics()

  const { templates } = useWorkoutTemplates()
  const { exercises } = useExercises()
  const weightUnit = useUserStore((s) => s.weightUnit)

  const templatesWithSessions = templates.filter((t) => templateIds.includes(t.id))
  const selectedTemplate = selectedTemplateId ?? templatesWithSessions[0]?.id ?? null
  const volumeForTemplate = selectedTemplate ? volumeByTemplate(selectedTemplate) : []

  const exerciseProgress = useExerciseProgress(
    selectedExerciseId,
    sessions,
    sets,
    sessionById
  )

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <PageHeader title="Progress" />
        <LoadingState message="Loading analytics…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 pb-20">
        <PageHeader title="Progress" />
        <ErrorState
          message="Failed to load analytics"
          description="Check your connection and try again."
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2.5 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px]"
            >
              Try again
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className="p-4 pb-20 space-y-8">
      <PageHeader title="Progress" />

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-1">
          Consistency
        </h2>
        <p className="text-sm text-muted-foreground mb-2">
          Workout days (last 12 weeks)
        </p>
        <ConsistencyHeatmap workoutDays={workoutDays} className="max-w-[280px]" />
        <p className="mt-2 text-sm text-foreground">
          Current streak: <span className="font-semibold text-accent">{currentStreak}</span> day
          {currentStreak !== 1 ? 's' : ''}
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-1">
          Volume over time
        </h2>
        <p className="text-sm text-muted-foreground mb-2">
          Total volume ({weightUnit}), sum of reps x weight per set. Each point is one week (Monday-Sunday).
        </p>
        {weeklyVolume.length === 0 ? (
          <p className="text-sm text-muted-foreground">No volume data yet.</p>
        ) : (
          <VolumeChart data={weeklyVolume} unit={weightUnit} />
        )}
      </section>

      {templatesWithSessions.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-1">
            By workout
          </h2>
          <p className="text-sm text-muted-foreground mb-2">
            Volume by template ({weightUnit}). Each point is one week (Monday-Sunday).
          </p>
          <select
            value={selectedTemplate ?? ''}
            onChange={(e) => setSelectedTemplateId(e.target.value || null)}
            className="w-full max-w-xs px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm mb-2"
          >
            {templatesWithSessions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {volumeForTemplate.length === 0 ? (
            <EmptyState message="No volume for this template yet" description="Run this workout and log sets to see trends." />
          ) : (
            <VolumeChart data={volumeForTemplate} unit={weightUnit} />
          )}
        </section>
      )}

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-1">
          By exercise
        </h2>
        <p className="text-sm text-muted-foreground mb-2">
          Max weight and volume for one exercise
        </p>
        <select
          value={selectedExerciseId ?? ''}
          onChange={(e) => setSelectedExerciseId(e.target.value || null)}
          className="w-full max-w-xs px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm mb-3"
        >
          <option value="">Select exercise…</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
        {selectedExerciseId ? (
          <div className="space-y-4">
            {exerciseProgress.maxWeightByDate.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Max weight over time</p>
                <WeightProgressChart data={exerciseProgress.maxWeightByDate} />
              </div>
            )}
            {exerciseProgress.volumeByDate.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Volume over time ({weightUnit}), per workout day</p>
                <VolumeChart
                  data={exerciseProgress.volumeByDate.map((d) => ({ week: d.date, volume: d.volume }))}
                  unit={weightUnit}
                  bucket="day"
                />
              </div>
            )}
            {exerciseProgress.bestSet && (
              <div className="p-3 rounded-lg border border-border bg-card">
                <p className="text-xs text-muted-foreground mb-1">Best set ever</p>
                <p className="font-display text-xl font-semibold text-accent">
                  {exerciseProgress.bestSet.weight} × {exerciseProgress.bestSet.reps} reps
                </p>
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const [y, m, d] = exerciseProgress.bestSet.date.split('-').map(Number)
                    return new Date(y, m - 1, d).toLocaleDateString()
                  })()}
                </p>
              </div>
            )}
            {exerciseProgress.maxWeightByDate.length === 0 &&
              exerciseProgress.volumeByDate.length === 0 &&
              !exerciseProgress.bestSet && (
                <p className="text-sm text-muted-foreground">No data for this exercise yet.</p>
              )}
          </div>
        ) : (
          <EmptyState message="Select an exercise" description="Choose an exercise above to see max weight, volume, and best set." />
        )}
      </section>
    </div>
  )
}
