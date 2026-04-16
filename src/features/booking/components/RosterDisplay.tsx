/**
 * Realtime roster display for a holiday class slot
 *
 * Uses useSlotRoster hook for live updates via Supabase postgres_changes.
 * Shows first names only for privacy.
 */

import { useSlotRoster } from '../hooks/use-slot-roster'
import { cn } from '@/shared/lib/cn'

interface RosterDisplayProps {
  slotId: string
  maxCapacity: number
  className?: string
}

/**
 * Display realtime roster for a holiday class slot
 *
 * Features:
 * - Live updates when students book/cancel
 * - Shows first names only for privacy
 * - "N spots remaining" badge
 * - Smooth transitions for additions/removals
 */
export function RosterDisplay({ slotId, maxCapacity, className }: RosterDisplayProps) {
  const { roster, isLoading, spotsRemaining } = useSlotRoster(slotId, maxCapacity)

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-4 w-24 rounded bg-g-200 dark:bg-g-700" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Spots remaining badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            spotsRemaining === 0
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : spotsRemaining <= 2
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          )}
        >
          {spotsRemaining === 0
            ? 'Full'
            : `${spotsRemaining} spot${spotsRemaining === 1 ? '' : 's'} left`}
        </span>
      </div>

      {/* Roster list */}
      {roster.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {roster.map((student) => (
            <span
              key={student.id}
              className="inline-flex items-center rounded-full bg-g-100 px-2 py-0.5 text-xs text-g-700 transition-all duration-200 dark:bg-g-800 dark:text-g-400"
            >
              {student.name}
            </span>
          ))}
        </div>
      )}

      {roster.length === 0 && (
        <p className="text-xs text-g-500 dark:text-g-600">No one signed up yet</p>
      )}
    </div>
  )
}
