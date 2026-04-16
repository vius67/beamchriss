import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useStudentStats, useHomeworkList } from '@/features/dashboard'
import { PriorityBadge } from './PriorityBadge'
import { UploadZone } from './UploadZone'
import { FileCheck, PartyPopper } from 'lucide-react'
import { formatSydney } from '@/shared/lib/tz-utils'

export function NextTaskCard() {
  const { data: stats, isLoading: statsLoading } = useStudentStats()
  const { data: homework, isLoading: homeworkLoading } = useHomeworkList()

  const isLoading = statsLoading || homeworkLoading

  // Find the next task homework
  const nextTask = homework?.find((hw) => hw.id === stats?.next_task_homework_id)

  // Upload is handled internally by <UploadZone /> via its own mutation hook.
  // This no-op is retained only to satisfy the required prop signature — the
  // zone fires the real upload pipeline itself and does not rely on a caller.
  const handleFileSelect = (_files: FileList) => {
    // intentional no-op (UploadZone owns the upload flow)
  }

  // Loading state with skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  // All caught up state
  if (!nextTask) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
        <CardContent className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
            All caught up!
          </h3>
          <p className="mt-1 text-green-600 dark:text-green-400">
            No pending assignments. Great work!
          </p>
        </CardContent>
      </Card>
    )
  }

  // Already submitted state
  if (nextTask.submission_status === 'submitted' || nextTask.submission_status === 'marked') {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <span className="text-sm font-medium text-g-500 dark:text-g-600">Next Task</span>
          <PriorityBadge priority={nextTask.priority} />
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-g-900 dark:text-white">{nextTask.title}</h3>
            <p className="text-sm text-g-500 dark:text-g-600">
              {nextTask.subject} - {nextTask.class_name}
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  {nextTask.submission_status === 'marked' ? 'Marked' : 'Submitted'}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {nextTask.submission_status === 'marked'
                    ? 'Your results are ready to view'
                    : 'Sent to our marking team'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Normal state - show upload zone
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="text-sm font-medium text-g-500 dark:text-g-600">Next Task</span>
        <PriorityBadge priority={nextTask.priority} />
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-g-900 dark:text-white">{nextTask.title}</h3>
          <p className="text-sm text-g-500 dark:text-g-600">
            {nextTask.subject} - {nextTask.class_name}
          </p>
          {nextTask.due_date && (
            <p className="mt-1 text-sm text-g-500 dark:text-g-600">
              Due: {formatSydney(nextTask.due_date, 'date')}
            </p>
          )}
        </div>

        <UploadZone
          homeworkId={nextTask.id}
          homeworkTitle={nextTask.title}
          onFileSelect={handleFileSelect}
        />
      </CardContent>
    </Card>
  )
}
