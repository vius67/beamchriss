import { FileText, CheckCircle2, Clock, ArrowRight, Eye, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { PriorityBadge } from './PriorityBadge'
import { cn } from '@/shared/lib/cn'
import { sydneyDateStr } from '@/shared/lib/sydney-date'
import { formatSydney } from '@/shared/lib/tz-utils'
import { PDFViewer } from '@/shared/components/PDFViewer'
import { usePDFViewer } from '@/shared/hooks/use-pdf-viewer'
import type { HomeworkAssignment } from '../types'

interface AssignmentCardProps {
  assignment: HomeworkAssignment
  onClick?: () => void
}

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return 'No due date'

  const date = new Date(dateStr)
  const dateKey = sydneyDateStr(date)
  const todayKey = sydneyDateStr()
  const yesterdayKey = sydneyDateStr(new Date(Date.now() - 86400000))
  const tomorrowKey = sydneyDateStr(new Date(Date.now() + 86400000))

  if (dateKey === todayKey) {
    return 'Due today'
  }

  if (dateKey === yesterdayKey) {
    return 'Due yesterday'
  }

  if (dateKey === tomorrowKey) {
    return 'Due tomorrow'
  }

  if (dateKey < todayKey) {
    // Past due - calculate days difference from YYYY-MM-DD strings
    const dueMs = new Date(dateKey).getTime()
    const todayMs = new Date(todayKey).getTime()
    const daysAgo = Math.round((todayMs - dueMs) / (1000 * 60 * 60 * 24))
    return `${daysAgo} days overdue`
  }

  // Future date
  return `Due ${formatSydney(date, 'dayMonthWeekday')}`
}

export function AssignmentCard({ assignment, onClick }: AssignmentCardProps) {
  const isSubmitted = assignment.submission_status !== null
  const isGraded = assignment.submission_status === 'marked'
  const { open, bucket, storagePath, title: viewerTitle, openPDF, closePDF } = usePDFViewer()

  const handleViewPdf = (e: React.MouseEvent) => {
    // Stop propagation so the card's onClick (navigate to upload) doesn't fire
    e.stopPropagation()
    if (assignment.pdf_storage_path) {
      // PDFViewer handles lesson-plans/ prefix internally
      openPDF('homework-pdfs', assignment.pdf_storage_path, assignment.title)
    }
  }

  return (
    <>
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          'hover:border-p-300 dark:hover:border-p-700',
          isGraded && 'border-green-200 dark:border-green-800'
        )}
        onClick={onClick}
      >
        <CardContent className="flex items-center gap-4 p-4">
          {/* Icon */}
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              isGraded
                ? 'bg-green-100 dark:bg-green-900/50'
                : isSubmitted
                  ? 'bg-blue-100 dark:bg-blue-900/50'
                  : 'bg-g-100 dark:bg-g-100'
            )}
          >
            {isGraded ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : isSubmitted ? (
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <FileText className="h-5 w-5 text-g-500 dark:text-g-600" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="truncate font-medium text-g-900 dark:text-white">
                {assignment.title}
              </h4>
              {!isSubmitted && <PriorityBadge priority={assignment.priority} />}
            </div>
            <p className="text-sm text-g-500 dark:text-g-600">
              {assignment.subject}
              {assignment.homework_template_id && (
                <BookOpen className="ml-1 inline h-3 w-3 text-p-500 dark:text-p-400" />
              )}
              {assignment.due_date && ` • ${formatDueDate(assignment.due_date)}`}
            </p>
            {/* Topic context pills - show up to 3 resolved topic names */}
            {assignment.topic_names.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {assignment.topic_names.slice(0, 3).map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  >
                    {name}
                  </span>
                ))}
                {assignment.topic_names.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{assignment.topic_names.length - 3} more
                  </span>
                )}
              </div>
            )}
            {isSubmitted && (
              <p
                className={cn(
                  'mt-1 text-xs font-medium',
                  isGraded
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-blue-600 dark:text-blue-400'
                )}
              >
                {isGraded ? 'Results ready' : 'With marking team'}
              </p>
            )}
            {/* PDF view button - only shown when PDF is available */}
            {assignment.pdf_storage_path && (
              <button
                type="button"
                onClick={handleViewPdf}
                className="mt-1.5 flex items-center gap-1 text-xs font-medium text-p-600 transition-colors hover:text-p-700 dark:text-p-400 dark:hover:text-p-300"
              >
                <Eye className="h-3 w-3" />
                View PDF
              </button>
            )}
          </div>

          {/* Arrow */}
          <ArrowRight className="h-5 w-5 shrink-0 text-g-400 dark:text-g-500" />
        </CardContent>
      </Card>

      <PDFViewer
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) closePDF()
        }}
        title={viewerTitle}
        bucket={bucket}
        storagePath={storagePath}
      />
    </>
  )
}
