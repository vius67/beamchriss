// Parent Performance screen — read-only view of the selected child's score trends and subject breakdown

import { useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { cn } from '@/shared/lib/cn'
import { formatSydney } from '@/shared/lib/tz-utils'
import { useParentChild } from '../context/ParentChildContext'
import { useParentPerformance, type ParentPerformanceItem } from '../hooks/use-parent-performance'
import { useParentMastery } from '../hooks/use-parent-mastery'
import { CurriculumTree } from '@/features/performance/components/CurriculumTree'
import { useResolvedYearLevel } from '@/features/performance/hooks/use-full-curriculum-tree'

function scorePercent(mark: number | null, maxMark: number | null): number | null {
  if (mark === null || maxMark === null || maxMark === 0) return null
  return Math.round((mark / maxMark) * 100)
}

/** Group items into week buckets (Sunday start) and compute average score per week */
function computeWeeklyAverages(
  items: ParentPerformanceItem[]
): Array<{ label: string; score: number }> {
  const weekMap = new Map<string, number[]>()

  for (const item of items) {
    const pct = scorePercent(item.mark, item.max_mark)
    if (pct === null) continue

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

/** Group items by subject and compute per-subject stats */
function computeSubjectBreakdown(
  items: ParentPerformanceItem[]
): Array<{ subject: string; avg: number; count: number; best: number }> {
  const subjectMap = new Map<string, number[]>()

  for (const item of items) {
    const pct = scorePercent(item.mark, item.max_mark)
    if (pct === null) continue
    const subject = item.subject ?? 'Unknown'
    if (!subjectMap.has(subject)) subjectMap.set(subject, [])
    subjectMap.get(subject)!.push(pct)
  }

  return Array.from(subjectMap.entries())
    .map(([subject, scores]) => ({
      subject,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
      best: Math.max(...scores),
    }))
    .sort((a, b) => b.count - a.count)
}

const SUBJECTS = ['Maths', 'Physics', 'Chemistry'] as const

export function ParentPerformanceScreen() {
  const { selectedChild, isLoading: childLoading } = useParentChild()
  const { data: items = [], isLoading } = useParentPerformance()
  const { data: radarData = [], isLoading: masteryLoading } = useParentMastery()

  const [selectedSubject, setSelectedSubject] = useState<string>('Maths')
  const { data: yearLevels } = useResolvedYearLevel(selectedSubject, selectedChild?.id ?? undefined)

  const derivedStats = useMemo(() => {
    const graded = items.filter((s) => scorePercent(s.mark, s.max_mark) !== null)
    const avgScore =
      graded.length > 0
        ? Math.round(
            graded.reduce((sum, s) => sum + (scorePercent(s.mark, s.max_mark) ?? 0), 0) /
              graded.length
          )
        : null
    const bestScore =
      graded.length > 0
        ? Math.max(...graded.map((s) => scorePercent(s.mark, s.max_mark) ?? 0))
        : null
    const completionRate =
      items.length > 0 ? Math.round((graded.length / items.length) * 100) : null

    return {
      totalSubmissions: items.length,
      averageScore: avgScore,
      bestScore,
      completionRate,
    }
  }, [items])

  const weeklyAverages = useMemo(() => computeWeeklyAverages(items), [items])
  const subjectBreakdown = useMemo(() => computeSubjectBreakdown(items), [items])

  if (!selectedChild && !childLoading) {
    return (
      <div className="rounded-xl border border-g-200 bg-card p-8 text-center dark:border-g-200">
        <p className="text-g-500 dark:text-g-600">No student linked to your account.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-g-900 dark:text-white">
          {selectedChild ? `Performance — ${selectedChild.name}` : 'Performance'}
        </h1>
        <p className="mt-1 text-g-500 dark:text-g-600">Score trends and subject breakdown</p>
      </div>

      {/* Stats cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-g-200 bg-card p-4 dark:border-g-200">
              <div className="h-3 w-20 animate-pulse rounded bg-g-200" />
              <div className="mt-2 h-7 w-12 animate-pulse rounded bg-g-200" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-g-200 bg-card p-4 dark:border-g-200">
            <p className="text-sm text-g-500 dark:text-g-600">Total Submissions</p>
            <p className="mt-1 text-2xl font-bold text-g-900 dark:text-white">
              {derivedStats.totalSubmissions}
            </p>
          </div>
          <div className="rounded-xl border border-g-200 bg-card p-4 dark:border-g-200">
            <p className="text-sm text-g-500 dark:text-g-600">Average Score</p>
            <p className="mt-1 text-2xl font-bold text-g-900 dark:text-white">
              {derivedStats.averageScore != null ? `${derivedStats.averageScore}%` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-g-200 bg-card p-4 dark:border-g-200">
            <p className="text-sm text-g-500 dark:text-g-600">Best Score</p>
            <p className="mt-1 text-2xl font-bold text-g-900 dark:text-white">
              {derivedStats.bestScore != null ? `${derivedStats.bestScore}%` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-g-200 bg-card p-4 dark:border-g-200">
            <p className="text-sm text-g-500 dark:text-g-600">Completion Rate</p>
            <p className="mt-1 text-2xl font-bold text-g-900 dark:text-white">
              {derivedStats.completionRate != null ? `${derivedStats.completionRate}%` : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Score trend */}
      <div className="rounded-xl border border-g-200 bg-card p-6 dark:border-g-200">
        <h2 className="mb-4 text-lg font-semibold text-g-900 dark:text-white">Score Trend</h2>
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-lg bg-g-200" />
        ) : weeklyAverages.length === 0 ? (
          <p className="text-sm text-g-500 dark:text-g-600">No scored submissions yet.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyAverages}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="parentPerfGradient" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#parentPerfGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Subject breakdown */}
      <div className="rounded-xl border border-g-200 bg-card p-6 dark:border-g-200">
        <h2 className="mb-4 text-lg font-semibold text-g-900 dark:text-white">By Subject</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded bg-g-200" />
            ))}
          </div>
        ) : subjectBreakdown.length === 0 ? (
          <p className="text-sm text-g-500 dark:text-g-600">No subject data yet.</p>
        ) : (
          <div className="space-y-3">
            {subjectBreakdown.map(({ subject, avg, count, best }) => (
              <div
                key={subject}
                className="flex items-center justify-between rounded-lg border border-g-200 p-3 dark:border-g-200"
              >
                <div>
                  <p className="font-medium text-g-900 dark:text-white">{subject}</p>
                  <p className="text-xs text-g-500 dark:text-g-600">
                    {count} submission{count !== 1 ? 's' : ''} &middot; best {best}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-g-900 dark:text-white">{avg}%</p>
                  <p className="text-xs text-g-500 dark:text-g-600">avg</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mastery radar */}
      <div className="rounded-xl border border-g-200 bg-card p-6 dark:border-g-200">
        <h2 className="mb-4 text-lg font-semibold text-g-900 dark:text-white">
          Strengths Overview
        </h2>
        {masteryLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-48 w-48 animate-pulse rounded-full bg-g-200" />
          </div>
        ) : radarData.length < 3 ? (
          <p className="text-sm text-g-500 dark:text-g-600">
            More assignments needed to show strengths overview.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="topic"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="mastery"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0]?.payload as { topic: string; mastery: number }
                  if (!p) return null
                  return (
                    <div
                      className="rounded-lg border px-3 py-2 text-sm shadow-sm"
                      style={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                      }}
                    >
                      <span style={{ color: 'hsl(var(--foreground))' }}>
                        {p.topic}: {p.mastery}% mastery
                      </span>
                    </div>
                  )
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Subject tabs + Curriculum tree */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                selectedSubject === s
                  ? 'bg-p-100 text-p-700 dark:bg-p-500/20 dark:text-p-500'
                  : 'text-g-600 hover:bg-g-100 dark:text-g-700 dark:hover:bg-g-200'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {selectedChild && yearLevels && (
          <CurriculumTree
            subject={selectedSubject}
            yearLevels={yearLevels}
            studentId={selectedChild.id}
          />
        )}
      </div>
    </div>
  )
}
