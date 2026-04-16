// Past paper details view component

import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/cn'
import { formatSydney } from '@/shared/lib/tz-utils'
import { usePastPaperDetails } from '../hooks/use-past-paper-details'
import { DocumentCards } from './DocumentCards'

interface PastPaperDetailsProps {
  submissionId: string
  paperTitle: string
  onBack: () => void
}

/**
 * Calculate percentage score
 */
function calculatePercentage(mark: number | null, maxMark: number | null): number | null {
  if (mark === null || maxMark === null || maxMark === 0) return null
  return Math.round((mark / maxMark) * 100)
}

/**
 * Full past paper details view
 *
 * Shows:
 * - Paper title and submission date
 * - Overall score with percentage
 * - Per-question feedback cards (reuses QuestionFeedback from submissions)
 * - "In Review" state for ungraded submissions
 */
export function PastPaperDetails({ submissionId, paperTitle, onBack }: PastPaperDetailsProps) {
  const { data: paper, isLoading, error } = usePastPaperDetails(submissionId)

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
  if (error || !paper) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to past papers
        </Button>
        <Card className="p-8 text-center">
          <p className="text-g-600 dark:text-g-600">
            {error
              ? 'Unable to load past paper details.'
              : 'This past paper is still being reviewed.'}
          </p>
        </Card>
      </div>
    )
  }

  const isGraded = paper.status === 'graded' || paper.status === 'delivered'
  const percentage = calculatePercentage(paper.mark, paper.max_mark)

  // Format date
  const submittedDate = formatSydney(paper.submitted_at, 'date')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Paper info */}
      <div>
        <h1 className="text-2xl font-semibold text-g-900 dark:text-g-100">{paperTitle}</h1>
        <div className="mt-2 flex items-center gap-4 text-sm text-g-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Submitted {submittedDate}
          </span>
        </div>
      </div>

      {/* Score card */}
      {isGraded && paper.mark !== null && (
        <Card className="border-p-200 bg-gradient-to-br from-p-50 to-p-100 p-6 dark:border-p-700 dark:from-p-700/40 dark:to-p-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-p-600 dark:text-p-400">Your Score</p>
              <p className="mt-1 text-4xl font-bold text-p-700 dark:text-p-300">
                {paper.mark}/{paper.max_mark}
              </p>
              {percentage !== null && (
                <p
                  className={cn(
                    'mt-1 text-lg font-semibold',
                    percentage >= 80 ? 'text-ok' : percentage >= 60 ? 'text-warn' : 'text-err'
                  )}
                >
                  {percentage}%
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-g-500 dark:text-g-600">
                Submitted {paper.submitted_at ? formatSydney(paper.submitted_at, 'date') : ''}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Document Pack — 4 branded PDF downloads */}
      {isGraded &&
        paper.mark !== null &&
        (!paper.visible_at || new Date(paper.visible_at) <= new Date()) && (
          <DocumentCards
            submissionId={paper.id}
            subject={paper.subject}
            paperTitle={`${paper.exam_year}-${paper.paper_type}`}
            mark={paper.mark}
            maxMark={paper.max_mark}
            autoWorksheetId={paper.auto_worksheet_id}
            statisticsPdfPath={paper.statistics_pdf_path}
            skipWorksheet={paper.skip_worksheet && !paper.auto_worksheet_id}
          />
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

      {/* No per-question breakdown available */}
      {isGraded && paper.answers.length === 0 && (
        <Card className="border-g-200 bg-g-50 p-6 dark:border-g-300 dark:bg-g-100/50">
          <p className="font-medium text-g-700 dark:text-g-300">Your paper has been marked</p>
          <p className="mt-1 text-sm text-g-500 dark:text-g-400">
            A detailed question-by-question breakdown will be added by our marking team soon.
          </p>
        </Card>
      )}
    </div>
  )
}
