import { FileText, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useSubmissions } from '../hooks/use-submissions'
import { cn } from '@/shared/lib/cn'
import { formatSydney } from '@/shared/lib/tz-utils'

function formatDate(dateStr: string): string {
  return formatSydney(dateStr, 'dayMonth')
}

/**
 * Recent homework list with status badges
 *
 * Features:
 * - Shows last 5 submissions
 * - Status icons: check for marked, clock for pending
 * - Score display for graded submissions
 * - release delaylanguage: "In review" instead of "Processing"
 * - Empty state when no submissions
 */
export function RecentSubmissions() {
  const { data: submissions, isLoading } = useSubmissions()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent homework</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1">
                <Skeleton className="mb-1 h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const recentSubmissions = submissions?.slice(0, 5) ?? []

  if (recentSubmissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-g-900 dark:text-white">
            Recent homework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-g-500 dark:text-g-600">
            No homework yet. Submit your first assignment to see your history here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-g-900 dark:text-white">
          Recent homework
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentSubmissions.map((submission) => {
            const isGraded = submission.display_status === 'marked'
            const isPending = submission.display_status === 'submitted'

            // Calculate percentage score if available
            let scorePercent: number | null = null
            if (isGraded && submission.mark !== null && submission.mark_total !== null) {
              scorePercent = Math.round((submission.mark / submission.mark_total) * 100)
            }

            return (
              <div
                key={submission.id}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-g-50 dark:hover:bg-g-200/50"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded',
                    isGraded
                      ? 'bg-ok-bg'
                      : isPending
                        ? 'bg-p-100 dark:bg-p-700/50'
                        : 'bg-g-100 dark:bg-g-100'
                  )}
                >
                  {isGraded ? (
                    <CheckCircle2 className="h-4 w-4 text-ok" />
                  ) : isPending ? (
                    <Clock className="h-4 w-4 text-p-600 dark:text-p-400" />
                  ) : (
                    <FileText className="h-4 w-4 text-g-500" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-g-900 dark:text-white">
                    {submission.homework_title ?? 'Past Paper'}
                  </p>
                  <p className="text-xs text-g-500 dark:text-g-600">
                    {submission.homework_id ? 'Homework' : 'Past Paper'}
                    {' · '}
                    {formatDate(submission.created_at)}
                  </p>
                </div>

                {/* Status / Score */}
                <div className="text-right">
                  {isGraded && scorePercent !== null ? (
                    <span className="text-sm font-semibold text-ok">{scorePercent}%</span>
                  ) : (
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isPending ? 'text-p-600 dark:text-p-400' : 'text-g-500'
                      )}
                    >
                      {isPending ? 'In review' : 'Submitted'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
