import { cn } from '@/shared/lib/cn'

interface PriorityBadgeProps {
  priority: 'overdue' | 'today' | 'tomorrow' | 'upcoming'
  className?: string
}

//  Traffic light colors
// Red (overdue), orange (today), blue (tomorrow), gray (future)
const priorityConfig = {
  overdue: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    dot: 'bg-red-500',
  },
  today: {
    label: 'Due Today',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  tomorrow: {
    label: 'Due Tomorrow',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  upcoming: {
    label: 'Upcoming',
    className: 'bg-g-100 text-g-700',
    dot: 'bg-g-400',
  },
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}

// Export config for use in other components
export { priorityConfig }
