import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserState {
  weightUnit: 'kg' | 'lbs'
  defaultRestSeconds: number
  setWeightUnit: (unit: 'kg' | 'lbs') => void
  setDefaultRestSeconds: (seconds: number) => void
}

const restClamp = (n: number) => Math.min(600, Math.max(0, Math.round(n)))

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      weightUnit: 'lbs',
      defaultRestSeconds: 90,
      setWeightUnit: (unit) => set({ weightUnit: unit }),
      setDefaultRestSeconds: (seconds) => set({ defaultRestSeconds: restClamp(seconds) }),
    }),
    {
      name: 'rep-ledger-user-prefs',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }
  )
)
