// Dashboard header with BEAM branding and overflow menu
// Sticky header with backdrop blur for modern feel

import { OverflowMenu } from './OverflowMenu'

/**
 * Dashboard header component
 *
 * Features:
 * - BEAM logo/brand on left
 * - Overflow menu on right
 * - Sticky positioning with backdrop blur
 * - Responsive: brand text hidden on mobile
 */
export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-g-200 bg-card/80 backdrop-blur-sm dark:border-g-300">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-p-500">
              <span className="text-lg font-bold text-white">B</span>
            </div>
            <span className="hidden font-semibold text-g-900 dark:text-white sm:block">
              BEAM Portal
            </span>
          </div>

          {/* Right side: menu */}
          <OverflowMenu />
        </div>
      </div>
    </header>
  )
}
