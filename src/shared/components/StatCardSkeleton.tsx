// Shared stat card skeleton — used across dashboard, performance, past papers, etc.
// Matches StatCard dimensions in performance/StatsCards.tsx.

import { Card, CardContent } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'

interface StatCardSkeletonProps {
  /** Render inside its own Card wrapper. Default true. Set false if parent supplies the Card. */
  withCard?: boolean
}

/**
 * Skeleton placeholder for a single StatCard while data loads.
 *
 * @example
 * // Grid of 4 stat skeletons
 * <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
 *   {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
 * </div>
 */
export function StatCardSkeleton({ withCard = true }: StatCardSkeletonProps = {}) {
  const inner = (
    <>
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="h-8 w-16" />
    </>
  )

  if (!withCard) return <div className="p-4">{inner}</div>

  return (
    <Card>
      <CardContent className="p-4">{inner}</CardContent>
    </Card>
  )
}

/**
 * Grid of stat card skeletons — convenience wrapper.
 *
 * @example
 * {isLoading ? <StatCardSkeletonGrid count={4} /> : <StatsCards ... />}
 */
export function StatCardSkeletonGrid({ count = 4 }: { count?: number } = {}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default StatCardSkeleton
