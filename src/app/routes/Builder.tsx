import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates'
import { cn } from '@/lib/utils'
import { Plus, ChevronRight } from 'lucide-react'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

export function Builder() {
  const navigate = useNavigate()
  const { templates, loading, error, create } = useWorkoutTemplates()

  async function handleNew() {
    try {
      const t = await create({ name: 'Untitled workout' })
      navigate(`/builder/${t.id}`)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="Workout Builder" />
        <button
          type="button"
          onClick={handleNew}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-primary-foreground font-medium min-h-[44px]"
        >
          <Plus className="w-5 h-5" /> New
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-500">Failed to load templates.</p>
      )}

      {loading ? (
        <LoadingState message="Loading templates…" />
      ) : templates.length === 0 ? (
        <EmptyState
          message="No templates yet"
          description="Create a workout template to schedule and run sessions."
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {templates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => navigate(`/builder/${t.id}`)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-card',
                  'text-left hover:border-accent/50 transition-colors min-h-[44px]'
                )}
              >
                <span className="font-medium text-foreground truncate">{t.name}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
