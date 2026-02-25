import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChevronRight } from 'lucide-react'

const menuItems = [
  { to: '/builder', label: 'Workout Builder' },
  { to: '/exercises', label: 'My Exercises' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/settings', label: 'Settings' },
] as const

export function More() {
  return (
    <div className="p-4 pb-20">
      <PageHeader title="More" />
      <nav className="mt-6 rounded-lg border border-border bg-card overflow-hidden" aria-label="Menu">
        <ul className="divide-y divide-border">
          {menuItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex items-center justify-between w-full px-4 py-4 text-foreground hover:bg-muted/50 transition-colors min-h-[48px] leading-normal"
              >
                <span className="font-medium">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
