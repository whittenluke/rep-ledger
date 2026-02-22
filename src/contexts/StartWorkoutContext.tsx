import { createContext, useCallback, useContext, useState } from 'react'
import { StartWorkoutSheet } from '@/components/workout/StartWorkoutSheet'

interface StartWorkoutContextValue {
  openStartWorkout: () => void
}

const StartWorkoutContext = createContext<StartWorkoutContextValue | null>(null)

export function StartWorkoutProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const openStartWorkout = useCallback(() => setOpen(true), [])
  const onClose = useCallback(() => setOpen(false), [])

  return (
    <StartWorkoutContext.Provider value={{ openStartWorkout }}>
      {children}
      <StartWorkoutSheet open={open} onClose={onClose} />
    </StartWorkoutContext.Provider>
  )
}

export function useStartWorkout() {
  const ctx = useContext(StartWorkoutContext)
  if (!ctx) throw new Error('useStartWorkout must be used within StartWorkoutProvider')
  return ctx
}
