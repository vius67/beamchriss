import { useMemo } from 'react'
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
import { safePercent } from '@/shared/utils/percentage'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useSubmissions } from '../hooks/use-submissions'
import type { Submission } from '../types'

interface ChartDataPoint {
  date: string
  score: number
  label: string
}

/**
 * Generate chart data from submissions
 * Groups by week and averages scores
 */
function generateChartData(submissions: Submission[]): ChartDataPoint[] {
  // Get last 8 weeks of graded submissions
  const now = new Date()
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000)

  const gradedSubmissions = submissions
    .filter((s) => {
      // Only include if marked and has score
      if (s.display_status !== 'marked') return false
      if (s.mark === null || s.mark_total === null || s.mark_total === 0) return false
      return new Date(s.created_at) >= eightWeeksAgo
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  if (gradedSubmissions.length === 0) {
    // Return placeholder data for empty state
    return Array.from({ length: 4 }, (_, i) => ({
      date: `Week ${i + 1}`,
      score: 0,
      label: `Week ${i + 1}`,
    }))
  }

  // Group by week and average scores
  const weeklyScores = new Map<string, number[]>()

  gradedSubmissions.forEach((s) => {
    const date = new Date(s.created_at)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = sydneyDateStr(weekStart)

    if (!weeklyScores.has(weekKey)) {
      weeklyScores.set(weekKey, [])
    }
    // Calculate percentage score (safePercent guards against null/0 denominators)
    const percentage = safePercent(s.mark, s.mark_total)
    const scores = weeklyScores.get(weekKey)
    if (scores) {
      scores.push(percentage)
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

/**
 * Progress chart showing score trend over time
 *
 * Features:
 * - Recharts area chart with purple gradient
 * - Groups submissions by week
 * - Shows average percentage score per week
 * - Empty state when no graded submissions
 * - Responsive sizing
 */
export function ProgressChart() {
  const { data: submissions, isLoading } = useSubmissions(50) // Get more for chart

  const chartData = useMemo(() => {
    if (!submissions || submissions.length === 0) {
      return []
    }
    return generateChartData(submissions)
  }, [submissions])

  const hasData = chartData.some((d) => d.score > 0)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-g-900 dark:text-white">
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-center">
            <p className="text-sm text-g-500 dark:text-g-400">
              Submit your first homework to see your progress here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
