import { BookOpen } from 'lucide-react'
import { useHomeworkList } from '@/features/dashboard'
import { AssignmentCard } from './AssignmentCard'
import { EmptyState } from './EmptyState'
import { Skeleton } from '@/shared/components/ui/skeleton'

interface AssignmentListProps {
  /** Skip the first N items (for when NextTaskCard shows the first one) */
  skipFirst?: number
  /** Max items to show (0 = unlimited) */
  limit?: number
  /** Show section header */
  showHeader?: boolean
}

export function AssignmentList({
  skipFirst = 0,
  limit = 0,
  showHeader = true,
}: AssignmentListProps) {
  const { data: homework, isLoading, error } = useHomeworkList()

  // Sort by priority then due date
  const sortedHomework = [...(homework || [])].sort((a, b) => {
    const priorityOrder = { overdue: 0, today: 1, tomorrow: 2, upcoming: 3 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff

    // Same priority, sort by due date
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  // Apply skip and limit
  let displayHomework = sortedHomework.slice(skipFirst)
  if (limit > 0) {
    displayHomework = displayHomework.slice(0, limit)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {showHeader && <Skeleton className="h-6 w-32" />}
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        icon={<BookOpen className="h-6 w-6 text-g-400" />}
        title="Couldn't load assignments"
        description="There was a problem loading your assignments. Please try refreshing the page."
      />
    )
  }

  // Empty state
  if (displayHomework.length === 0) {
    // If we skipped items, don't show empty state (NextTaskCard handles it)
    if (skipFirst > 0 && sortedHomework.length > 0) {
      return null
    }

    return (
      <EmptyState
        icon={<BookOpen className="h-6 w-6 text-g-400" />}
        title="No assignments yet"
        description="When your tutor assigns homework, it will appear here. Check back soon!"
      />
    )
  }

  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-g-900">
            {skipFirst > 0 ? 'More Assignments' : 'Your Assignments'}
          </h2>
          {sortedHomework.length > displayHomework.length + skipFirst && (
            <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium">
              View all ({sortedHomework.length})
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {displayHomework.map((assignment) => (
          <AssignmentCard key={assignment.id} assignment={assignment} />
        ))}
      </div>

      {/* Show count of remaining items */}
      {limit > 0 && sortedHomework.length > displayHomework.length + skipFirst && (
        <p className="text-center text-sm text-g-500">
          + {sortedHomework.length - displayHomework.length - skipFirst} more{' '}
          {sortedHomework.length - displayHomework.length - skipFirst === 1
            ? 'assignment'
            : 'assignments'}
        </p>
      )}
    </div>
  )
}
