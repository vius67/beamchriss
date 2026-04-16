import { GraduationCap, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useClassSchedule } from '../hooks/use-class-schedule'
import type { ClassScheduleEntry } from '../hooks/use-class-schedule'

/**
 * Format a TIME string (e.g. "16:00:00") to display format (e.g. "4:00 PM")
 */
function formatTime(time: string): string {
  // TIME columns come as "HH:MM:SS" or "HH:MM"
  const parts = time.split(':')
  const hours = parseInt(parts[0] ?? '0', 10)
  const minutes = parts[1] ?? '00'
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${minutes} ${period}`
}

/**
 * Single class entry row
 */
function ClassEntry({ entry }: { entry: ClassScheduleEntry }) {
  return (
    <div className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-g-50 dark:hover:bg-g-200/50">
      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-p-100 dark:bg-p-700/50">
        <GraduationCap className="h-4 w-4 text-p-600 dark:text-p-400" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-g-900 dark:text-white">{entry.subject}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-g-500 dark:text-g-600">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {entry.dayOfWeek} {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
          </span>
          {entry.room && (
            <>
              <span aria-hidden="true">&middot;</span>
              <span>Room {entry.room}</span>
            </>
          )}
        </div>
        {entry.tutorName && (
          <p className="mt-0.5 text-xs text-g-500 dark:text-g-600">{entry.tutorName}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Your Classes card for the dashboard
 *
 * Shows the student's enrolled class schedule including:
 * - Subject name (bold)
 * - Day + time range
 * - Room
 * - Tutor name (resolved via SECURITY DEFINER RPC)
 *
 * Sorted by day of week, then start time.
 */
export function ClassScheduleCard() {
  const { data: classes, isLoading } = useClassSchedule()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-g-900 dark:text-white">
            Your classes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1">
                <Skeleton className="mb-1 h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!classes || classes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-g-900 dark:text-white">
            Your classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-g-500 dark:text-g-600">No classes found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-g-900 dark:text-white">
          Your classes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {classes.map((entry) => (
            <ClassEntry key={entry.classId} entry={entry} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
