import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface RestTimerProps {
  seconds: number
  onComplete: () => void
  onSkip: () => void
  className?: string
}

export function RestTimer({ seconds, onComplete, onSkip, className }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) {
      onComplete()
      return
    }
    const t = setInterval(() => setRemaining((r) => (r <= 1 ? 0 : r - 1)), 1000)
    return () => clearInterval(t)
  }, [remaining, onComplete])

  if (remaining <= 0) return null

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 p-3 rounded-lg border border-accent/50 bg-accent/10',
        className
      )}
    >
      <span className="font-display text-lg font-semibold text-accent">
        Rest: {remaining}s
      </span>
      <button
        type="button"
        onClick={onSkip}
        className="px-3 py-2 rounded-lg bg-accent/20 text-accent font-medium min-h-[44px]"
      >
        Skip
      </button>
    </div>
  )
}
