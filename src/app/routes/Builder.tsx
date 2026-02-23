import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates'
import { cn } from '@/lib/utils'
import { Plus, ChevronRight, Trash2 } from 'lucide-react'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

export function Builder() {
  const navigate = useNavigate()
  const { templates, loading, error, create, remove } = useWorkoutTemplates()

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await remove(id)
    } catch (err) {
      console.error(err)
    }
  }

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
            <li
              key={t.id}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border border-border bg-card',
                'hover:border-accent/50 transition-colors min-h-[44px]'
              )}
            >
              <button
                type="button"
                onClick={() => navigate(`/builder/${t.id}`)}
                className="flex-1 flex items-center justify-between gap-2 text-left min-w-0"
              >
                <span className="font-medium text-foreground truncate">{t.name}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden />
              </button>
              <button
                type="button"
                onClick={(e) => handleDelete(e, t.id, t.name)}
                className="p-2 rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500"
                aria-label={`Delete ${t.name}`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
