// Past paper submission history
// Shows student's past paper submissions with status and scores
// Uses real data from past_paper_submissions table

import { useMemo, useState } from 'react'
import { FileText, Clock, CheckCircle2, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { EmptyState } from '@/shared/components/EmptyState'
import { cn } from '@/shared/lib/cn'
import { formatSydney } from '@/shared/lib/tz-utils'
import { usePastPaperHistory, type PastPaperSubmission } from '../hooks/use-past-paper-history'
import { CalibrationResult } from './CalibrationResult'
import { PastPaperDetails } from './PastPaperDetails'

interface PaperHistoryProps {
  subjectFilter?: string | undefined
}

/**
 * Format date for display (e.g., "8 Feb")
 */
function formatDate(dateStr: string): string {
  return formatSydney(dateStr, 'dayMonth')
}

/**
 * Compute percentage score from mark/max_mark
 */
function computeScore(paper: PastPaperSubmission): number | null {
  if (paper.mark === null || paper.max_mark === null || paper.max_mark === 0) {
    return null
  }
  return Math.round((paper.mark / paper.max_mark) * 100)
}

/**
 * Determine if submission is Y12 (uses bands) vs Y7-11 (uses raw scores)
 * Y12 students use HSC band scale (1-6)
 * All other years use raw percentage scores
 */
function isYear12Submission(examYear: number): boolean {
  return examYear === 12
}

/**
 * Determine display status
 *
 * - "submitted" -> "In review"
 * - "graded" but not yet visible -> "In review"
 * - "graded" and visible_at passed -> "Feedback ready"
 * - "failed" -> "In review"
 */
function getDisplayStatus(paper: PastPaperSubmission): 'pending' | 'ready' {
  // If not graded or failed, show as pending
  if (paper.status !== 'graded') {
    return 'pending'
  }

  // If graded but visible_at is in the future, show as pending
  if (paper.visible_at) {
    const visibleAt = new Date(paper.visible_at)
    const now = new Date()
    if (now < visibleAt) {
      return 'pending'
    }
  }

  // Graded and visible_at has passed
  return 'ready'
}

export function PaperHistory({ subjectFilter }: PaperHistoryProps) {
  const { data: papers, isLoading, error } = usePastPaperHistory()
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null)

  // Filter papers by subject if filter provided
  const filteredPapers = useMemo(() => {
    if (!papers) return []
    if (!subjectFilter) return papers
    return papers.filter((p) => p.subject === subjectFilter)
  }, [papers, subjectFilter])

  // Build paper title for selected paper
  const selectedPaper = selectedPaperId
    ? (filteredPapers.find((p) => p.id === selectedPaperId) ??
      papers?.find((p) => p.id === selectedPaperId))
    : null
  const selectedPaperTitle = selectedPaper
    ? `${selectedPaper.subject} ${selectedPaper.exam_year} ${selectedPaper.paper_type}`
    : ''

  // Show detail view when a paper is selected
  if (selectedPaperId) {
    return (
      <PastPaperDetails
        submissionId={selectedPaperId}
        paperTitle={selectedPaperTitle}
        onBack={() => setSelectedPaperId(null)}
      />
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Your past papers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1">
                <Skeleton className="mb-1 h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-g-900 dark:text-white">
            Your past papers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-err-text">
            Failed to load past papers. Please refresh the page to try again.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (filteredPapers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-g-900 dark:text-white">
            Your past papers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FileText}
            title="no past papers yet"
            description="upload a past paper above to see results here."
            size="sm"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-g-900 dark:text-white">
          Your past papers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredPapers.map((paper) => {
            const displayStatus = getDisplayStatus(paper)
            const isReady = displayStatus === 'ready'
            const isPending = displayStatus === 'pending'
            const score = isReady ? computeScore(paper) : null

            // CalibrationResult logic
            const hasPrediction = paper.predicted_score !== null || paper.predicted_band !== null
            const isY12 = isYear12Submission(paper.exam_year)
            const showCalibration = isReady && hasPrediction

            return (
              <div key={paper.id} className="space-y-2">
                {/* Paper row */}
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-g-50 dark:hover:bg-g-200/50',
                    isReady && 'cursor-pointer'
                  )}
                  onClick={isReady ? () => setSelectedPaperId(paper.id) : undefined}
                  role={isReady ? 'button' : undefined}
                  tabIndex={isReady ? 0 : undefined}
                  onKeyDown={
                    isReady
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') setSelectedPaperId(paper.id)
                        }
                      : undefined
                  }
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded',
                      isReady
                        ? 'bg-ok-bg'
                        : isPending
                          ? 'bg-p-100 dark:bg-p-700/50'
                          : 'bg-g-100 dark:bg-g-100'
                    )}
                  >
                    {isReady ? (
                      <CheckCircle2 className="h-5 w-5 text-ok" />
                    ) : isPending ? (
                      <Clock className="h-5 w-5 text-p-600 dark:text-p-400" />
                    ) : (
                      <FileText className="h-5 w-5 text-g-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-g-900 dark:text-white">
                      {paper.subject} {paper.exam_year} {paper.paper_type}
                    </p>
                    <p className="text-sm text-g-500 dark:text-g-600">
                      {formatDate(paper.created_at)}
                      {' · '}
                      {isReady ? (
                        <span className="text-ok">Feedback ready</span>
                      ) : isPending ? (
                        <span className="text-p-600 dark:text-p-400">In review</span>
                      ) : (
                        'Sent'
                      )}
                    </p>
                  </div>

                  {/* Score - only show if feedback is ready */}
                  {score !== null && <span className="text-lg font-bold text-ok">{score}%</span>}

                  {/* Chevron for clickable ready rows */}
                  {isReady && (
                    <ChevronRight className="h-5 w-5 shrink-0 text-g-400 dark:text-g-500" />
                  )}
                </div>

                {/* Calibration result - show when ready with prediction */}
                {showCalibration && (
                  <CalibrationResult
                    predicted={isY12 ? paper.predicted_band! : paper.predicted_score!}
                    actual={isY12 ? (paper.mark ?? 0) : score!}
                    isBand={isY12}
                    maxScore={paper.max_mark ?? 100}
                  />
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
