import { useState, useMemo } from 'react'
import { StatsCards } from '../components/StatsCards'
import { ScoreTrendChart } from '../components/ScoreTrendChart'
import { SubjectBreakdown } from '../components/SubjectBreakdown'
import { TopicBreakdown } from '../components/TopicBreakdown'
import { MasteryRadarChart } from '../components/MasteryRadarChart'
import { CurriculumTree } from '../components/CurriculumTree'
import { usePerformanceSubmissions } from '../hooks/use-performance-data'
import { useResolvedYearLevel } from '../hooks/use-full-curriculum-tree'
import { useLastPracticedSubject } from '../hooks/use-last-practiced-subject'
import type { Submission } from '@/features/dashboard'
import { useStudentStats } from '@/features/dashboard/hooks/use-student-stats'
import { useStudentSubjects } from '@/features/dashboard/hooks/use-student-subjects'
import { cn } from '@/shared/lib/cn'

/**
 * Calculate percentage score from mark and mark_total
 */
function getScorePercentage(mark: number | null, markTotal: number | null): number | null {
  if (mark === null || markTotal === null || markTotal === 0) {
    return null
  }
  return Math.round((mark / markTotal) * 100)
}

export function PerformanceScreen() {
  const { data: submissions, isLoading: submissionsLoading } = usePerformanceSubmissions()
  const { data: stats, isLoading: statsLoading } = useStudentStats()
  const { enrolled: enrolledSubjects } = useStudentSubjects()
  const { data: lastPracticedSubject, isLoading: lastPracticedLoading } = useLastPracticedSubject()

  // Subject selector for radar chart + curriculum tree
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  // Prefer the subject the student actually uses (most recent mastery
  // activity) over the alphabetical-first enrolled class, so a student
  // enrolled in Chemistry/English/Maths/Physics whose only mastery is in
  // Maths doesn't land on an empty Chemistry radar.
  const defaultSubject =
    lastPracticedSubject && enrolledSubjects.includes(lastPracticedSubject)
      ? lastPracticedSubject
      : (enrolledSubjects[0] ?? null)
  const activeSubject = selectedSubject ?? defaultSubject

  // While the last-practiced lookup is in flight, hold off on rendering
  // the radar/curriculum section so we don't flash the wrong tab before
  // swapping to the correct default.
  const defaultSubjectResolving =
    selectedSubject === null && lastPracticedLoading && enrolledSubjects.length > 0

  // Resolve year level for the active subject
  const { data: resolvedYear } = useResolvedYearLevel(activeSubject)

  const isLoading = submissionsLoading || statsLoading

  // Use real data only - no mock fallback
  const displaySubmissions: Submission[] = submissions ?? []

  // Calculate derived stats from real data
  const derivedStats = useMemo(() => {
    const graded = displaySubmissions.filter(
      (s) => getScorePercentage(s.mark, s.mark_total) !== null
    )
    const avgScore =
      graded.length > 0
        ? Math.round(
            graded.reduce((sum, s) => sum + (getScorePercentage(s.mark, s.mark_total) ?? 0), 0) /
              graded.length
          )
        : null

    // Completion rate: graded submissions / total submissions as a simple proxy
    const completionRate =
      displaySubmissions.length > 0
        ? Math.round((graded.length / displaySubmissions.length) * 100)
        : null

    return {
      totalSubmissions: displaySubmissions.length,
      averageScore: avgScore,
      completionRate,
      currentStreak: stats?.streak_days ?? 0,
    }
  }, [displaySubmissions, stats?.streak_days])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-g-900 dark:text-white">Performance</h1>
        <p className="mt-1 text-g-500 dark:text-g-600">See how you're going</p>
      </div>

      {/* Stats cards */}
      <StatsCards
        totalSubmissions={derivedStats.totalSubmissions}
        averageScore={derivedStats.averageScore}
        currentStreak={derivedStats.currentStreak}
        completionRate={derivedStats.completionRate}
        isLoading={isLoading}
      />

      {/* Charts and breakdown in 2-column layout on desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score trend chart */}
        <ScoreTrendChart submissions={displaySubmissions} isLoading={submissionsLoading} />

        {/* Subject breakdown */}
        <SubjectBreakdown
          submissions={displaySubmissions}
          isLoading={submissionsLoading}
          enrolledSubjects={enrolledSubjects}
        />
      </div>

      {/* Topic Performance Section */}
      <TopicBreakdown />

      {/* Subject-specific mastery section */}
      {enrolledSubjects.length > 0 ? (
        <>
          {/* Subject tabs */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-g-900 dark:text-white">
              Subject Mastery
            </h2>
            <div className="flex flex-wrap gap-2">
              {enrolledSubjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    activeSubject === subject
                      ? 'bg-p-500 text-white'
                      : 'bg-g-100 text-g-600 hover:bg-g-200'
                  )}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {/* Radar chart (full width when subject selected) */}
          {defaultSubjectResolving ? (
            <div
              className="rounded-xl border border-g-200 bg-card p-6 dark:border-g-200"
              style={{ height: 320 }}
              aria-hidden
            />
          ) : (
            activeSubject && (
              <>
                <MasteryRadarChart subject={activeSubject} />

                {/* Full curriculum tree */}
                <CurriculumTree subject={activeSubject} yearLevels={resolvedYear ?? null} />
              </>
            )
          )}
        </>
      ) : (
        /* Empty state when no subjects enrolled */
        <div className="rounded-xl border border-g-200 bg-white p-8 text-center dark:border-g-300 dark:bg-g-100">
          <p className="text-g-500 dark:text-g-600">
            Enrol in a class to see your performance breakdown
          </p>
        </div>
      )}
    </div>
  )
}
