// Table component for displaying submissions
// release delaylanguage: "Feedback ready", "In review", "Sent" (never processing)

import { FileText, Eye, Clock, CheckCircle2, Send, AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { EmptyState as SharedEmptyState } from '@/shared/components/EmptyState'
import { cn } from '@/shared/lib/cn'
import { sydneyDateStr } from '@/shared/lib/sydney-date'
import { formatSydney } from '@/shared/lib/tz-utils'
import type { Submission } from '@/features/dashboard/types'

interface SubmissionsTableProps {
  submissions: Submission[]
  isLoading: boolean
  onView?: (submission: Submission) => void
}

/**
 * Format date for display
 * Uses relative time for recent dates, absolute for older
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const dateKey = sydneyDateStr(date)
  const todayKey = sydneyDateStr()
  const yesterdayKey = sydneyDateStr(new Date(Date.now() - 86400000))

  if (dateKey === todayKey) return 'Today'
  if (dateKey === yesterdayKey) return 'Yesterday'

  // Calculate day difference from YYYY-MM-DD strings
  const dateMs = new Date(dateKey).getTime()
  const todayMs = new Date(todayKey).getTime()
  const diffDays = Math.round((todayMs - dateMs) / (1000 * 60 * 60 * 24))

  if (diffDays >= 2 && diffDays < 7) return `${diffDays} days ago`

  return formatSydney(date, 'dayMonth')
}

/**
 * Get display configuration for submission status
 * Status values: 'submitted', 'graded', 'reviewed', 'needs_review', 'removed', 'deleted'
 * When status is graded but visible_at is in the future, shows "In review" instead of "Feedback ready"
 */
function getStatusConfig(
  status: string,
  visibleAt?: string | null
): {
  label: string
  icon: typeof CheckCircle2
  className: string
} {
  switch (status) {
    // Feedback ready states — but only if visible_at has passed
    case 'graded':
    case 'reviewed':
    case 'delivered':
    case 'marked':
      if (visibleAt && new Date(visibleAt) > new Date()) {
        return {
          label: 'In review',
          icon: Clock,
          className: 'bg-p-100 text-p-700 dark:bg-p-700/50 dark:text-p-300',
        }
      }
      return {
        label: 'Feedback ready',
        icon: CheckCircle2,
        className: 'bg-ok-bg text-ok-text',
      }
    // In review states
    case 'needs_review':
    case 'pending':
    case 'processing':
    case 'queued':
      return {
        label: 'In review',
        icon: Clock,
        className: 'bg-p-100 text-p-700 dark:bg-p-700/50 dark:text-p-300',
      }
    // Failed state — student sees "Under Review" (no technical jargon)
    case 'failed':
      return {
        label: 'Under Review',
        icon: AlertCircle,
        className: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      }
    // Removed state — auto-triaged junk, student sees "Action needed"
    case 'removed':
      return {
        label: 'Action needed',
        icon: AlertCircle,
        className: 'bg-err-bg text-err dark:bg-err/20 dark:text-red-400',
      }
    // Sent states (just submitted, waiting to be processed)
    case 'submitted':
    case 'uploaded':
      return {
        label: 'Sent',
        icon: Send,
        className: 'bg-g-100 text-g-600 dark:bg-g-100 dark:text-g-600',
      }
    default:
      return {
        label: 'Sent',
        icon: FileText,
        className: 'bg-g-100 text-g-600 dark:bg-g-100 dark:text-g-600',
      }
  }
}

/**
 * Determine submission type label
 */
function getSubmissionType(submission: Submission): string {
  if (submission.submission_type === 'past_paper') {
    return 'Past Paper'
  }
  return 'Homework'
}

/**
 * Get subject/title display
 * Uses homework_title if available, otherwise shows type
 */
function getSubjectDisplay(submission: Submission): string {
  if (submission.homework_title) {
    return submission.homework_title
  }
  if (submission.submission_type === 'past_paper') {
    return 'Past Paper'
  }
  return 'Submission'
}

/**
 * Calculate percentage score from mark and mark_total
 */
function calculateScore(submission: Submission): number | null {
  if (submission.mark === null || submission.mark_total === null || submission.mark_total === 0) {
    return null
  }
  return Math.round((submission.mark / submission.mark_total) * 100)
}

/**
 * Check if feedback is viewable based on status and visible_at
 * Status values from migration 021: 'submitted', 'graded', 'reviewed', 'needs_review', 'removed', 'deleted'
 */
function isFeedbackReady(submission: Submission): boolean {
  const readyStatuses = ['graded', 'reviewed', 'delivered', 'marked']
  if (!readyStatuses.includes(submission.status)) {
    return false
  }
  // Check visible_at if present
  if (submission.visible_at) {
    return new Date(submission.visible_at) <= new Date()
  }
  return true
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-g-200 p-4 dark:border-g-300"
        >
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

function EmptyTable() {
  return (
    <div className="rounded-lg border border-dashed border-g-300 dark:border-g-300">
      <SharedEmptyState
        icon={FileText}
        title="no homework yet"
        description="submit your first assignment from the dashboard."
      />
    </div>
  )
}

export function SubmissionsTable({ submissions, isLoading, onView }: SubmissionsTableProps) {
  if (isLoading) {
    return <TableSkeleton />
  }

  if (submissions.length === 0) {
    return <EmptyTable />
  }

  return (
    <div className="overflow-hidden rounded-lg border border-g-200 dark:border-g-300">
      {/* Desktop table header */}
      <div className="hidden border-b border-g-200 bg-g-50 px-4 py-3 dark:border-g-300 dark:bg-g-100/50 sm:grid sm:grid-cols-[1fr_120px_100px_140px_80px] sm:gap-4">
        <span className="text-xs font-medium uppercase tracking-wide text-g-500 dark:text-g-600">
          Subject
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-g-500 dark:text-g-600">
          Type
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-g-500 dark:text-g-600">
          Date
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-g-500 dark:text-g-600">
          Status
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-g-500 dark:text-g-600">
          Score
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-g-200 dark:divide-g-300">
        {submissions.map((submission) => {
          const statusConfig = getStatusConfig(submission.status, submission.visible_at)
          const StatusIcon = statusConfig.icon
          const canView = isFeedbackReady(submission)
          const score = calculateScore(submission)

          return (
            <div
              key={submission.id}
              className={cn(
                'flex flex-col gap-3 p-4 transition-colors',
                'sm:grid sm:grid-cols-[1fr_120px_100px_140px_80px] sm:items-center sm:gap-4',
                canView && 'cursor-pointer hover:bg-g-50 dark:hover:bg-g-200/50'
              )}
              onClick={() => canView && onView?.(submission)}
              role={canView ? 'button' : undefined}
              tabIndex={canView ? 0 : undefined}
              onKeyDown={(e) => {
                if (canView && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onView?.(submission)
                }
              }}
            >
              {/* Subject */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-p-100 dark:bg-p-700/50">
                  <FileText className="h-5 w-5 text-p-600 dark:text-p-400" />
                </div>
                <span className="font-medium text-g-900 dark:text-white">
                  {getSubjectDisplay(submission)}
                </span>
              </div>

              {/* Type */}
              <div className="flex items-center justify-between sm:block">
                <span className="text-sm text-g-500 sm:hidden">Type</span>
                <span className="text-sm text-g-600 dark:text-g-600">
                  {getSubmissionType(submission)}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center justify-between sm:block">
                <span className="text-sm text-g-500 sm:hidden">Date</span>
                <span className="text-sm text-g-600 dark:text-g-600">
                  {formatDate(submission.created_at)}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between sm:block">
                <span className="text-sm text-g-500 sm:hidden">Status</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    statusConfig.className
                  )}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusConfig.label}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-center justify-between sm:block">
                <span className="text-sm text-g-500 sm:hidden">Score</span>
                {score !== null ? (
                  <span className="text-sm font-semibold text-ok">{score}%</span>
                ) : (
                  <span className="text-sm text-g-400">—</span>
                )}
              </div>

              {/* View button (mobile only) */}
              {canView && (
                <div className="sm:hidden">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      onView?.(submission)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View feedback
                  </Button>
                </div>
              )}

              {/* Student message for rejected/auto-triaged submissions */}
              {submission.student_message && (
                <div className="col-span-full rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                  <div className="flex items-start gap-2">
                    <RotateCcw className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        {submission.student_message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
