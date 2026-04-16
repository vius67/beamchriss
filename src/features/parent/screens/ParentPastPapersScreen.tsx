// Parent Past Papers screen — read-only history of the selected child's past paper submissions
// NO upload form — parents can only view results

import { useState, useMemo } from 'react'
import { cn } from '@/shared/lib/cn'
import { useParentChild } from '../context/ParentChildContext'
import {
  useParentPastPapers,
  type ParentPastPaperSubmission,
} from '../hooks/use-parent-past-papers'
import { formatSydney } from '@/shared/lib/tz-utils'

function formatDate(dateStr: string): string {
  return formatSydney(dateStr, 'dayMonth')
}

function scorePercent(mark: number | null, maxMark: number | null): number | null {
  if (mark === null || maxMark === null || maxMark === 0) return null
  return Math.round((mark / maxMark) * 100)
}

function PaperRow({ paper }: { paper: ParentPastPaperSubmission }) {
  const pct = scorePercent(paper.mark, paper.max_mark)
  const isScored = pct !== null

  return (
    <div className="flex items-center justify-between rounded-xl border border-g-200 bg-card p-4 dark:border-g-200">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-g-900 dark:text-white">{paper.subject}</span>
          <span className="text-sm text-g-500 dark:text-g-600">
            {paper.exam_year} &middot; {paper.paper_type}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-g-500 dark:text-g-600">{formatDate(paper.created_at)}</p>
      </div>
      <div className="ml-4 shrink-0 text-right">
        {isScored ? (
          <>
            <p className="text-lg font-bold text-g-900 dark:text-white">{pct}%</p>
            <p className="text-xs text-g-500 dark:text-g-600">
              {paper.mark}/{paper.max_mark}
            </p>
          </>
        ) : (
          <span className="inline-flex items-center rounded-full bg-g-100 px-2.5 py-0.5 text-xs font-medium text-g-600 dark:bg-g-200 dark:text-g-500">
            In Review
          </span>
        )}
      </div>
    </div>
  )
}

const SUBJECTS = ['Maths', 'Physics', 'Chemistry']

export function ParentPastPapersScreen() {
  const { selectedChild, isLoading: childLoading } = useParentChild()
  const { data: papers = [], isLoading } = useParentPastPapers()
  const [selectedSubject, setSelectedSubject] = useState<string>('All')

  const stats = useMemo(() => {
    const scored = papers.filter((p) => scorePercent(p.mark, p.max_mark) !== null)
    const avg =
      scored.length > 0
        ? Math.round(
            scored.reduce((sum, p) => sum + (scorePercent(p.mark, p.max_mark) ?? 0), 0) /
              scored.length
          )
        : null
    const best =
      scored.length > 0
        ? Math.max(...scored.map((p) => scorePercent(p.mark, p.max_mark) ?? 0))
        : null

    // Trend: average of recent half vs older half (requires >= 4 scored items)
    const recentScores = scored.slice(0, 6).map((p) => scorePercent(p.mark, p.max_mark) ?? 0)
    let trend: number | null = null
    if (recentScores.length >= 4) {
      const half = Math.floor(recentScores.length / 2)
      const recentAvg = recentScores.slice(0, half).reduce((a, b) => a + b, 0) / half
      const olderAvg =
        recentScores.slice(half).reduce((a, b) => a + b, 0) / (recentScores.length - half)
      trend = Math.round(recentAvg - olderAvg)
    }

    return { total: papers.length, avg, best, trend }
  }, [papers])

  const filteredPapers = useMemo(() => {
    if (selectedSubject === 'All') return papers
    return papers.filter((p) => p.subject === selectedSubject)
  }, [papers, selectedSubject])

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
          {selectedChild ? `Past Papers — ${selectedChild.name}` : 'Past Papers'}
        </h1>
        <p className="mt-1 text-g-500 dark:text-g-600">Past paper results</p>
      </div>

      {/* Stats cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-g-200 bg-card p-4 dark:border-g-200">
              <div className="h-3 w-16 animate-pulse rounded bg-g-200" />
              <div className="mt-2 h-7 w-10 animate-pulse rounded bg-g-200" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-g-200 bg-card p-4 dark:border-g-200">
            <p className="text-sm text-g-500 dark:text-g-600">Total Papers</p>
            <p className="mt-1 text-2xl font-bold text-g-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-g-200 bg-card p-4 dark:border-g-200">
            <p className="text-sm text-g-500 dark:text-g-600">Average</p>
            <p className="mt-1 text-2xl font-bold text-g-900 dark:text-white">
              {stats.avg != null ? `${stats.avg}%` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-g-200 bg-card p-4 dark:border-g-200">
            <p className="text-sm text-g-500 dark:text-g-600">Best</p>
            <p className="mt-1 text-2xl font-bold text-g-900 dark:text-white">
              {stats.best != null ? `${stats.best}%` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-g-200 bg-card p-4 dark:border-g-200">
            <p className="text-sm text-g-500 dark:text-g-600">Trend</p>
            <p
              className={cn(
                'mt-1 text-2xl font-bold',
                stats.trend == null
                  ? 'text-g-900 dark:text-white'
                  : stats.trend > 0
                    ? 'text-green-600 dark:text-green-400'
                    : stats.trend < 0
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-g-900 dark:text-white'
              )}
            >
              {stats.trend == null ? '—' : stats.trend > 0 ? `+${stats.trend}%` : `${stats.trend}%`}
            </p>
          </div>
        </div>
      )}

      {/* Subject filter tabs */}
      <div className="border-b border-g-200 dark:border-g-300">
        <nav className="-mb-px flex space-x-6" aria-label="Filter by subject">
          <button
            onClick={() => setSelectedSubject('All')}
            className={cn(
              'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
              selectedSubject === 'All'
                ? 'border-p-500 text-p-600 dark:text-p-400'
                : 'border-transparent text-g-500 hover:border-g-300 hover:text-g-700 dark:text-g-600 dark:hover:text-white'
            )}
          >
            All
          </button>
          {SUBJECTS.map((subject) => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={cn(
                'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                selectedSubject === subject
                  ? 'border-p-500 text-p-600 dark:text-p-400'
                  : 'border-transparent text-g-500 hover:border-g-300 hover:text-g-700 dark:text-g-600 dark:hover:text-white'
              )}
            >
              {subject}
            </button>
          ))}
        </nav>
      </div>

      {/* Paper history list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-g-200" />
          ))}
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="rounded-xl border border-g-200 bg-card p-8 text-center dark:border-g-200">
          <p className="text-g-500 dark:text-g-600">
            {selectedSubject === 'All'
              ? 'No past papers submitted yet.'
              : `No past papers for ${selectedSubject}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPapers.map((paper) => (
            <PaperRow key={paper.id} paper={paper} />
          ))}
        </div>
      )}
    </div>
  )
}
