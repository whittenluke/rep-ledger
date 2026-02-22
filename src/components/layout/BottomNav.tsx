import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, BarChart3, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/progress', label: 'Progress', icon: BarChart3 },
  { path: '/more', label: 'More', icon: MoreHorizontal },
] as const

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      <div className="flex items-center justify-around h-14 safe-area-pb">
        {tabs.map(({ path, label, icon: Icon }) => {
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
      </div>
    </nav>
  )
}
