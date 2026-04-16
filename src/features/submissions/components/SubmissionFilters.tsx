// Filter buttons for submission status
// release delaylanguage: "Feedback ready", "In review", "Sent" (never processing)

import { cn } from '@/shared/lib/cn'

export type SubmissionFilter = 'all' | 'ready' | 'review' | 'sent'

interface SubmissionFiltersProps {
  value: SubmissionFilter
  onChange: (filter: SubmissionFilter) => void
  counts:
    | {
        all: number
        ready: number
        review: number
        sent: number
      }
    | undefined
}

const filters: Array<{ id: SubmissionFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'ready', label: 'Feedback ready' },
  { id: 'review', label: 'In review' },
  { id: 'sent', label: 'Sent' },
]

export function SubmissionFilters({ value, onChange, counts }: SubmissionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter homework">
      {filters.map((filter) => {
        const count = counts?.[filter.id]
        const isActive = value === filter.id

        return (
          <button
            key={filter.id}
            onClick={() => onChange(filter.id)}
            aria-pressed={isActive}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-p-500 text-white'
                : 'bg-g-100 text-g-600 hover:bg-g-200 dark:bg-g-100 dark:text-g-600 dark:hover:bg-g-200'
            )}
          >
            {filter.label}
            {count !== undefined && (
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-xs',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-g-200 text-g-500 dark:bg-g-300 dark:text-g-600'
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
