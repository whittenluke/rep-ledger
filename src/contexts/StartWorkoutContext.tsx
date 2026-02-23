import { createContext, useCallback, useContext, useState } from 'react'
import { StartWorkoutSheet } from '@/components/workout/StartWorkoutSheet'

interface StartWorkoutContextValue {
  openStartWorkout: () => void
}

const noop = () => {}

const StartWorkoutContext = createContext<StartWorkoutContextValue>({ openStartWorkout: noop })

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
  return useContext(StartWorkoutContext)
}
