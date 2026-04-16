import { useState } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/cn'
import { formatSydney } from '@/shared/lib/tz-utils'
import type { Submission } from '@/features/dashboard/types'

/**
 * Normalize free-text subject names to canonical BEAM subjects.
 * e.g. "Mathematics Extension 2" -> "Maths", "Physics Prelim" -> "Physics"
 */
function normalizeSubject(subject: string): string {
  const lower = subject.toLowerCase()
  if (lower.includes('math')) return 'Maths'
  if (lower.includes('phys')) return 'Physics'
  if (lower.includes('chem')) return 'Chemistry'
  if (lower.includes('eng')) return 'English'
  return subject // fallback to original
}

interface SubjectBreakdownProps {
  submissions: Submission[]
  isLoading: boolean
  /** Only show these subjects (student's enrolled subjects) */
  enrolledSubjects?: string[]
}

interface SubjectStats {
  subject: string
  submissions: number
  averageScore: number | null
  latestScore: number | null
  trend: 'up' | 'down' | 'stable'
  recentSubmissions: Array<{
    id: string
    score: number | null
    date: string
    type: string
  }>
}

/**
 * Calculate percentage score from mark and mark_total
 */
function getScorePercentage(submission: Submission): number | null {
  if (submission.mark === null || submission.mark_total === null) {
    return null
  }
  if (submission.mark_total === 0) {
    return null
  }
  return Math.round((submission.mark / submission.mark_total) * 100)
}

function calculateSubjectStats(submissions: Submission[]): SubjectStats[] {
  const subjectMap = new Map<string, Submission[]>()

  submissions.forEach((s) => {
    const rawSubject = s.subject_name || 'Other'
    const subject = normalizeSubject(rawSubject)
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, [])
    }
    subjectMap.get(subject)!.push(s)
  })

  return Array.from(subjectMap.entries())
    .map(([subject, subs]) => {
      const graded = subs.filter((s) => getScorePercentage(s) !== null)
      const avgScore =
        graded.length > 0
          ? Math.round(
              graded.reduce((sum, s) => sum + (getScorePercentage(s) ?? 0), 0) / graded.length
            )
          : null

      const sorted = graded.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const latestScore = sorted[0] ? getScorePercentage(sorted[0]) : null

      // Calculate trend (compare last 3 to previous 3)
      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (sorted.length >= 4) {
        const recentScores = sorted.slice(0, 3).map((s) => getScorePercentage(s) ?? 0)
        const previousScores = sorted
          .slice(3, 6)
          .map((s) => getScorePercentage(s) ?? 0)
          .filter((score) => score > 0)

        if (recentScores.length > 0 && previousScores.length > 0) {
          const recent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
          const previous = previousScores.reduce((a, b) => a + b, 0) / previousScores.length
          if (recent > previous + 5) trend = 'up'
          else if (recent < previous - 5) trend = 'down'
        }
      }

      return {
        subject,
        submissions: subs.length,
        averageScore: avgScore,
        latestScore,
        trend,
        recentSubmissions: subs.slice(0, 5).map((s) => ({
          id: s.id,
          score: getScorePercentage(s),
          date: s.created_at,
          type: s.submission_type === 'past_paper' ? 'Past Paper' : 'Homework',
        })),
      }
    })
    .sort((a, b) => b.submissions - a.submissions)
}

function SubjectRow({ stats }: { stats: SubjectStats }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const TrendIcon = stats.trend === 'up' ? TrendingUp : Minus
  const trendColor = stats.trend === 'up' ? 'text-ok' : 'text-g-400'

  return (
    <div className="border-b border-g-200 last:border-0 dark:border-g-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-g-50 dark:hover:bg-g-200/50"
      >
        {/* Subject name */}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-g-900 dark:text-white">{stats.subject}</p>
          <p className="text-sm text-g-500 dark:text-g-600">
            {stats.submissions} submission{stats.submissions !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Average score */}
        <div className="text-right">
          <p className="text-lg font-bold text-g-900 dark:text-white">
            {stats.averageScore !== null ? `${stats.averageScore}%` : '--'}
          </p>
          <div className={cn('flex items-center justify-end gap-1 text-xs', trendColor)}>
            <TrendIcon className="h-3 w-3" />
            <span>{stats.trend === 'up' ? 'Improving' : 'Steady'}</span>
          </div>
        </div>

        {/* Expand icon */}
        <div className="text-g-400">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="bg-g-50 px-4 pb-4 dark:bg-g-200/30">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-g-500 dark:text-g-600">
            Recent submissions
          </p>
          <div className="space-y-2">
            {stats.recentSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-lg bg-white p-2 dark:bg-g-100"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-g-100 px-2 py-0.5 text-xs dark:bg-g-300">
                    {sub.type}
                  </span>
                  <span className="text-sm text-g-600 dark:text-g-600">
                    {formatSydney(sub.date, 'dayMonth')}
                  </span>
                </div>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    sub.score !== null
                      ? sub.score >= 80
                        ? 'text-ok'
                        : sub.score >= 60
                          ? 'text-warn-text'
                          : 'text-err'
                      : 'text-g-400'
                  )}
                >
                  {sub.score !== null ? `${sub.score}%` : 'In review'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function SubjectBreakdown({
  submissions,
  isLoading,
  enrolledSubjects,
}: SubjectBreakdownProps) {
  const allStats = calculateSubjectStats(submissions)
  // Filter to enrolled subjects only (if provided)
  const subjectStats = enrolledSubjects
    ? allStats.filter((s) => enrolledSubjects.includes(s.subject))
    : allStats

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Subject Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (subjectStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-g-900 dark:text-white">
            Subject Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-g-500 dark:text-g-600">
            Complete some assignments to see your subject breakdown
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-medium text-g-900 dark:text-white">
          Subject Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-g-200 dark:divide-g-300">
          {subjectStats.map((stats) => (
            <SubjectRow key={stats.subject} stats={stats} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
