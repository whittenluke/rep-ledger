import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'

export function More() {
  return (
    <div className="p-4 pb-20">
      <PageHeader title="More" />
      <ul className="mt-4 space-y-2 text-muted-foreground">
        <li><Link to="/exercises" className="text-accent hover:underline">Exercise library</Link></li>
        <li><Link to="/history" className="text-accent hover:underline">History</Link></li>
        <li><Link to="/builder" className="text-accent hover:underline">Workout Builder</Link></li>
        <li><Link to="/settings" className="text-accent hover:underline">Settings</Link></li>
      </ul>
    </div>
  )
}
