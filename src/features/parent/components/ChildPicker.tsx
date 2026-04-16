// Child selector component shown in the parent sidebar/mobile nav
// Single child: displays name as read-only. Multiple children: shows a dropdown.

import { useParentChild } from '../context/ParentChildContext'

export function ChildPicker() {
  const { children, selectedChild, setSelectedChildId, isLoading } = useParentChild()

  if (isLoading) return <div className="px-3 py-2 text-sm text-g-500">Loading...</div>
  if (children.length === 0) return null

  if (children.length === 1) {
    const onlyChild = children[0]!
    return (
      <div className="border-b border-g-200 px-6 py-3 dark:border-g-200">
        <p className="mb-1 text-xs font-medium uppercase text-g-500 dark:text-g-600">Viewing</p>
        <p className="text-sm font-semibold text-g-900 dark:text-white">{onlyChild.name}</p>
        {onlyChild.year_level && <p className="text-xs text-g-500">{onlyChild.year_level}</p>}
      </div>
    )
  }

  // Multiple children: show dropdown
  return (
    <div className="border-b border-g-200 px-6 py-3 dark:border-g-200">
      <label className="mb-1 block text-xs font-medium uppercase text-g-500 dark:text-g-600">
        Viewing
      </label>
      <select
        value={selectedChild?.id ?? ''}
        onChange={(e) => setSelectedChildId(e.target.value)}
        className="w-full rounded-lg border border-g-300 bg-card px-3 py-2 text-sm font-medium text-g-900 dark:border-g-300 dark:bg-g-100 dark:text-white"
      >
        {children.map((child) => (
          <option key={child.id} value={child.id}>
            {child.name}
            {child.year_level ? ` (${child.year_level})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
