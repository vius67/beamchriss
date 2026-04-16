// Parent Dashboard screen — read-only overview of the selected child's activity

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
import { useParentChild } from '../context/ParentChildContext'
import { useParentStudentStats } from '../hooks/use-parent-student-stats'
import { useParentSubmissions } from '../hooks/use-parent-submissions'
import { formatSydney } from '@/shared/lib/tz-utils'
import { useParentPerformance, type ParentPerformanceItem } from '../hooks/use-parent-performance'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-g-200 bg-card p-4 dark:border-g-200">
      <p className="text-sm text-g-500 dark:text-g-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-g-900 dark:text-white">{value}</p>
    </div>
  )
}

function formatDate(dateStr: string): string {
  return formatSydney(dateStr, 'dayMonth')
}

function scoreLabel(mark: number | null, markTotal: number | null): string {
  if (mark === null || markTotal === null || markTotal === 0) return '—'
  return `${Math.round((mark / markTotal) * 100)}%`
}

function computeChartData(items: ParentPerformanceItem[]): { label: string; score: number }[] {
  const weekMap = new Map<string, number[]>()
  for (const item of items) {
    if (item.mark === null || item.max_mark === null || item.max_mark === 0) continue
    const pct = Math.round((item.mark / item.max_mark) * 100)
    const d = new Date(item.created_at)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay()) // Sunday start
    const key = weekStart.toISOString().slice(0, 10)
    if (!weekMap.has(key)) weekMap.set(key, [])
    weekMap.get(key)!.push(pct)
  }
  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, scores]) => ({
      label: formatSydney(key, 'dayMonth'),
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))
}

export function ParentDashboardScreen() {
  const { selectedChild, isLoading: childLoading } = useParentChild()
  const { data: stats, isLoading: statsLoading } = useParentStudentStats()
  const { data: submissions, isLoading: submissionsLoading } = useParentSubmissions()
  const { data: performanceItems = [], isLoading: perfLoading } = useParentPerformance()

  const isLoading = childLoading || statsLoading

  const chartData = useMemo(() => computeChartData(performanceItems), [performanceItems])
  const hasChartData = chartData.some((d) => d.score > 0)

  if (!selectedChild && !childLoading) {
    return (
      <div className="rounded-xl border border-g-200 bg-card p-8 text-center dark:border-g-200">
        <p className="text-g-500 dark:text-g-600">No student linked to your account.</p>
      </div>
    )
  }

  const recentSubmissions = (submissions ?? []).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-g-900 dark:text-white">
          {selectedChild ? `Dashboard — ${selectedChild.name}` : 'Dashboard'}
        </h1>
        {selectedChild?.year_level && (
          <p className="mt-1 text-g-500 dark:text-g-600">Year {selectedChild.year_level}</p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-g-200 bg-card p-4 dark:border-g-200">
                <div className="h-3 w-16 animate-pulse rounded bg-g-200" />
                <div className="mt-2 h-7 w-10 animate-pulse rounded bg-g-200" />
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard label="Pending" value={stats?.pending_count ?? 0} />
            <StatCard label="Marked" value={stats?.graded_count ?? 0} />
            <StatCard
              label="Average"
              value={stats?.average_score != null ? `${Math.round(stats.average_score)}%` : '—'}
            />
            <StatCard label="Streak" value={`${stats?.streak_days ?? 0}d`} />
          </>
        )}
      </div>

      {/* Progress chart */}
      <div className="rounded-xl border border-g-200 bg-card p-6 dark:border-g-200">
        <h2 className="mb-4 text-base font-medium text-g-900 dark:text-white">Progress</h2>
        {perfLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-g-200" />
        ) : !hasChartData ? (
          <p className="text-sm text-g-500 dark:text-g-600">No scored submissions yet.</p>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="parentScoreGradient" x1="0" y1="0" x2="0" y2="1">
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
                  tickFormatter={(v) => `${v}%`}
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
                  fill="url(#parentScoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent submissions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-g-800 dark:text-white">
          Recent Submissions
        </h2>

        {submissionsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-g-200" />
            ))}
          </div>
        ) : recentSubmissions.length === 0 ? (
          <div className="rounded-xl border border-g-200 bg-card p-6 text-center dark:border-g-200">
            <p className="text-g-500 dark:text-g-600">No marked submissions yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-g-200 bg-card dark:border-g-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-g-200 dark:border-g-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-g-500 dark:text-g-600">
                    Title
                  </th>
                  <th className="hidden px-4 py-3 text-left text-sm font-medium text-g-500 dark:text-g-600 sm:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-g-500 dark:text-g-600">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((sub, idx) => (
                  <tr
                    key={sub.id}
                    className={
                      idx < recentSubmissions.length - 1
                        ? 'border-b border-g-200 dark:border-g-200'
                        : ''
                    }
                  >
                    <td className="px-4 py-3 text-sm text-g-900 dark:text-white">
                      {sub.homework_title ?? 'Homework'}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-g-500 dark:text-g-600 sm:table-cell">
                      {formatDate(sub.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-g-900 dark:text-white">
                      {scoreLabel(sub.mark, sub.mark_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
