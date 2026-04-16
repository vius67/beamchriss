// Submissions screen with filterable table
// Shows all student submissions with status badges and scores
// Includes pending assignments section at the top for unsubmitted homework

import { useState, useMemo } from 'react'
import { Eye } from 'lucide-react'
import { SubmissionFilters, type SubmissionFilter } from '../components/SubmissionFilters'
import { SubmissionsTable } from '../components/SubmissionsTable'
import { SubmissionDetails } from '../components/SubmissionDetails'
import { useSubmissions } from '@/features/dashboard/hooks/use-submissions'
import { useStudentSubjects, ALL_SUBJECTS } from '@/features/dashboard'
import { useHomeworkList } from '@/features/dashboard/hooks/use-homework-list'
import { useUploadSubmission } from '@/features/submissions/hooks/use-upload-submission'
import { PriorityBadge } from '@/features/dashboard/components/PriorityBadge'
import { UploadModal } from '@/shared/components/UploadModal'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { PDFViewer } from '@/shared/components/PDFViewer'
import { usePDFViewer } from '@/shared/hooks/use-pdf-viewer'
import { formatSydney } from '@/shared/lib/tz-utils'
import type { Submission } from '@/features/dashboard/types'
import type { HomeworkAssignment } from '@/features/dashboard/types'
import { useIsDemo } from '@/shared/hooks/use-is-demo'

// Submissions may optionally have subject info from homework join
type SubmissionWithSubject = Submission

/**
 * Format due date for pending assignment display
 * Matches the pattern from AssignmentGrid
 */
function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return 'No due date'

  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (dueDay < today) {
    const daysAgo = Math.floor((today.getTime() - dueDay.getTime()) / (1000 * 60 * 60 * 24))
    return daysAgo === 1 ? 'Due yesterday' : `${daysAgo} days overdue`
  }

  if (dueDay.getTime() === today.getTime()) return 'Due today'
  if (dueDay.getTime() === tomorrow.getTime()) return 'Due tomorrow'

  return `Due ${formatSydney(date, 'dayMonth')}`
}

/**
 * Card for a single pending assignment
 */
function PendingAssignmentCard({
  assignment,
  onSubmit,
  onViewPdf,
  isDemo = false,
}: {
  assignment: HomeworkAssignment
  onSubmit: (assignment: HomeworkAssignment) => void
  onViewPdf: (path: string, title: string) => void
  isDemo?: boolean
}) {
  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col p-4">
        {/* Header with subject and priority */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-p-600 dark:text-p-400">{assignment.subject}</p>
            <h3 className="mt-0.5 font-semibold text-g-900 dark:text-white">{assignment.title}</h3>
          </div>
          <PriorityBadge priority={assignment.priority} />
        </div>

        {/* Details */}
        <div className="mt-2 flex-1">
          <p className="text-sm text-g-500 dark:text-g-600">{formatDueDate(assignment.due_date)}</p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {assignment.pdf_storage_path && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onViewPdf(assignment.pdf_storage_path!, assignment.title)}
            >
              <Eye className="h-3.5 w-3.5" />
              View PDF
            </Button>
          )}
          <Button
            variant="outline"
            className={assignment.pdf_storage_path ? '' : 'w-full'}
            onClick={() => onSubmit(assignment)}
            disabled={isDemo}
            title={isDemo ? 'Disabled in demo mode' : undefined}
          >
            Submit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Map filter value to submission status for filtering
 * Status values from migration 021: 'submitted', 'graded', 'reviewed', 'needs_review', 'removed', 'deleted'
 */
function matchesFilter(submission: Submission, filter: SubmissionFilter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'ready': {
      // Feedback ready = graded/reviewed AND visible_at has passed
      const readyStatuses = ['graded', 'reviewed', 'delivered', 'marked']
      if (!readyStatuses.includes(submission.status)) return false
      if (submission.visible_at) {
        return new Date(submission.visible_at) <= new Date()
      }
      return true
    }
    case 'review':
      // In review = needs human review OR graded but not yet visible
      if (['needs_review', 'pending', 'processing', 'queued'].includes(submission.status))
        return true
      // Graded but not yet visible counts as "in review"
      if (['graded', 'reviewed', 'delivered', 'marked'].includes(submission.status)) {
        return !!submission.visible_at && new Date(submission.visible_at) > new Date()
      }
      return false
    case 'sent':
      // Sent = just submitted, waiting to be processed
      return ['submitted', 'uploaded'].includes(submission.status)
    default:
      return true
  }
}

