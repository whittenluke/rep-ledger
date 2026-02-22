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
        'flex items-center gap-2 py-4 px-4 rounded-xl border-2 border-accent/60 bg-accent/15 min-h-[72px]',
        className
      )}
    >
      <span
        key={remaining}
        className="flex-1 text-center font-display text-3xl font-bold tabular-nums text-accent animate-rest-pulse"
      >
        Rest: {remaining}s
      </span>
      <button
        type="button"
        onClick={onSkip}
        className="w-[72px] shrink-0 px-3 py-2.5 rounded-lg bg-accent/25 text-accent font-semibold min-h-[44px] hover:bg-accent/35 transition-colors"
      >
        Skip
      </button>
    </div>
  )
}
