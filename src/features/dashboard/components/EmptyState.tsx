import { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed',
        'border-g-300 bg-g-50 px-6 py-12 text-center',
        'dark:border-g-300 dark:bg-g-100/50',
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-g-100 dark:bg-g-300">
        {icon}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-g-900 dark:text-white">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-g-500 dark:text-g-600">{description}</p>
      {action}
    </div>
  )
}
