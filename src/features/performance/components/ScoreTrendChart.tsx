import { useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { sydneyDateStr } from '@/shared/lib/sydney-date'
import { formatSydney } from '@/shared/lib/tz-utils'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useStudentSubjects, ALL_SUBJECTS } from '@/features/dashboard'
import type { Submission } from '@/features/dashboard/types'

interface ScoreTrendChartProps {
  submissions: Submission[]
  isLoading: boolean
}

interface ChartDataPoint {
  date: string
  score: number
  label: string
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

function generateChartData(submissions: Submission[]): ChartDataPoint[] {
  // Get last 12 weeks of graded submissions
  const now = new Date()
  const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000)

  const gradedSubmissions = submissions
    .filter((s) => {
      const score = getScorePercentage(s)
      return score !== null && new Date(s.created_at) >= twelveWeeksAgo
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  if (gradedSubmissions.length === 0) {
    return []
  }

  // Group by week and average scores
  const weeklyScores = new Map<string, number[]>()

  gradedSubmissions.forEach((s) => {
    const score = getScorePercentage(s)
    if (score === null) return

    const date = new Date(s.created_at)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = sydneyDateStr(weekStart)

    if (!weeklyScores.has(weekKey)) {
      weeklyScores.set(weekKey, [])
    }
    const scores = weeklyScores.get(weekKey)
    if (scores) {
      scores.push(score)
    }
  })

  return Array.from(weeklyScores.entries()).map(([weekKey, scores]) => {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    return {
      date: weekKey,
      score: avg,
      label: formatSydney(weekKey, 'dayMonth'),
    }
  })
}

export function ScoreTrendChart({ submissions, isLoading }: ScoreTrendChartProps) {
  const { isEnrolled } = useStudentSubjects()
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  // Filter submissions by selected subject
  const filteredSubmissions = useMemo(() => {
    if (selectedSubject === 'all') {
      return submissions
    }
    return submissions.filter((s) => s.subject_name === selectedSubject)
  }, [submissions, selectedSubject])

  const chartData = useMemo(() => generateChartData(filteredSubmissions), [filteredSubmissions])
  const hasData = chartData.length > 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Score Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium text-g-900 dark:text-white">
          Score Trend
        </CardTitle>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="rounded-md border border-g-200 bg-white px-2 py-1 text-sm text-g-700 focus:border-p-500 focus:outline-none focus:ring-1 focus:ring-p-500 dark:border-g-300 dark:bg-g-100 dark:text-g-600"
        >
          <option value="all">All Subjects</option>
          {ALL_SUBJECTS.map((subject) => (
            <option key={subject} value={subject} disabled={!isEnrolled(subject)}>
              {subject}
              {!isEnrolled(subject) ? ' (not enrolled)' : ''}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="perfScoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(263 40% 66%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(263 40% 66%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-g-200 dark:stroke-g-700" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="fill-g-500"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                  className="fill-g-500"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  formatter={(value: number | undefined) => [
                    value !== undefined ? `${value}%` : '0%',
                    'Average Score',
                  ]}
                  labelFormatter={(label) => `Week of ${String(label)}`}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(263 40% 66%)"
                  strokeWidth={2}
                  fill="url(#perfScoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-g-500 dark:text-g-600">
              Complete some assignments to see your score trend
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
