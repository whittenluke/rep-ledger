/**
 * Colloquial muscle group labels for filter chips.
 * Maps to anatomical primary_muscle values in the database.
 * See Documentation/MuscleGroupMapping.md.
 */

/** Anatomical primary muscle names for dropdowns (e.g. new exercise form). Matches system seed. */
export const PRIMARY_MUSCLES = [
  'Biceps',
  'Calves',
  'Core',
  'Deltoids',
  'Forearms',
  'Glutes',
  'Hamstrings',
  'Latissimus Dorsi',
  'Lower Back',
  'Pectorals',
  'Quadriceps',
  'Rhomboids',
  'Trapezius',
  'Triceps',
] as const

export type PrimaryMuscle = (typeof PRIMARY_MUSCLES)[number]

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
