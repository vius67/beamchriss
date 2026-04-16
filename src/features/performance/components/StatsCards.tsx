import { Card, CardContent } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'

interface StatsCardsProps {
  totalSubmissions: number
  averageScore: number | null
  currentStreak: number
  completionRate: number | null
  isLoading: boolean
}

interface StatCardProps {
  label: string
  value: string | number
  valueColor?: 'purple' | 'orange' | 'green' | 'default'
  trend?: string | undefined
}

function StatCard({ label, value, valueColor = 'default', trend }: StatCardProps) {
  const valueColors = {
    purple: 'text-p-600 dark:text-p-400',
    orange: 'text-orange-500 dark:text-orange-400',
    green: 'text-ok-text dark:text-green-400',
    default: 'text-g-800 dark:text-white',
  }

  return (
    <Card>
      <CardContent className="p-4">
        <p className="mb-1 text-xs text-g-500 dark:text-g-600">{label}</p>
        <p className={`text-xl font-semibold ${valueColors[valueColor]}`}>{value}</p>
        {trend && <p className="mt-1 text-xs text-ok-text dark:text-green-400">{trend}</p>}
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function StatsCards({
  totalSubmissions,
  averageScore,
  currentStreak,
  completionRate,
  isLoading,
}: StatsCardsProps) {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total submissions" value={totalSubmissions} valueColor="purple" />
      <StatCard
        label="Average score"
        value={averageScore !== null ? `${averageScore}%` : '--'}
        valueColor="green"
      />
      <StatCard
        label="Study streak"
        value={currentStreak > 0 ? `${currentStreak} days` : '--'}
        valueColor="orange"
      />
      <StatCard
        label="Completion rate"
        value={completionRate !== null ? `${completionRate}%` : '--'}
      />
    </div>
  )
}
