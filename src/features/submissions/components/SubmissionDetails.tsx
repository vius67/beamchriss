// Submission details view component
// Shows full grade view with per-question feedback for students

import { ArrowLeft, Clock, CheckCircle, Calendar, Eye } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/cn'
import { formatSydney } from '@/shared/lib/tz-utils'
import { PDFViewer } from '@/shared/components/PDFViewer'
import { usePDFViewer } from '@/shared/hooks/use-pdf-viewer'
import {
  useSubmissionDetails,
  isSubmissionGraded,
  calculatePercentage,
  calculateChallengeDisplay,
} from '../hooks/use-submission-details'

interface SubmissionDetailsProps {
  submissionId: string
  onBack: () => void
}

/**
 * Full submission details view
 *
 * Shows:
 * - Assignment title and submission date
 * - Overall score with percentage
 * - "Marked by" attribution
 * - View Report button (when statistics PDF is available)
 * - Per-question feedback cards
 * - "In Review" state for ungraded submissions
 */
export function SubmissionDetails({ submissionId, onBack }: SubmissionDetailsProps) {
  const { data: submission, isLoading, error } = useSubmissionDetails(submissionId)
  const { open, bucket, storagePath, title: viewerTitle, openPDF, closePDF } = usePDFViewer()

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  // Error state
  if (error || !submission) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to submissions
        </Button>
        <Card className="p-8 text-center">
          <p className="text-g-600">
            {error
              ? 'Unable to load submission details.'
              : 'This submission is still being reviewed.'}
          </p>
        </Card>
      </div>
    )
  }

  const isGraded = isSubmissionGraded(submission)
  const percentage = calculatePercentage(submission.total_score, submission.max_score)
  const challengeDisplay = calculateChallengeDisplay(
    submission.total_score,
    submission.max_score,
    submission.challenge_bonus
  )

  // Format dates
  const submittedDate = formatSydney(submission.created_at, 'date')
  const gradedDate = submission.processed_at ? formatSydney(submission.processed_at, 'date') : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Assignment info */}
      <div>
        <h1 className="text-2xl font-semibold text-g-900 dark:text-g-100">
          {submission.homework?.title || 'Past Paper'}
        </h1>
        <div className="mt-2 flex items-center gap-4 text-sm text-g-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Submitted {submittedDate}
          </span>
          {gradedDate && (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-ok" />
              Marked {gradedDate}
            </span>
          )}
        </div>
      </div>

      {/* Score card */}
      {isGraded && submission.total_score !== null && (
        <Card className="border-p-200 bg-gradient-to-br from-p-50 to-p-100 p-6 dark:border-p-700 dark:from-p-700/40 dark:to-p-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-p-600 dark:text-p-400">Your Score</p>
              <p className="mt-1 text-4xl font-bold text-p-700 dark:text-p-300">
                {submission.total_score}/{submission.max_score}
              </p>
              {percentage !== null && (
                <div className="mt-1 flex items-baseline gap-2">
                  <p
                    className={cn(
                      'text-lg font-semibold',
                      percentage >= 80 ? 'text-ok' : percentage >= 60 ? 'text-warn' : 'text-err'
                    )}
                  >
                    {percentage}%
                  </p>
                  {challengeDisplay && challengeDisplay.bonusPercent > 0 && (
                    <span className="text-sm font-semibold text-amber-500 dark:text-amber-400">
                      +{challengeDisplay.bonusPercent}% challenge bonus
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* View Report button */}
      {isGraded && submission.statistics_pdf_path && (
        <Button
          variant="outline"
          onClick={() =>
            openPDF(
              'worksheets',
              submission.statistics_pdf_path!,
              `${submission.homework?.title || 'Homework'} - Report`
            )
          }
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          View Report
        </Button>
      )}

      {/* Not graded yet */}
      {!isGraded && (
        <Card className="border-g-200 bg-g-50 p-6 dark:border-g-300 dark:bg-g-100/50">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-p-500" />
            <div>
              <p className="font-medium text-g-800 dark:text-g-200">In Review</p>
              <p className="text-sm text-g-500 dark:text-g-600">
                Your work is being reviewed by our marking team. You&apos;ll be notified when
                feedback is ready.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* No answers yet */}
      {isGraded && submission.answers.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-g-500 dark:text-g-600">
            Detailed question feedback is being prepared.
          </p>
        </Card>
      )}

      <PDFViewer
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) closePDF()
        }}
        title={viewerTitle}
        bucket={bucket}
        storagePath={storagePath}
      />
    </div>
  )
}
