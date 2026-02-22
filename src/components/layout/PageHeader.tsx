import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  className?: string
}

export function PageHeader({ title, className }: PageHeaderProps) {
  return (
    <header className={cn('font-display text-xl font-semibold tracking-tight', className)}>
      {title}
    </header>
  )
}
