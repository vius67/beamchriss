import { useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { UploadModal } from '@/shared/components/UploadModal'
import { PriorityBadge } from './PriorityBadge'
import { useHomeworkList } from '../hooks/use-homework-list'
import { useUploadSubmission } from '@/features/submissions'
import { formatSydney } from '@/shared/lib/tz-utils'
import type { HomeworkAssignment } from '../types'

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

interface AssignmentCardProps {
  assignment: HomeworkAssignment
  onSubmit: (assignment: HomeworkAssignment) => void
}

function AssignmentCard({ assignment, onSubmit }: AssignmentCardProps) {
  const isSubmitted = assignment.submission_status !== null

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col p-4">
        {/* Header with subject and priority */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-p-600 dark:text-p-400">{assignment.subject}</p>
            <h3 className="mt-0.5 font-semibold text-g-900 dark:text-white">{assignment.title}</h3>
          </div>
          {!isSubmitted && <PriorityBadge priority={assignment.priority} />}
        </div>

        {/* Details */}
        <div className="mt-2 flex-1">
          <p className="text-sm text-g-500 dark:text-g-600">{formatDueDate(assignment.due_date)}</p>
        </div>

        {/* Action */}
        <div className="mt-4">
          {isSubmitted ? (
            <div
              className={`rounded-lg px-3 py-2 text-center text-sm font-medium ${
                assignment.submission_status === 'marked'
                  ? 'bg-ok-bg text-ok-text'
                  : 'bg-p-100 text-p-700 dark:bg-p-700/50 dark:text-p-300'
              }`}
            >
              {assignment.submission_status === 'marked'
                ? 'Feedback ready'
                : 'Sent to marking team'}
            </div>
          ) : (
            <Button onClick={() => onSubmit(assignment)} className="w-full" variant="outline">
              Submit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="mb-2 h-4 w-16" />
            <Skeleton className="mb-4 h-5 w-32" />
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Grid of assignment cards with individual Submit buttons
 *
 * Features:
 * - Responsive grid layout (1 col mobile, 2 cols tablet, 3 cols desktop)
 * - Each card shows subject, title, question count, due date
 * - Priority badge for unsubmitted work
 * - Individual Submit button opens modal with assignment context
 * - Status badges for submitted work
 */
export function AssignmentGrid() {
  const { data: assignments, isLoading } = useHomeworkList()
  const [selectedAssignment, setSelectedAssignment] = useState<HomeworkAssignment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const uploadMutation = useUploadSubmission()

  const handleSubmit = (assignment: HomeworkAssignment) => {
    setSelectedAssignment(assignment)
    setIsModalOpen(true)
  }

  const handleUpload = async (files: File[]) => {
    if (!selectedAssignment) return

    // Always pass homeworkId - mock assignments use UUIDs from seed data (028_mock_homework_seed.sql)
    await uploadMutation.mutateAsync({ files, homeworkId: selectedAssignment.id })
  }

  if (isLoading) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold text-g-900 dark:text-white">Your assignments</h2>
        <LoadingSkeleton />
      </div>
    )
  }

  // Show all assignments (pending and submitted) with their correct status
  const displayAssignments = assignments ?? []

  if (displayAssignments.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold text-g-900 dark:text-white">Your assignments</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-sm text-g-500 dark:text-g-400">No assignments yet</p>
            <p className="mt-1 text-xs text-g-400 dark:text-g-500">
              Your homework will appear here once your tutor assigns it
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-g-900 dark:text-white">Your assignments</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayAssignments.slice(0, 6).map((assignment) => (
          <AssignmentCard key={assignment.id} assignment={assignment} onSubmit={handleSubmit} />
        ))}
      </div>

      {/* Upload Modal */}
      <UploadModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) {
            // Reset selection when modal closes
            setSelectedAssignment(null)
          }
        }}
        title="Submit your work"
        description="Upload your completed assignment for marking"
        context={{
          subject: selectedAssignment?.subject ?? '',
          assignmentName: selectedAssignment?.title ?? '',
        }}
        onUpload={handleUpload}
      />
    </div>
  )
}
