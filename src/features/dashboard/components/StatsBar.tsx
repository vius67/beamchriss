import { Clock, CheckCircle2, BookOpen } from 'lucide-react'
import { useStudentStats } from '@/features/dashboard'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/cn'

interface StatItemProps {
  icon: React.ElementType
  label: string
  value: number | string
  className?: string
}

function StatItem({ icon: Icon, label, value, className }: StatItemProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icon className="h-4 w-4 text-g-400" />
      <span className="text-sm text-g-600">
        <span className="font-semibold text-g-900">{value}</span> {label}
      </span>
    </div>
  )
}

export function StatsBar() {
  const { data: stats, isLoading } = useStudentStats()

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-4 rounded-lg border border-g-200 bg-white p-4 dark:border-g-300 dark:bg-transparent">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
      </div>
    )
  }

  const pending = stats?.pending_count ?? 0
  const graded = stats?.graded_count ?? 0
  const total = stats?.total_submissions ?? 0

  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-g-200 bg-white p-4 dark:border-g-300 dark:bg-transparent sm:gap-6">
      <StatItem icon={Clock} label={pending === 1 ? 'pending' : 'pending'} value={pending} />
      <StatItem icon={CheckCircle2} label="marked" value={graded} />
      <StatItem icon={BookOpen} label="total submitted" value={total} />
    </div>
  )
}
