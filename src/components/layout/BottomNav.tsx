import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, BarChart3, MoreHorizontal, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStartWorkout } from '@/contexts/StartWorkoutContext'

const leftTabs = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
] as const

const rightTabs = [
  { path: '/progress', label: 'Progress', icon: BarChart3 },
  { path: '/more', label: 'More', icon: MoreHorizontal },
] as const

export function BottomNav() {
  const location = useLocation()
  const { openStartWorkout } = useStartWorkout()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card" aria-label="Main navigation">
      <div className="flex items-center justify-between h-16 safe-area-pb px-2">
        {leftTabs.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-muted-foreground transition-colors min-h-[44px]',
                isActive && 'text-accent'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-6 h-6" aria-hidden />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
        <div className="flex items-center justify-center flex-shrink-0 w-16">
          <button
            type="button"
            onClick={openStartWorkout}
            className="flex items-center justify-center w-14 h-14 -mt-6 rounded-full bg-accent text-primary-foreground shadow-lg hover:opacity-90 active:scale-95 transition-all min-w-[56px] min-h-[56px]"
            aria-label="Start workout"
          >
            <Dumbbell className="w-7 h-7" aria-hidden />
          </button>
        </div>
        {rightTabs.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(path)
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-muted-foreground transition-colors min-h-[44px]',
                isActive && 'text-accent'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-6 h-6" aria-hidden />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
