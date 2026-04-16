// Parent Submissions screen — read-only table of the selected child's homework submissions
// NO upload or submit buttons — parents can only view, not interact

import { useParentChild } from '../context/ParentChildContext'
import { useParentSubmissions } from '../hooks/use-parent-submissions'
import { formatSydney } from '@/shared/lib/tz-utils'

function formatDate(dateStr: string): string {
  return formatSydney(dateStr, 'dayMonth')
}

function scoreLabel(mark: number | null, markTotal: number | null): string {
  if (mark === null || markTotal === null || markTotal === 0) return '—'
  return `${Math.round((mark / markTotal) * 100)}%`
}

export function ParentSubmissionsScreen() {
  const { selectedChild, isLoading: childLoading } = useParentChild()
  const { data: submissions = [], isLoading } = useParentSubmissions()

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
          {selectedChild ? `Homework — ${selectedChild.name}` : 'Homework'}
        </h1>
        <p className="mt-1 text-g-500 dark:text-g-600">Marked submissions</p>
      </div>

      {/* Submissions table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-g-200" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-xl border border-g-200 bg-card p-8 text-center dark:border-g-200">
          <p className="text-g-500 dark:text-g-600">No marked submissions yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-g-200 bg-card dark:border-g-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-g-200 dark:border-g-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-g-500 dark:text-g-600">
                  Title
                </th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium text-g-500 dark:text-g-600 sm:table-cell">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-g-500 dark:text-g-600">
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, idx) => (
                <tr
                  key={sub.id}
                  className={
                    idx < submissions.length - 1 ? 'border-b border-g-200 dark:border-g-200' : ''
                  }
                >
                  <td className="px-4 py-3 text-sm text-g-900 dark:text-white">
                    {sub.homework_title ?? 'Homework'}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-g-500 dark:text-g-600 sm:table-cell">
                    {formatDate(sub.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-g-900 dark:text-white">
                    {scoreLabel(sub.mark, sub.mark_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
