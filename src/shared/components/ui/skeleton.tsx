import { cn } from '../../lib/cn'

/**
 * Skeleton loading component with BEAM purple-tinted pulse.
 *
 * Light mode: Pulses from primary-100 to primary-200 (purple tint)
 * Dark mode: Pulses from gray-800 to gray-700 (subtle purple tint)
 *
 * @example
 * <Skeleton className="h-4 w-[250px]" />
 * <Skeleton className="h-12 w-12 rounded-full" />
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Base skeleton styles with BEAM purple tint
        'animate-skeleton-pulse rounded-md',
        // Light mode: purple tinted
        'bg-primary-100',
        // Dark mode: dark with subtle purple tint
        'dark:bg-muted',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
