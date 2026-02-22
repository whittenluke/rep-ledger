/**
 * Colloquial muscle group labels for filter chips.
 * Maps to anatomical primary_muscle values in the database.
 * See Documentation/MuscleGroupMapping.md.
 */
export const MUSCLE_GROUP_LABELS = [
  'Chest',
  'Shoulders',
  'Triceps',
  'Biceps',
  'Back',
  'Legs',
  'Core',
] as const

export type MuscleGroupLabel = (typeof MUSCLE_GROUP_LABELS)[number]

/** Colloquial label → anatomical primary_muscle values */
export const MUSCLE_GROUP_TO_PRIMARY_MUSCLES: Record<MuscleGroupLabel, string[]> = {
  Chest: ['Pectorals'],
  Shoulders: ['Deltoids'],
  Triceps: ['Triceps'],
  Biceps: ['Biceps'],
  Back: ['Latissimus Dorsi', 'Rhomboids', 'Trapezius'],
  Legs: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
  Core: ['Core', 'Lower Back'],
}