export function SubmissionsScreen() {
  const isDemo = useIsDemo()
  const { isEnrolled } = useStudentSubjects()
  const [filter, setFilter] = useState<SubmissionFilter>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('All Subjects')
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
  // Fetch more submissions for history view (50 instead of default 10)
  const { data: submissions, isLoading, error } = useSubmissions(50)

  // Pending assignments
  const { data: homework } = useHomeworkList()
  const uploadMutation = useUploadSubmission()
  const [selectedAssignment, setSelectedAssignment] = useState<HomeworkAssignment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // PDF viewer for pending assignment cards
  const {
    open: pdfOpen,
    bucket,
    storagePath,
    title: viewerTitle,
    openPDF,
    closePDF,
  } = usePDFViewer()

  const handleViewPdf = (path: string, title: string) => {
    // PDFViewer handles lesson-plans/ prefix internally
    openPDF('homework-pdfs', path, title)
  }

  // Filter to only unsubmitted homework
  const pendingAssignments = useMemo(() => {
    return (homework ?? []).filter((hw) => hw.submission_status === null)
  }, [homework])

  const handleSubmitAssignment = (assignment: HomeworkAssignment) => {
    if (isDemo) return
    setSelectedAssignment(assignment)
    setIsModalOpen(true)
  }

  const handleUpload = async (files: File[]) => {
    if (!selectedAssignment) return
    await uploadMutation.mutateAsync({ files, homeworkId: selectedAssignment.id })
  }

  // Use real data only - empty state handled by SubmissionsTable
  const allSubmissions: SubmissionWithSubject[] = submissions ?? []

  // Calculate counts for each filter (before subject filter)
  const counts = useMemo(() => {
    return {
      all: allSubmissions.length,
      ready: allSubmissions.filter((s) => matchesFilter(s, 'ready')).length,
      review: allSubmissions.filter((s) => matchesFilter(s, 'review')).length,
      sent: allSubmissions.filter((s) => matchesFilter(s, 'sent')).length,
    }
  }, [allSubmissions])

  // Filter submissions based on selected filters (status + subject)
  const filteredSubmissions = useMemo(() => {
    let result = allSubmissions.filter((s) => matchesFilter(s, filter))
    if (subjectFilter !== 'All Subjects') {
      result = result.filter((s) => s.subject_name === subjectFilter)
    }
    return result
  }, [allSubmissions, filter, subjectFilter])

  const handleView = (submission: Submission) => {
    setSelectedSubmissionId(submission.id)
  }

  // Show submission detail view when a submission is selected
  if (selectedSubmissionId) {
    return (
      <SubmissionDetails
        submissionId={selectedSubmissionId}
        onBack={() => setSelectedSubmissionId(null)}
      />
    )
  }

  // Show error state if fetch failed
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-g-900 dark:text-white">Homework</h1>
          <p className="mt-1 text-g-500 dark:text-g-600">
            Track your submitted work and view feedback
          </p>
        </div>
        <div className="rounded-lg border border-err-bg bg-err-bg/50 p-6 text-center">
          <p className="text-err-text">Unable to load homework. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-g-900 dark:text-white">Homework</h1>
        <p className="mt-1 text-g-500 dark:text-g-600">
          Track your submitted work and view feedback
        </p>
      </div>

      {/* Pending Assignments - only shown when there are unsubmitted homework items */}
      {pendingAssignments.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-g-900 dark:text-white">
            Pending assignments
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingAssignments.map((assignment) => (
              <PendingAssignmentCard
                key={assignment.id}
                assignment={assignment}
                onSubmit={handleSubmitAssignment}
                onViewPdf={handleViewPdf}
                isDemo={isDemo}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal for pending assignments */}
      <UploadModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) setSelectedAssignment(null)
        }}
        title="Submit your work"
        description="Upload your completed assignment for marking"
        context={{
          subject: selectedAssignment?.subject ?? '',
          assignmentName: selectedAssignment?.title ?? '',
        }}
        onUpload={handleUpload}
        maxFiles={1}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SubmissionFilters value={filter} onChange={setFilter} counts={counts} />
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          aria-label="Filter by subject"
          className="rounded-md border border-g-200 bg-white px-3 py-1.5 text-sm text-g-700 focus:border-p-500 focus:outline-none focus:ring-1 focus:ring-p-500 dark:border-g-300 dark:bg-g-100 dark:text-g-600"
        >
          <option value="All Subjects">All Subjects</option>
          {ALL_SUBJECTS.map((subject) => (
            <option key={subject} value={subject} disabled={!isEnrolled(subject)}>
              {subject}
              {!isEnrolled(subject) ? ' (not enrolled)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <SubmissionsTable
        submissions={filteredSubmissions}
        isLoading={isLoading}
        onView={handleView}
      />

      {/* PDF Viewer for pending assignment cards */}
      <PDFViewer
        open={pdfOpen}
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
