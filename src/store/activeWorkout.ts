import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface ActiveWorkoutState {
  sessionId: string | null
  startedAt: string | null
  scheduledWorkoutId: string | null
  currentExerciseIndex: number
  reset: () => void
  setSession: (sessionId: string, startedAt: string, scheduledWorkoutId: string) => void
  setCurrentExerciseIndex: (index: number) => void
  nextExercise: () => void
}

const initialState = {
  sessionId: null,
  startedAt: null,
  scheduledWorkoutId: null,
  currentExerciseIndex: 0,
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set) => ({
      ...initialState,
      reset: () => set(initialState),
      setSession: (sessionId, startedAt, scheduledWorkoutId) =>
        set({ sessionId, startedAt, scheduledWorkoutId, currentExerciseIndex: 0 }),
      setCurrentExerciseIndex: (currentExerciseIndex) => set({ currentExerciseIndex }),
      nextExercise: () => set((s) => ({ currentExerciseIndex: s.currentExerciseIndex + 1 })),
    }),
    {
      name: 'rep-ledger-active-workout',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
    }
  )
)
