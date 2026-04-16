import { TrendingUp, Minus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useWeeklyComparison } from '../hooks/use-weekly-comparison'

interface ProgressBadgeProps {
  className?: string
  /** Show submission count details */
  showDetails?: boolean
}

/**
 * Week-over-week progress badge
 *
 * 
 * - Badge only: "+12% vs last week"
 * - Simple comparison
 *
 * Per D16: Only positive or neutral messaging, no negative.
 * - If down, we show "Steady this week" instead of decline
 * - Never discourage the student
 */
export function ProgressBadge({ className, showDetails = false }: ProgressBadgeProps) {
  const { data, isLoading } = useWeeklyComparison()

  if (isLoading) {
    return (
      <div className={cn('h-6 w-24 animate-pulse rounded bg-g-200 dark:bg-g-300', className)} />
    )
  }

  // Don't show if no submissions this week
  if (!data || data.submissionsThisWeek === 0) {
    return null
  }

  // Per D16: Only positive or neutral messaging
  // If direction is 'down', we show neutral "Steady this week"
  // If direction is 'same' or 'up', we show the actual message
  const isPositive = data.direction === 'up' && data.change > 0
  const isNeutral = data.direction === 'same' || data.direction === 'down'

  const Icon = isPositive ? TrendingUp : Minus

  const colorClass = isPositive ? 'text-ok-text bg-ok-bg' : 'text-g-600 bg-g-100'

  // Per D16: No negative messaging
  let changeText: string
  if (isPositive) {
    changeText = `+${data.change}% vs last week`
  } else if (data.lastWeek === 0) {
    // No comparison available (first week)
    changeText = `${data.thisWeek}% this week`
  } else if (isNeutral) {
    // Down or same - show neutral message
    changeText = 'Steady this week'
  } else {
    changeText = 'Same as last week'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
        colorClass,
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{changeText}</span>
      {showDetails && data.submissionsThisWeek > 0 && (
        <span className="ml-1 text-xs opacity-75">
          ({data.submissionsThisWeek} submission{data.submissionsThisWeek !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  )
}
