// Past Papers screen
// Upload interface for student-initiated past paper submissions

import { useState } from 'react'
import { PaperUploadForm } from '../components/PaperUploadForm'
import { PaperHistory } from '../components/PaperHistory'
import { cn } from '@/shared/lib/cn'
import { useStudentSubjects, ALL_SUBJECTS } from '@/features/dashboard'
import { usePastPaperStats } from '../hooks/use-past-paper-stats'
import { FileText, TrendingUp, TrendingDown, Trophy, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { StatCardSkeletonGrid } from '@/shared/components/StatCardSkeleton'

export function PastPapersScreen() {
  const { isEnrolled } = useStudentSubjects()
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const { stats, isLoading: statsLoading } = usePastPaperStats()

  const handleSubmit = async (
    _file: File,
    _metadata: { subject: string; year: string; type: string }
  ) => {
    // Upload is now handled by PaperUploadForm directly via usePastPaperSubmission
    // This callback is for any additional handling the screen needs after upload
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-g-900 dark:text-white">Past Papers</h1>
        <p className="mt-1 text-g-500 dark:text-g-600">
          Upload your completed past paper for marking
        </p>
      </div>

      {/* Performance stats card */}
      {statsLoading && !stats && <StatCardSkeletonGrid count={4} />}
      {stats && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-g-400 dark:text-g-500">
                  <FileText className="h-4 w-4" />
                </div>
                <p className="mt-1 text-2xl font-bold text-g-900 dark:text-white">
                  {stats.totalPapers}
                </p>
                <p className="text-xs text-g-500 dark:text-g-600">Papers</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-g-400 dark:text-g-500">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <p className="mt-1 text-2xl font-bold text-p-600 dark:text-p-400">
                  {stats.avgScore}%
                </p>
                <p className="text-xs text-g-500 dark:text-g-600">Average</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-g-400 dark:text-g-500">
                  <Trophy className="h-4 w-4" />
                </div>
                <p className="mt-1 text-2xl font-bold text-ok">{stats.bestScore}%</p>
                <p className="text-xs text-g-500 dark:text-g-600">Best</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1">
                  {stats.scoreTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : stats.scoreTrend < 0 ? (
                    <TrendingDown className="h-4 w-4 text-orange-500" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-g-400 dark:text-g-500" />
                  )}
                </div>
                <p
                  className={cn(
                    'mt-1 text-2xl font-bold',
                    stats.scoreTrend > 0
                      ? 'text-green-600 dark:text-green-400'
                      : stats.scoreTrend < 0
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-g-700 dark:text-g-600'
                  )}
                >
                  {stats.scoreTrend > 0 ? '+' : ''}
                  {stats.scoreTrend}%
                </p>
                <p className="text-xs text-g-500 dark:text-g-600">Trend</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload form */}
      <PaperUploadForm onSubmit={handleSubmit} />

      {/* Subject tabs */}
      <div className="border-b border-g-200 dark:border-g-300">
        <nav className="-mb-px flex space-x-6" aria-label="Filter by subject">
          {/* All tab */}
          <button
            onClick={() => setSelectedSubject('All')}
            className={cn(
              'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
              selectedSubject === 'All'
                ? 'border-p-500 text-p-600 dark:text-p-400'
                : 'border-transparent text-g-500 hover:border-g-300 hover:text-g-700 dark:text-g-600 dark:hover:text-white'
            )}
            aria-current={selectedSubject === 'All' ? 'page' : undefined}
          >
            All
          </button>
          {/* Subject tabs */}
          {ALL_SUBJECTS.map((subject) => {
            const enrolled = isEnrolled(subject)
            return (
              <button
                key={subject}
                onClick={() => enrolled && setSelectedSubject(subject)}
                disabled={!enrolled}
                className={cn(
                  'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                  !enrolled
                    ? 'cursor-not-allowed border-transparent text-g-300 dark:text-g-600'
                    : selectedSubject === subject
                      ? 'border-p-500 text-p-600 dark:text-p-400'
                      : 'border-transparent text-g-500 hover:border-g-300 hover:text-g-700 dark:text-g-600 dark:hover:text-white'
                )}
                aria-current={selectedSubject === subject ? 'page' : undefined}
              >
                {subject}
              </button>
            )
          })}
        </nav>
      </div>

      {/* History filtered by subject */}
      <PaperHistory subjectFilter={selectedSubject === 'All' ? undefined : selectedSubject} />
    </div>
  )
}
