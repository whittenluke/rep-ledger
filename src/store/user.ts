import { create } from 'zustand'

export interface UserState {
  weightUnit: 'kg' | 'lbs'
  defaultRestSeconds: number
  setWeightUnit: (unit: 'kg' | 'lbs') => void
  setDefaultRestSeconds: (seconds: number) => void
}

export const useUserStore = create<UserState>()((set) => ({
  weightUnit: 'kg',
  defaultRestSeconds: 90,
  setWeightUnit: (unit) => set({ weightUnit: unit }),
  setDefaultRestSeconds: (seconds) => set({ defaultRestSeconds: Math.max(0, seconds) }),
}))
