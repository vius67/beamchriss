import { useStudentStats } from '@/features/dashboard'

import { Skeleton } from '@/shared/components/ui/skeleton'
import { Card, CardContent } from '@/shared/components/ui/card'
import { TrendingUp, BookOpen, Flame, Award } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { formatSydney } from '@/shared/lib/tz-utils'

/**
 * Shareable progress card designed for Instagram/Snapchat screenshots
 *  Weekly progress screenshot card with BEAM branding
 */
export function ProgressCard() {
  const { data: stats, isLoading } = useStudentStats()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    )
  }

  // Calculate stats
  const totalSubmissions = stats?.total_submissions ?? 0
  const streak = stats?.streak_days ?? 0
  const avgScore = stats?.average_score ?? 0
  const bestStreak = stats?.longest_streak ?? 0

  return (
    <Card className="overflow-hidden">
      {/* Header with gradient */}
      <div className="from-primary-600 to-primary-500 bg-gradient-to-r px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm font-medium">Weekly Progress</p>
            <h3 className="text-xl font-bold text-white">My Stats</h3>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            <span className="text-lg font-bold text-white">B</span>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Stats grid - designed for screenshot */}
        <div className="grid grid-cols-2 gap-4">
          {/* Submissions */}
          <div className="rounded-lg bg-g-50 p-4 text-center dark:bg-g-200">
            <BookOpen className="text-primary-500 mx-auto mb-2 h-6 w-6" />
            <p className="text-2xl font-bold text-g-900">{totalSubmissions}</p>
            <p className="text-xs text-g-500">Submitted</p>
          </div>

          {/* Streak */}
          <div
            className={cn(
              'rounded-lg p-4 text-center',
              streak > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-g-50 dark:bg-g-200'
            )}
          >
            <Flame
              className={cn('mx-auto mb-2 h-6 w-6', streak > 0 ? 'text-orange-500' : 'text-g-400')}
            />
            <p
              className={cn(
                'text-2xl font-bold',
                streak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-g-400'
              )}
            >
              {streak}
            </p>
            <p className="text-xs text-g-500">Day Streak</p>
          </div>

          {/* Average score */}
          <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
            <TrendingUp className="mx-auto mb-2 h-6 w-6 text-green-500" />
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {avgScore > 0 ? `${Math.round(avgScore)}%` : '--'}
            </p>
            <p className="text-xs text-g-500">Average</p>
          </div>

          {/* Best streak */}
          <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
            <Award className="mx-auto mb-2 h-6 w-6 text-blue-500" />
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{bestStreak}</p>
            <p className="text-xs text-g-500">Best Streak</p>
          </div>
        </div>

        {/* Footer with BEAM branding */}
        <div className="mt-4 flex items-center justify-between border-t border-g-200 pt-4">
          <p className="text-xs text-g-400">{formatSydney(new Date(), 'date')}</p>
          <p className="text-primary-600 dark:text-primary-400 text-xs font-medium">BEAM Academy</p>
        </div>
      </CardContent>
    </Card>
  )
}
