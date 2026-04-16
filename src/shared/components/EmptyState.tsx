// Shared empty-state component — consistent tone across portal.
// Consistent copy rules: lowercase, short, no exclamation marks, no emoji.

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
  /** Padding variant. Default 'md'. */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Empty-state placeholder with consistent tone.
 *
 * @example
 * <EmptyState
 *   icon={FileText}
 *   title="nothing to show yet"
 *   description="your submissions will appear here after your first upload."
 * />
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const padding = size === 'sm' ? 'p-6' : size === 'lg' ? 'p-16' : 'p-10'

  return (
    <div
      className={cn('flex flex-col items-center justify-center text-center', padding, className)}
    >
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-g-100 text-g-400 dark:bg-g-200/50 dark:text-g-500">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
      <p className="font-medium text-g-900 dark:text-white">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-g-500 dark:text-g-600">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState
